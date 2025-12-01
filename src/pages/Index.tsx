import { useState, useEffect } from "react";
import { MarketData } from "@/components/MarketData";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { TradingSignal } from "@/components/TradingSignal";
import { RiskManager } from "@/components/RiskManager";
import { OrderEntry } from "@/components/OrderEntry";
import { Watchlist } from "@/components/Watchlist";
import { Portfolio } from "@/components/Portfolio";
import { TradingHistory } from "@/components/TradingHistory";
import { Backtesting } from "@/components/Backtesting";
import { PriceAlerts } from "@/components/PriceAlerts";
import { AdminApproval } from "@/components/AdminApproval";
import { StrategyBuilder } from "@/components/StrategyBuilder";
import { PaperTrading } from "@/components/PaperTrading";
import { AdvancedChart } from "@/components/AdvancedChart";
import { NewsArticles } from "@/components/NewsArticles";
import { StockComparison } from "@/components/StockComparison";
import { MarketDataStatus } from "@/components/MarketDataStatus";
import { HistoricalChart } from "@/components/HistoricalChart";
import { usePriceAlertNotifications } from "@/hooks/usePriceAlertNotifications";
import { Activity, Settings as SettingsIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMarketData } from "@/hooks/useMarketData";

const Index = () => {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [autotradeEnabled, setAutotradeEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const { error: marketDataError } = useMarketData(selectedSymbol);
  
  // Enable price alert notifications
  usePriceAlertNotifications();

  const [watchlistItems, setWatchlistItems] = useState<Array<{ symbol: string; price: number; change: number }>>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWatchlist();
    }
  }, [user]);

  // Auto-refresh watchlist every 45 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchWatchlist();
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, [user]);

  const fetchWatchlist = async () => {
    const { data: watchlistData } = await supabase
      .from("watchlist")
      .select("symbol")
      .eq("user_id", user?.id);

    if (watchlistData) {
      // Fetch market data for each symbol
      const itemsWithPrices = await Promise.all(
        watchlistData.map(async (item) => {
          try {
            const { data } = await supabase.functions.invoke("fetch-market-data", {
              body: { symbol: item.symbol },
            });
            
            return {
              symbol: item.symbol,
              price: data?.price || 0,
              change: data?.change || 0,
            };
          } catch {
            // Return symbol with demo data if fetch fails
            return {
              symbol: item.symbol,
              price: 0,
              change: 0,
            };
          }
        })
      );
      
      setWatchlistItems(itemsWithPrices);
    }
  };


  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("autotrade_enabled, is_admin")
      .eq("id", user?.id)
      .single();

    if (data) {
      setAutotradeEnabled(data.autotrade_enabled);
      setIsAdmin(data.is_admin);
    }
  };

  const toggleAutotrade = async (checked: boolean) => {
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
        description: checked ? "Automatic trading is now active" : "Automatic trading is now disabled",
      });
    }
  };

  const handleAddToWatchlist = async (symbol: string) => {
    const { error } = await supabase
      .from("watchlist")
      .insert({ user_id: user?.id, symbol });

    if (error) {
      if (error.code === "23505") {
        throw new Error("Symbol already in watchlist");
      }
      throw new Error(error.message);
    }

    await fetchWatchlist();
  };

  const handleRemoveFromWatchlist = async (symbol: string) => {
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user?.id)
      .eq("symbol", symbol);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await fetchWatchlist();
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    toast({
      title: "Symbol Selected",
      description: `Now viewing ${symbol}`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Activity className="h-10 w-10 text-primary animate-pulse-slow" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Trading Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <span className="text-primary">●</span>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Card className={`flex items-center gap-3 px-4 py-2 transition-all ${
              autotradeEnabled ? 'bg-bullish/10 border-bullish/30' : 'bg-card/50 border-border'
            }`}>
              <Switch
                id="autotrade"
                checked={autotradeEnabled}
                onCheckedChange={toggleAutotrade}
              />
              <Label htmlFor="autotrade" className="cursor-pointer font-semibold text-sm whitespace-nowrap">
                Autotrade {autotradeEnabled ? (
                  <span className="text-bullish">ON</span>
                ) : (
                  <span className="text-muted-foreground">OFF</span>
                )}
              </Label>
            </Card>
            <Button variant="outline" onClick={() => navigate("/settings")} className="hover:bg-primary/10 hover:text-primary transition-colors">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={signOut} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Market Data Status */}
        <MarketDataStatus />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="bg-card/30 backdrop-blur-sm rounded-lg p-1 border border-border/50">
            <TabsList className="w-full flex flex-wrap justify-start gap-1 bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Overview
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="charts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Intraday Chart
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Compare
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                History
              </TabsTrigger>
              <TabsTrigger value="backtest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Backtest
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Alerts
              </TabsTrigger>
              <TabsTrigger value="news" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                News
              </TabsTrigger>
              <TabsTrigger value="strategy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Strategy Builder
              </TabsTrigger>
              <TabsTrigger value="paper" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Paper Trading
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Advanced Charts
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                  Admin
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MarketData symbol={selectedSymbol} />
              <TradingSignal
                signal="BUY"
                confidence={87}
                reason="Strong bullish sentiment combined with positive price momentum"
                targetPrice={195.50}
                stopLoss={182.30}
              />
              <SentimentAnalysis
                score={0.68}
                articles={247}
                lastUpdate="2 min ago"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskManager
                accountSize={accountSize}
                onAccountSizeChange={setAccountSize}
                riskPerTrade={riskPerTrade}
                onRiskPerTradeChange={setRiskPerTrade}
              />
              <OrderEntry />
              <Watchlist
                items={watchlistItems}
                onRemove={handleRemoveFromWatchlist}
                onSelect={handleSelectSymbol}
                onAdd={handleAddToWatchlist}
              />
            </div>
          </TabsContent>

          <TabsContent value="portfolio">
            <Portfolio />
          </TabsContent>

          <TabsContent value="charts">
            <HistoricalChart symbol={selectedSymbol} />
          </TabsContent>

          <TabsContent value="comparison">
            <StockComparison />
          </TabsContent>

          <TabsContent value="history">
            <TradingHistory />
          </TabsContent>

          <TabsContent value="backtest">
            <Backtesting />
          </TabsContent>

          <TabsContent value="alerts">
            <PriceAlerts />
          </TabsContent>

          <TabsContent value="strategy">
            <StrategyBuilder />
          </TabsContent>

          <TabsContent value="paper">
            <PaperTrading />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedChart symbol={selectedSymbol} />
          </TabsContent>

          <TabsContent value="news">
            <NewsArticles symbol={selectedSymbol} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminApproval />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
