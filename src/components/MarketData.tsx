import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";

interface MarketDataProps {
  symbol: string;
}

export const MarketData = ({ symbol }: MarketDataProps) => {
  const { data, loading, error, refetch } = useMarketData(symbol);
  
  // Fallback to mock data if real data unavailable
  const price = data?.price ?? 187.35;
  const change = data?.changePercent ?? 2.45;
  const volume = data?.volume ?? "52.3M";
  
  const isPositive = change >= 0;
  const trendColor = isPositive ? "text-bullish" : "text-bearish";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Symbol</p>
          <p className="text-xl font-bold font-mono">{symbol}</p>
          {error && (
            <p className="text-xs text-muted-foreground">Using demo data</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <TrendIcon className={`h-5 w-5 ${trendColor}`} />
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono">${price.toFixed(2)}</span>
          <span className={`text-sm font-semibold ${trendColor} flex items-center gap-1`}>
            {isPositive ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>Vol: {volume}</span>
        </div>
      </div>
    </Card>
  );
};
