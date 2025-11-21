import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { marketDataCache } from "@/lib/marketDataCache";

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
  const [isCached, setIsCached] = useState(false);
  const { toast } = useToast();

  const fetchData = async (skipCache = false) => {
    if (!symbol) return;
    
    // Check cache first unless explicitly skipping
    if (!skipCache) {
      const cachedData = marketDataCache.get<MarketDataResponse>(symbol);
      if (cachedData) {
        setData(cachedData);
        setIsCached(true);
        setError(null);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setIsCached(false);

    try {
      // Ensure user is authenticated before calling the edge function
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError("User not authenticated");
        setData(null);
        setLoading(false);
        return;
      }

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
      // Cache the successful response
      marketDataCache.set(symbol, functionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      
      // Don't show toast, let the component handle error display
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up refresh interval
    const interval = setInterval(() => fetchData(true), refreshInterval);
    
    return () => clearInterval(interval);
  }, [symbol, refreshInterval]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(true),
    isCached 
  };
};
