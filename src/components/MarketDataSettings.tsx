import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Trash2, Loader2, CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ConfiguredProvider {
  id: string;
  provider: string;
  is_active: boolean;
  priority: number;
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
      .select("id, provider, is_active, priority, updated_at")
      .eq("user_id", user.id)
      .order("priority", { ascending: true });
    
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
      // Make a test API call
      const { data, error } = await supabase.functions.invoke("fetch-market-data", {
        body: { symbol: "AAPL" },
      });

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
          description: `${providerNames[data.provider || providerType]} returned price: $${data?.price?.toFixed(2)}`,
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

  const handleMovePriority = async (configId: string, direction: "up" | "down") => {
    if (!user) return;
    setIsLoading(true);

    const currentIndex = configuredProviders.findIndex(p => p.id === configId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= configuredProviders.length) {
      setIsLoading(false);
      return;
    }

    // Swap priorities
    const currentProvider = configuredProviders[currentIndex];
    const swapProvider = configuredProviders[newIndex];

    try {
      // Update both providers' priorities
      await Promise.all([
        supabase
          .from("market_data_configs")
          .update({ priority: swapProvider.priority })
          .eq("id", currentProvider.id),
        supabase
          .from("market_data_configs")
          .update({ priority: currentProvider.priority })
          .eq("id", swapProvider.id),
      ]);

      toast({
        title: "Priority updated",
        description: `${providerNames[currentProvider.provider]} moved ${direction}`,
      });
      fetchConfiguredProviders();
    } catch (error: any) {
      toast({
        title: "Error updating priority",
        description: error.message,
        variant: "destructive",
      });
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

    // Get the next priority number
    const maxPriority = configuredProviders.length > 0 
      ? Math.max(...configuredProviders.map(p => p.priority || 0))
      : 0;

    if (existing) {
      const { error } = await supabase
        .from("market_data_configs")
        .update({ 
          api_key_encrypted: apiKey, 
          updated_at: new Date().toISOString() 
        })
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
          description: `${providerNames[provider]} configuration updated.`,
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
        priority: maxPriority + 1,
      });

      if (error) {
        toast({
          title: "Error saving API key",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Provider added",
          description: `${providerNames[provider]} added as fallback #${maxPriority + 1}.`,
        });
        setApiKey("");
        fetchConfiguredProviders();
      }
    }

    setIsLoading(false);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Market Data Providers</h3>
      </div>

      {/* Priority Explanation */}
      <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>Fallback System:</strong> Providers are tried in order (1st → 2nd → 3rd). 
          If the first provider fails (rate limit, error), the next one is automatically used.
        </p>
      </div>

      {/* Configured Providers List */}
      {configuredProviders.length > 0 && (
        <div className="mb-6 space-y-2">
          <Label className="text-sm font-medium">Provider Priority Order</Label>
          <div className="space-y-3">
            {configuredProviders.map((config, index) => {
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
                      <Badge variant="outline" className="text-xs font-mono">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-sm">
                        {providerNames[config.provider] || config.provider}
                      </span>
                      {testResults[config.id] === "success" && (
                        <CheckCircle className="h-4 w-4 text-bullish" />
                      )}
                      {testResults[config.id] === "error" && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMovePriority(config.id, "up")}
                        disabled={index === 0 || isLoading}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMovePriority(config.id, "down")}
                        disabled={index === configuredProviders.length - 1 || isLoading}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProvider(config.id)}
                        className="text-destructive hover:text-destructive h-7 w-7 p-0"
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
          <p className="text-xs text-muted-foreground mt-2">
            Use ↑↓ arrows to reorder. First provider is tried first, fallbacks used on failure.
          </p>
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
            Add multiple providers for automatic fallback support
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
          {isLoading ? "Saving..." : "Add Provider"}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-background/50 rounded-lg">
        <h4 className="font-semibold mb-2 text-sm">Getting Started:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Finnhub: <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sign up for free</a> (60 calls/min) ⭐ Recommended</li>
          <li>• Alpha Vantage: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get free API key</a> (5 calls/min)</li>
          <li>• IEX Cloud: <a href="https://iexcloud.io/cloud-login#/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Create account</a> (100 calls/sec)</li>
          <li>• Polygon.io: <a href="https://polygon.io/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Register here</a> (5 calls/min)</li>
          <li>• Massive.com: <a href="https://massive.com/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sign up (Pro)</a> (5 calls/min)</li>
        </ul>
      </div>
    </Card>
  );
};