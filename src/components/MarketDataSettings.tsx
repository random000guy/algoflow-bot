import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const MarketDataSettings = () => {
  const [provider, setProvider] = useState("alpha_vantage");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    // Check if config exists
    const { data: existing } = await supabase
      .from("market_data_configs")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("market_data_configs")
        .update({ api_key_encrypted: apiKey, is_active: true })
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
          description: "Real market data is now enabled.",
        });
      }
    } else {
      // Insert new
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
          description: "Real market data is now enabled.",
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Market Data Provider</h3>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alpha_vantage">Alpha Vantage</SelectItem>
              <SelectItem value="finnhub">Finnhub</SelectItem>
              <SelectItem value="iex_cloud">IEX Cloud</SelectItem>
              <SelectItem value="polygon">Polygon.io</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose your preferred market data provider
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
          {isLoading ? "Saving..." : "Save Configuration"}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-background/50 rounded-lg">
        <h4 className="font-semibold mb-2 text-sm">Getting Started:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Alpha Vantage: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get free API key</a></li>
          <li>• Finnhub: <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sign up for free</a></li>
          <li>• IEX Cloud: <a href="https://iexcloud.io/cloud-login#/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Create account</a></li>
          <li>• Polygon.io: <a href="https://polygon.io/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Register here</a></li>
        </ul>
      </div>
    </Card>
  );
};
