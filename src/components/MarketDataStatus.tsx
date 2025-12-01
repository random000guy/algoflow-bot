import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const MarketDataStatus = () => {
  const [provider, setProvider] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkProviderStatus();
  }, []);

  const checkProviderStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsConnected(false);
        setLoading(false);
        return;
      }

      const { data: config } = await supabase
        .from('market_data_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (config && config.api_key_encrypted) {
        setProvider(config.provider === 'alpha_vantage' ? 'Alpha Vantage' : 'Finnhub');
        setIsConnected(true);
        setError(false);
      } else {
        setProvider(null);
        setIsConnected(false);
        setError(true);
      }
    } catch (error) {
      console.error('Error checking provider status:', error);
      setIsConnected(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {error && !provider && (
        <Alert variant="default" className="bg-gradient-to-r from-muted/50 to-muted/30 border-border/50 backdrop-blur-sm">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">No market data provider configured. Using demo data.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings")}
              className="ml-4 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Configure Provider
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {provider && (
        <Card className="p-4 bg-gradient-to-r from-card/80 to-card/60 border-border/50 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-bullish' : 'bg-bearish'}`} />
                {isConnected && (
                  <div className="absolute inset-0 h-3 w-3 rounded-full bg-bullish animate-ping opacity-75" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Market Data: {provider}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isConnected ? (
                    <>
                      <span className="text-bullish">●</span> Connected & Active
                    </>
                  ) : (
                    <>
                      <span className="text-bearish">●</span> Disconnected
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/settings")}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              Settings
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
