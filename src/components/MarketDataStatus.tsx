import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Wifi, WifiOff, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const MarketDataStatus = () => {
  const [provider, setProvider] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
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
      } else {
        setProvider(null);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking provider status:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="p-3 bg-card/50 border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Market Data:</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                <span>{provider}</span>
              </Badge>
              <Badge variant="outline" className="bg-bullish/10 text-bullish border-bullish/30">
                Connected
              </Badge>
            </>
          ) : (
            <>
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                <span>No Provider</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="h-7 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
