import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Check, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface ConfiguredProvider {
  id: string;
  provider: string;
  is_active: boolean;
  updated_at: string;
}

const providerNames: Record<string, string> = {
  alpha_vantage: "Alpha Vantage",
  finnhub: "Finnhub",
  iex_cloud: "IEX Cloud",
  polygon: "Polygon.io",
  massive: "Massive.com (Polygon)",
};

export const MarketDataSettings = () => {
  const [provider, setProvider] = useState("alpha_vantage");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<ConfiguredProvider[]>([]);
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
    }
  };

  useEffect(() => {
    fetchConfiguredProviders();
  }, [user]);

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
          <div className="space-y-2">
            {configuredProviders.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {providerNames[config.provider] || config.provider}
                  </span>
                  {config.is_active && (
                    <Badge variant="default" className="text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
            ))}
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
          <li>• Alpha Vantage: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get free API key</a></li>
          <li>• Finnhub: <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sign up for free</a></li>
          <li>• IEX Cloud: <a href="https://iexcloud.io/cloud-login#/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Create account</a></li>
          <li>• Polygon.io: <a href="https://polygon.io/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Register here</a></li>
          <li>• Massive.com: <a href="https://massive.com/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sign up (Pro)</a></li>
        </ul>
      </div>
    </Card>
  );
};
