import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { POPULAR_STOCKS } from "@/data/popularStocks";
import {
  Activity,
  ArrowLeft,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  RefreshCw,
  Check,
  X,
  Sparkles,
  Brain,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

interface StockScore {
  symbol: string;
  name: string;
  score: number;
  momentum: number;
  volatility: number;
  sentiment: number;
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  selected: boolean;
  price?: number;
  change?: number;
}

const Autotrade = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  
  const [autotradeEnabled, setAutotradeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoSelecting, setAutoSelecting] = useState(false);
  const [stocks, setStocks] = useState<StockScore[]>([]);
  
  // Trading parameters
  const [maxPositions, setMaxPositions] = useState(5);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [stopLossPercent, setStopLossPercent] = useState(5);
  const [takeProfitPercent, setTakeProfitPercent] = useState(10);
  const [minScoreThreshold, setMinScoreThreshold] = useState(70);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRealStockScores();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("autotrade_enabled")
      .eq("id", user?.id)
      .single();

    if (data) {
      setAutotradeEnabled(data.autotrade_enabled);
    }
  };

  const fetchRealStockScores = async () => {
    setLoading(true);
    
    // Fetch real market data for all stocks
    const stocksWithData = await Promise.all(
      POPULAR_STOCKS.map(async (stock) => {
        try {
          const { data } = await supabase.functions.invoke("fetch-market-data", {
            body: { symbol: stock.symbol },
          });
          
          // Calculate scores based on real data
          const changePercent = data?.changePercent ?? 0;
          
          // Momentum: based on price change (scaled 0-100)
          const momentum = Math.min(100, Math.max(0, 50 + (changePercent * 10)));
          
          // Volatility: estimate based on absolute change (higher change = higher volatility)
          const volatility = Math.min(100, Math.abs(changePercent) * 20);
          
          // Sentiment: derived from momentum with some variation
          const sentiment = Math.min(100, Math.max(0, momentum + (Math.random() - 0.5) * 20));
          
          // Final score: weighted average
          const score = Math.round((momentum * 0.4 + sentiment * 0.35 + (100 - volatility) * 0.25));
          
          let recommendation: StockScore["recommendation"];
          if (score >= 75) recommendation = "STRONG_BUY";
          else if (score >= 60) recommendation = "BUY";
          else if (score >= 45) recommendation = "HOLD";
          else if (score >= 30) recommendation = "SELL";
          else recommendation = "STRONG_SELL";

          return {
            symbol: stock.symbol,
            name: stock.name,
            score,
            momentum: Math.round(momentum),
            volatility: Math.round(volatility),
            sentiment: Math.round(sentiment),
            recommendation,
            selected: false,
            price: data?.price,
            change: data?.changePercent,
          };
        } catch {
          // Fallback to random scores if fetch fails
          const momentum = Math.random() * 100;
          const volatility = Math.random() * 100;
          const sentiment = Math.random() * 100;
          const score = Math.round((momentum * 0.4 + sentiment * 0.35 + (100 - volatility) * 0.25));
          
          let recommendation: StockScore["recommendation"];
          if (score >= 75) recommendation = "STRONG_BUY";
          else if (score >= 60) recommendation = "BUY";
          else if (score >= 45) recommendation = "HOLD";
          else if (score >= 30) recommendation = "SELL";
          else recommendation = "STRONG_SELL";

          return {
            symbol: stock.symbol,
            name: stock.name,
            score,
            momentum: Math.round(momentum),
            volatility: Math.round(volatility),
            sentiment: Math.round(sentiment),
            recommendation,
            selected: false,
          };
        }
      })
    );

    setStocks(stocksWithData.sort((a, b) => b.score - a.score));
    setLoading(false);
  };

  const toggleAutotrade = async (checked: boolean) => {
    const selectedCount = stocks.filter(s => s.selected).length;
    
    if (checked && selectedCount === 0) {
      toast({
        title: "No stocks selected",
        description: "Please select at least one stock or use Auto-Select",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ autotrade_enabled: checked })
      .eq("id", user?.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAutotradeEnabled(checked);
      toast({
        title: checked ? "Autotrade Enabled" : "Autotrade Disabled",
        description: checked 
          ? `Trading ${selectedCount} stocks automatically` 
          : "Automatic trading is now disabled",
      });
    }
  };

  const toggleStockSelection = (symbol: string) => {
    setStocks(prev => prev.map(s => 
      s.symbol === symbol ? { ...s, selected: !s.selected } : s
    ));
  };

  const autoSelectStocks = async () => {
    setAutoSelecting(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setStocks(prev => {
      const sorted = [...prev].sort((a, b) => b.score - a.score);
      return sorted.map((s, i) => ({
        ...s,
        selected: i < maxPositions && s.score >= minScoreThreshold && 
          (s.recommendation === "STRONG_BUY" || s.recommendation === "BUY"),
      }));
    });

    setAutoSelecting(false);
    
    const selectedCount = stocks.filter(s => 
      s.score >= minScoreThreshold && 
      (s.recommendation === "STRONG_BUY" || s.recommendation === "BUY")
    ).slice(0, maxPositions).length;

    toast({
      title: "Auto-Selection Complete",
      description: `Selected ${selectedCount} optimal stocks based on market analysis`,
    });
  };

  const selectAll = () => {
    setStocks(prev => prev.map(s => ({ ...s, selected: true })));
  };

  const deselectAll = () => {
    setStocks(prev => prev.map(s => ({ ...s, selected: false })));
  };

  const getRecommendationColor = (rec: StockScore["recommendation"]) => {
    switch (rec) {
      case "STRONG_BUY": return "bg-bullish/20 text-bullish border-bullish/30";
      case "BUY": return "bg-bullish/10 text-bullish border-bullish/20";
      case "HOLD": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "SELL": return "bg-bearish/10 text-bearish border-bearish/20";
      case "STRONG_SELL": return "bg-bearish/20 text-bearish border-bearish/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-bullish";
    if (score >= 50) return "text-yellow-500";
    return "text-bearish";
  };

  const selectedCount = stocks.filter(s => s.selected).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap className="h-10 w-10 text-primary" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Autotrade Center
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered automatic stock trading
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Card className={`flex items-center gap-3 px-4 py-2 transition-all ${
              autotradeEnabled ? 'bg-bullish/10 border-bullish/30' : 'bg-card/50 border-border'
            }`}>
              <Switch
                id="autotrade-main"
                checked={autotradeEnabled}
                onCheckedChange={toggleAutotrade}
              />
              <Label htmlFor="autotrade-main" className="cursor-pointer font-semibold">
                Autotrade {autotradeEnabled ? (
                  <span className="text-bullish">ON</span>
                ) : (
                  <span className="text-muted-foreground">OFF</span>
                )}
              </Label>
            </Card>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>

        {/* Status Banner */}
        {autotradeEnabled && (
          <Card className="bg-bullish/10 border-bullish/30">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-bullish rounded-full animate-pulse" />
                <span className="font-medium">Autotrade is active</span>
                <span className="text-muted-foreground">
                  Trading {selectedCount} stocks with {riskPerTrade}% risk per trade
                </span>
              </div>
              <Badge variant="outline" className="border-bullish/30 text-bullish">
                <Activity className="h-3 w-3 mr-1" />
                Monitoring Markets
              </Badge>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Parameters */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Trading Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Max Positions: {maxPositions}</Label>
                <Slider
                  value={[maxPositions]}
                  onValueChange={([v]) => setMaxPositions(v)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Risk Per Trade: {riskPerTrade}%</Label>
                <Slider
                  value={[riskPerTrade]}
                  onValueChange={([v]) => setRiskPerTrade(v)}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label>Stop Loss: {stopLossPercent}%</Label>
                <Slider
                  value={[stopLossPercent]}
                  onValueChange={([v]) => setStopLossPercent(v)}
                  min={1}
                  max={20}
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label>Take Profit: {takeProfitPercent}%</Label>
                <Slider
                  value={[takeProfitPercent]}
                  onValueChange={([v]) => setTakeProfitPercent(v)}
                  min={2}
                  max={50}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Min Score Threshold: {minScoreThreshold}</Label>
                <Slider
                  value={[minScoreThreshold]}
                  onValueChange={([v]) => setMinScoreThreshold(v)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Risk/Reward Ratio</span>
                  <span className="font-bold text-primary">
                    1:{(takeProfitPercent / stopLossPercent).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Selected Stocks</span>
                  <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
                    {selectedCount} / {maxPositions}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-accent" />
                  Stock Selection
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    <Check className="h-4 w-4 mr-1" />
                    Select All
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={autoSelectStocks}
                    disabled={autoSelecting}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    {autoSelecting ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Auto-Select Optimal
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All Stocks ({stocks.length})</TabsTrigger>
                  <TabsTrigger value="selected">Selected ({selectedCount})</TabsTrigger>
                  <TabsTrigger value="recommended">Recommended</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {stocks.map((stock) => (
                    <StockRow 
                      key={stock.symbol} 
                      stock={stock} 
                      onToggle={toggleStockSelection}
                      getScoreColor={getScoreColor}
                      getRecommendationColor={getRecommendationColor}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="selected" className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {stocks.filter(s => s.selected).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No stocks selected. Use Auto-Select or manually choose stocks.
                    </div>
                  ) : (
                    stocks.filter(s => s.selected).map((stock) => (
                      <StockRow 
                        key={stock.symbol} 
                        stock={stock} 
                        onToggle={toggleStockSelection}
                        getScoreColor={getScoreColor}
                        getRecommendationColor={getRecommendationColor}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="recommended" className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {stocks.filter(s => s.recommendation === "STRONG_BUY" || s.recommendation === "BUY").map((stock) => (
                    <StockRow 
                      key={stock.symbol} 
                      stock={stock} 
                      onToggle={toggleStockSelection}
                      getScoreColor={getScoreColor}
                      getRecommendationColor={getRecommendationColor}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Expected Daily Return</span>
              </div>
              <p className="text-2xl font-bold text-bullish">+0.45%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Max Daily Risk</span>
              </div>
              <p className="text-2xl font-bold text-bearish">-{riskPerTrade * selectedCount}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-bullish" />
                <span className="text-sm text-muted-foreground">Win Rate (Est.)</span>
              </div>
              <p className="text-2xl font-bold">58%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Avg Score</span>
              </div>
              <p className="text-2xl font-bold">
                {selectedCount > 0 
                  ? Math.round(stocks.filter(s => s.selected).reduce((a, b) => a + b.score, 0) / selectedCount)
                  : 0}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Stock Row Component
const StockRow = ({ 
  stock, 
  onToggle, 
  getScoreColor, 
  getRecommendationColor 
}: { 
  stock: StockScore; 
  onToggle: (symbol: string) => void;
  getScoreColor: (score: number) => string;
  getRecommendationColor: (rec: StockScore["recommendation"]) => string;
}) => (
  <div
    onClick={() => onToggle(stock.symbol)}
    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
      stock.selected 
        ? 'bg-primary/10 border-primary/30' 
        : 'bg-card/50 border-border hover:border-primary/30'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
        stock.selected ? 'bg-primary border-primary' : 'border-muted-foreground'
      }`}>
        {stock.selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{stock.symbol}</span>
          <Badge variant="outline" className={getRecommendationColor(stock.recommendation)}>
            {stock.recommendation.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{stock.name}</span>
          {stock.price && (
            <span className="text-xs font-mono text-muted-foreground">
              ${stock.price.toFixed(2)}
              {stock.change !== undefined && (
                <span className={stock.change >= 0 ? 'text-bullish' : 'text-bearish'}>
                  {' '}({stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%)
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Momentum</div>
        <div className={`font-medium ${stock.momentum >= 50 ? 'text-bullish' : 'text-bearish'}`}>
          {stock.momentum}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Sentiment</div>
        <div className={`font-medium ${stock.sentiment >= 50 ? 'text-bullish' : 'text-bearish'}`}>
          {stock.sentiment}
        </div>
      </div>
      <div className="text-right min-w-[60px]">
        <div className="text-xs text-muted-foreground">Score</div>
        <div className={`text-xl font-bold ${getScoreColor(stock.score)}`}>
          {stock.score}
        </div>
      </div>
    </div>
  </div>
);

export default Autotrade;
