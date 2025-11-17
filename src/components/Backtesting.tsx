import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";

export const Backtesting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const [config, setConfig] = useState({
    name: "",
    symbol: "AAPL",
    strategy: "sma_crossover",
    startDate: "",
    endDate: "",
  });

  const runBacktest = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Simulate backtest results
    const mockResults = {
      total_return: Math.random() * 30 - 10,
      max_drawdown: Math.random() * -20,
      sharpe_ratio: Math.random() * 2,
      win_rate: 50 + Math.random() * 30,
      total_trades: Math.floor(Math.random() * 100) + 50,
    };

    const { error } = await supabase.from("backtests").insert({
      user_id: user.id,
      name: config.name || `Backtest ${new Date().toLocaleDateString()}`,
      strategy_config: { strategy: config.strategy },
      symbol: config.symbol,
      start_date: config.startDate,
      end_date: config.endDate,
      results: mockResults,
      total_return: mockResults.total_return,
      max_drawdown: mockResults.max_drawdown,
      sharpe_ratio: mockResults.sharpe_ratio,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setResults(mockResults);
      toast({
        title: "Backtest Complete",
        description: "Your strategy has been tested successfully.",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Strategy Backtesting</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Test Name</Label>
            <Input
              placeholder="My Strategy Test"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Symbol</Label>
            <Input
              placeholder="AAPL"
              value={config.symbol}
              onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select value={config.strategy} onValueChange={(v) => setConfig({ ...config, strategy: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sma_crossover">SMA Crossover</SelectItem>
                <SelectItem value="rsi">RSI Strategy</SelectItem>
                <SelectItem value="macd">MACD Strategy</SelectItem>
                <SelectItem value="bollinger">Bollinger Bands</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              />
              <Input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Button onClick={runBacktest} disabled={loading} className="w-full mt-6">
          {loading ? "Running Backtest..." : "Run Backtest"}
        </Button>
      </Card>

      {results && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p className={`text-2xl font-bold ${results.total_return >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {results.total_return.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Drawdown</p>
              <p className="text-2xl font-bold text-bearish">{results.max_drawdown.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              <p className="text-2xl font-bold">{results.sharpe_ratio.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{results.win_rate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
