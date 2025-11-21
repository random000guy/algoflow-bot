import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMarketData } from "@/hooks/useMarketData";
import { TrendingUp, TrendingDown, X, Plus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StockData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  high: number;
  low: number;
}

const StockCard = ({ symbol, onRemove }: { symbol: string; onRemove: () => void }) => {
  const { data, loading } = useMarketData(symbol, 60000);

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-48 bg-muted rounded" />
      </Card>
    );
  }

  const mockChartData = Array.from({ length: 20 }, (_, i) => ({
    value: data?.price ? data.price + (Math.random() - 0.5) * 5 : 100 + (Math.random() - 0.5) * 5
  }));

  return (
    <Card className="p-6 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{symbol}</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold">${data?.price?.toFixed(2) || "0.00"}</span>
            <span className={`flex items-center gap-1 text-sm font-semibold ${
              (data?.change || 0) >= 0 ? 'text-bullish' : 'text-bearish'
            }`}>
              {(data?.change || 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {(data?.change || 0) >= 0 ? '+' : ''}{data?.change?.toFixed(2) || '0.00'}%
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={mockChartData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={(data?.change || 0) >= 0 ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))'} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="font-semibold">{(data?.volume || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">High</p>
            <p className="font-semibold">${(data?.price ? data.price * 1.02 : 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Low</p>
            <p className="font-semibold">${(data?.price ? data.price * 0.98 : 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Entry</p>
            <p className="font-semibold">${(data?.price || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const StockComparison = () => {
  const [symbols, setSymbols] = useState<string[]>(["AAPL", "GOOGL"]);
  const [newSymbol, setNewSymbol] = useState("");
  const { toast } = useToast();

  const addSymbol = () => {
    if (!newSymbol) {
      toast({
        title: "Enter a symbol",
        description: "Please enter a stock symbol to compare",
        variant: "destructive",
      });
      return;
    }

    if (symbols.includes(newSymbol.toUpperCase())) {
      toast({
        title: "Already added",
        description: "This symbol is already in the comparison",
        variant: "destructive",
      });
      return;
    }

    if (symbols.length >= 4) {
      toast({
        title: "Maximum reached",
        description: "You can compare up to 4 stocks at a time",
        variant: "destructive",
      });
      return;
    }

    setSymbols([...symbols, newSymbol.toUpperCase()]);
    setNewSymbol("");
  };

  const removeSymbol = (symbol: string) => {
    setSymbols(symbols.filter(s => s !== symbol));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex gap-4">
          <Input
            placeholder="Enter stock symbol (e.g., TSLA)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
            className="flex-1"
          />
          <Button onClick={addSymbol}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {symbols.map((symbol) => (
          <StockCard
            key={symbol}
            symbol={symbol}
            onRemove={() => removeSymbol(symbol)}
          />
        ))}
      </div>

      {symbols.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Add stocks to start comparing</p>
        </Card>
      )}
    </div>
  );
};
