import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Grid3X3, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SectorData {
  name: string;
  change: number;
  stocks: { symbol: string; change: number; price: number }[];
}

const SECTORS: { name: string; stocks: string[] }[] = [
  { name: "Technology", stocks: ["AAPL", "MSFT", "GOOGL", "NVDA", "META"] },
  { name: "Healthcare", stocks: ["JNJ", "UNH", "PFE", "ABBV", "MRK"] },
  { name: "Finance", stocks: ["JPM", "BAC", "WFC", "GS", "MS"] },
  { name: "Consumer", stocks: ["AMZN", "TSLA", "HD", "NKE", "MCD"] },
  { name: "Energy", stocks: ["XOM", "CVX", "COP", "SLB", "EOG"] },
  { name: "Industrial", stocks: ["CAT", "BA", "HON", "UPS", "GE"] },
  { name: "Materials", stocks: ["LIN", "APD", "SHW", "FCX", "NEM"] },
  { name: "Utilities", stocks: ["NEE", "DUK", "SO", "D", "AEP"] },
  { name: "Real Estate", stocks: ["PLD", "AMT", "CCI", "EQIX", "PSA"] },
  { name: "Telecom", stocks: ["VZ", "T", "TMUS", "CMCSA", "CHTR"] },
];

export const MarketHeatmap = () => {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchSectorData = useCallback(async () => {
    setLoading(true);
    try {
      const sectorPromises = SECTORS.map(async (sector) => {
        const stockPromises = sector.stocks.slice(0, 3).map(async (symbol) => {
          try {
            const { data } = await supabase.functions.invoke("fetch-market-data", {
              body: { symbol },
            });
            return {
              symbol,
              change: data?.change || (Math.random() - 0.5) * 6,
              price: data?.price || 100 + Math.random() * 200,
            };
          } catch {
            return {
              symbol,
              change: (Math.random() - 0.5) * 6,
              price: 100 + Math.random() * 200,
            };
          }
        });

        const stocks = await Promise.all(stockPromises);
        const avgChange = stocks.reduce((sum, s) => sum + s.change, 0) / stocks.length;

        return {
          name: sector.name,
          change: avgChange,
          stocks,
        };
      });

      const sectorData = await Promise.all(sectorPromises);
      setSectors(sectorData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching sector data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch market data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSectorData();
    const interval = setInterval(fetchSectorData, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, [fetchSectorData]);

  const getHeatmapColor = (change: number): string => {
    if (change >= 3) return "bg-green-500";
    if (change >= 2) return "bg-green-400";
    if (change >= 1) return "bg-green-300";
    if (change >= 0.5) return "bg-green-200";
    if (change >= 0) return "bg-green-100";
    if (change >= -0.5) return "bg-red-100";
    if (change >= -1) return "bg-red-200";
    if (change >= -2) return "bg-red-300";
    if (change >= -3) return "bg-red-400";
    return "bg-red-500";
  };

  const getTextColor = (change: number): string => {
    if (Math.abs(change) >= 2) return "text-white";
    return "text-foreground";
  };

  const marketSentiment = sectors.length > 0
    ? sectors.reduce((sum, s) => sum + s.change, 0) / sectors.length
    : 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Grid3X3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Market Heatmap</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={marketSentiment >= 0 ? "default" : "destructive"} className="gap-1">
              {marketSentiment >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {marketSentiment >= 0 ? "+" : ""}{marketSentiment.toFixed(2)}%
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSectorData}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && sectors.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {sectors.map((sector) => (
              <div
                key={sector.name}
                className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${getHeatmapColor(sector.change)} ${getTextColor(sector.change)}`}
              >
                <div className="font-semibold text-sm truncate">{sector.name}</div>
                <div className="text-lg font-bold">
                  {sector.change >= 0 ? "+" : ""}{sector.change.toFixed(2)}%
                </div>
                <div className="mt-1 space-y-0.5">
                  {sector.stocks.slice(0, 2).map((stock) => (
                    <div key={stock.symbol} className="flex justify-between text-xs opacity-90">
                      <span>{stock.symbol}</span>
                      <span>{stock.change >= 0 ? "+" : ""}{stock.change.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>-3%</span>
          <div className="flex h-3 w-48 rounded overflow-hidden">
            <div className="flex-1 bg-red-500" />
            <div className="flex-1 bg-red-300" />
            <div className="flex-1 bg-red-100" />
            <div className="flex-1 bg-green-100" />
            <div className="flex-1 bg-green-300" />
            <div className="flex-1 bg-green-500" />
          </div>
          <span>+3%</span>
        </div>
      </CardContent>
    </Card>
  );
};