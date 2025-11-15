import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MarketDataProps {
  symbol: string;
  price: number;
  change: number;
  volume: string;
  trend: "up" | "down" | "neutral";
}

export const MarketData = ({ symbol, price, change, volume, trend }: MarketDataProps) => {
  const isPositive = change >= 0;
  const trendColor = isPositive ? "text-bullish" : "text-bearish";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Symbol</p>
          <p className="text-xl font-bold font-mono">{symbol}</p>
        </div>
        <TrendIcon className={`h-5 w-5 ${trendColor}`} />
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
