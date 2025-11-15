import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, TrendingDown, X } from "lucide-react";

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
}

interface WatchlistProps {
  items: WatchlistItem[];
  onRemove: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

export const Watchlist = ({ items, onRemove, onSelect }: WatchlistProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Watchlist</h3>
        <Badge variant="secondary" className="ml-auto">
          {items.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isPositive = item.change >= 0;
          return (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-data-bg border border-data-border hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => onSelect(item.symbol)}
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-bold font-mono">{item.symbol}</p>
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${isPositive ? "text-bullish" : "text-bearish"}`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold font-mono">
                    {isPositive ? "+" : ""}{item.change.toFixed(2)}%
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.symbol);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No symbols in watchlist</p>
          </div>
        )}
      </div>
    </Card>
  );
};
