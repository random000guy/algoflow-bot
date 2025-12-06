import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Check, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ConfiguredProvider {
  id: string;
  provider: string;
  is_active: boolean;
  updated_at: string;
}

interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime?: string;
}

const providerNames: Record<string, string> = {
  alpha_vantage: "Alpha Vantage",
  finnhub: "Finnhub",
  iex_cloud: "IEX Cloud",
  polygon: "Polygon.io",
  massive: "Massive.com (Polygon)",
};

const providerRateLimits: Record<string, { limit: number; period: string }> = {
  alpha_vantage: { limit: 5, period: "minute" },
  finnhub: { limit: 60, period: "minute" },
  iex_cloud: { limit: 100, period: "second" },
  polygon: { limit: 5, period: "minute" },
  massive: { limit: 5, period: "minute" },
};

export const MarketDataSettings = () => {
  const [provider, setProvider] = useState("alpha_vantage");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<ConfiguredProvider[]>([]);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, "success" | "error" | null>>({});
  const [rateLimits, setRateLimits] = useState<Record<string, RateLimitInfo>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchConfiguredProviders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("market_data_configs")
      .select("id, provider, is_active, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    
    if (data) {
      setConfiguredProviders(data);
      // Initialize rate limits for each provider
      const limits: Record<string, RateLimitInfo> = {};
      data.forEach(config => {
        const providerLimit = providerRateLimits[config.provider];
        if (providerLimit) {
          limits[config.id] = {
            remaining: providerLimit.limit,
            limit: providerLimit.limit,
          };
        }
      });
      setRateLimits(limits);
    }
  };

  useEffect(() => {
    fetchConfiguredProviders();
  }, [user]);

  const handleTestConnection = async (configId: string, providerType: string) => {
    setTestingProvider(configId);
    setTestResults(prev => ({ ...prev, [configId]: null }));

    try {
      // Temporarily set this as active to test it
      const { error: activateError } = await supabase
        .from("market_data_configs")
        .update({ is_active: true })
        .eq("id", configId);

      if (activateError) throw activateError;

      // Make a test API call
      const { data, error } = await supabase.functions.invoke("fetch-market-data", {
        body: { symbol: "AAPL" },
      });

      // Restore previous active states
      await fetchConfiguredProviders();

      if (error || data?.error) {
        setTestResults(prev => ({ ...prev, [configId]: "error" }));
        toast({
          title: "Connection Failed",
          description: data?.error || error?.message || "Could not connect to provider",
          variant: "destructive",
        });
      } else {
        setTestResults(prev => ({ ...prev, [configId]: "success" }));
        // Update rate limit estimate
        const providerLimit = providerRateLimits[providerType];
        if (providerLimit) {
          setRateLimits(prev => ({
            ...prev,
            [configId]: {
              remaining: Math.max(0, (prev[configId]?.remaining ?? providerLimit.limit) - 1),
              limit: providerLimit.limit,
            }
          }));
        }
        toast({
          title: "Connection Successful",
          description: `${providerNames[providerType]} is working correctly. Price: $${data?.price}`,
        });
      }
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [configId]: "error" }));
      toast({
        title: "Test Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSetPrimary = async (configId: string) => {
    if (!user) return;
    setIsLoading(true);

    // First, deactivate all providers
    await supabase
      .from("market_data_configs")
      .update({ is_active: false })
      .eq("user_id", user.id);

    // Then activate the selected one
    const { error } = await supabase
      .from("market_data_configs")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", configId);

    if (error) {
      toast({
        title: "Error setting primary provider",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Primary provider updated",
        description: "Your market data will now come from the selected provider.",
      });
      fetchConfiguredProviders();
    }
    setIsLoading(false);
  };

  const handleDeleteProvider = async (configId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("market_data_configs")
      .delete()
      .eq("id", configId);

    if (error) {
      toast({
        title: "Error deleting provider",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Provider removed",
        description: "The API configuration has been deleted.",
      });
      fetchConfiguredProviders();
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    // Check if config exists for this provider
    const { data: existing } = await supabase
      .from("market_data_configs")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .maybeSingle();

    // Deactivate all other providers when adding/updating
    await supabase
      .from("market_data_configs")
      .update({ is_active: false })
      .eq("user_id", user.id);

    if (existing) {
      const { error } = await supabase
        .from("market_data_configs")
        .update({ api_key_encrypted: apiKey, is_active: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) {
        toast({
          title: "Error updating API key",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "API Key updated",
          description: "This provider is now your primary data source.",
        });
        setApiKey("");
        fetchConfiguredProviders();
      }
    } else {
      const { error } = await supabase.from("market_data_configs").insert({
        user_id: user.id,
        provider: provider,
        api_key_encrypted: apiKey,
        is_active: true,
      });

      if (error) {
        toast({
          title: "Error saving API key",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "API Key saved",
          description: "This provider is now your primary data source.",
        });
        setApiKey("");
        fetchConfiguredProviders();
      }
    }

    setIsLoading(false);
  };

  const activeProvider = configuredProviders.find(p => p.is_active);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Market Data Provider</h3>
      </div>

      {/* Configured Providers List */}
      {configuredProviders.length > 0 && (
        <div className="mb-6 space-y-2">
          <Label className="text-sm font-medium">Configured Providers</Label>
          <div className="space-y-3">
            {configuredProviders.map((config) => {
              const providerLimit = providerRateLimits[config.provider];
              const rateInfo = rateLimits[config.id];
              const usagePercent = rateInfo 
                ? ((rateInfo.limit - rateInfo.remaining) / rateInfo.limit) * 100 
                : 0;

              return (
                <div
                  key={config.id}
                  className="p-3 rounded-lg bg-background/50 border border-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {providerNames[config.provider] || config.provider}
                      </span>
                      {config.is_active && (
                        <Badge variant="default" className="text-xs">
                          Primary
                        </Badge>
                      )}
                      {testResults[config.id] === "success" && (
                        <CheckCircle className="h-4 w-4 text-bullish" />
                      )}
                      {testResults[config.id] === "error" && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(config.id, config.provider)}
                        disabled={testingProvider === config.id}
                      >
                        {testingProvider === config.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Test"
                        )}
                      </Button>
                      {!config.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(config.id)}
                          disabled={isLoading}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProvider(config.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Rate Limit Indicator */}
                  {providerLimit && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Rate Limit: {providerLimit.limit} calls/{providerLimit.period}</span>
                        <span>{rateInfo?.remaining ?? providerLimit.limit} remaining</span>
                      </div>
                      <Progress 
                        value={usagePercent} 
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {activeProvider && (
            <p className="text-xs text-muted-foreground mt-2">
              Currently using: <span className="font-medium text-foreground">{providerNames[activeProvider.provider]}</span>
            </p>
          )}
        </div>
      )}

      {/* Add/Update Provider Form */}
      <form onSubmit={handleSaveConfig} className="space-y-4">
        <div className="space-y-2">
          <Label>Add or Update Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alpha_vantage">Alpha Vantage</SelectItem>
              <SelectItem value="finnhub">Finnhub</SelectItem>
              <SelectItem value="iex_cloud">IEX Cloud</SelectItem>
              <SelectItem value="polygon">Polygon.io</SelectItem>
              <SelectItem value="massive">Massive.com (Polygon)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select a provider to add or update its API key
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Get your free API key from the provider's website
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save & Set as Primary"}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-background/50 rounded-lg">
        <h4 className="font-semibold mb-2 text-sm">Getting Started:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Alpha Vantage: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get free API key</a> (5 calls/min)</li>
          <li>• Finnhub: <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sign up for free</a> (60 calls/min)</li>
          <li>• IEX Cloud: <a href="https://iexcloud.io/cloud-login#/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Create account</a> (100 calls/sec)</li>
          <li>• Polygon.io: <a href="https://polygon.io/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Register here</a> (5 calls/min)</li>
          <li>• Massive.com: <a href="https://massive.com/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sign up (Pro)</a> (5 calls/min)</li>
        </ul>
      </div>
    </Card>
  );
};
