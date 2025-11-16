import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MarketDataResponse {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  timestamp: string;
}

export const useMarketData = (symbol: string, refreshInterval = 60000) => {
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'fetch-market-data',
        {
          body: { symbol },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (functionData.error) {
        throw new Error(functionData.error);
      }

      setData(functionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      
      // Only show toast for configuration errors
      if (errorMessage.includes('configured') || errorMessage.includes('API key')) {
        toast({
          title: "Market Data Unavailable",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up refresh interval
    const interval = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [symbol, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
};
