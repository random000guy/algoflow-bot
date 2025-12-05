import { useState, useEffect, useMemo, useCallback } from "react";
import { MarketData } from "@/components/MarketData";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { RiskManager } from "@/components/RiskManager";
import { OrderEntry } from "@/components/OrderEntry";
import { Watchlist } from "@/components/Watchlist";
import { Portfolio } from "@/components/Portfolio";
import { PortfolioAnalytics } from "@/components/PortfolioAnalytics";
import { TradingHistory } from "@/components/TradingHistory";
import { Backtesting } from "@/components/Backtesting";
import { PriceAlerts } from "@/components/PriceAlerts";
import { AdminApproval } from "@/components/AdminApproval";
import { StrategyBuilder } from "@/components/StrategyBuilder";
import { PaperTrading } from "@/components/PaperTrading";
import { NewsArticles } from "@/components/NewsArticles";
import { StockComparison } from "@/components/StockComparison";
import { MarketDataStatus } from "@/components/MarketDataStatus";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { DraggableDashboard, DashboardItem } from "@/components/DraggableDashboard";
import { EnhancedTradingSignal } from "@/components/EnhancedTradingSignal";
import { EnhancedChart } from "@/components/EnhancedChart";
import { MarketHeatmap } from "@/components/MarketHeatmap";
import { PositionSizingCalculator } from "@/components/PositionSizingCalculator";
import { TradeJournal } from "@/components/TradeJournal";
import { RiskAnalytics } from "@/components/RiskAnalytics";
import { 
  MarketDataSkeleton, 
  TradingSignalSkeleton, 
  SentimentSkeleton,
  WatchlistSkeleton 
} from "@/components/DashboardSkeleton";
import { usePriceAlertNotifications } from "@/hooks/usePriceAlertNotifications";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Activity, Settings as SettingsIcon, RefreshCw, Zap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMarketData } from "@/hooks/useMarketData";

const TABS = ["overview", "heatmap", "portfolio", "analytics", "risk", "charts", "comparison", "history", "backtest", "alerts", "news", "strategy", "paper", "journal", "tools", "advanced"];

const Index = () => {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [autotradeEnabled, setAutotradeEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const { refetch: refetchMarketData } = useMarketData(selectedSymbol);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Enable price alert notifications
  usePriceAlertNotifications();

  // Auto-refresh functionality
  const handleGlobalRefresh = useCallback(async () => {
    await refetchMarketData();
    await fetchWatchlist();
    setRefreshKey(prev => prev + 1);
  }, []);

  const { 
    isRefreshing, 
    autoRefreshEnabled, 
    toggleAutoRefresh, 
    refresh, 
    secondsUntilRefresh 
  } = useAutoRefresh({
    onRefresh: handleGlobalRefresh,
    interval: 30,
    enabled: false,
  });

  const [watchlistItems, setWatchlistItems] = useState<Array<{ symbol: string; price: number; change: number }>>([]);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [quickOrderSide, setQuickOrderSide] = useState<"buy" | "sell">("buy");

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: "r",
      action: () => refresh(),
      description: "Refresh all data",
    },
    {
      key: "f",
      action: () => toggleAutoRefresh(),
      description: "Toggle auto-refresh",
    },
    {
      key: "t",
      action: () => toggleAutotrade(!autotradeEnabled),
      description: "Toggle autotrade",
    },
    {
      key: "s",
      action: () => navigate("/settings"),
      description: "Go to settings",
    },
    {
      key: "b",
      action: () => {
        setQuickOrderSide("buy");
        toast({ 
          title: "Quick Buy Mode",
          description: `Ready to buy ${selectedSymbol}`,
          duration: 2000
        });
      },
      description: "Quick buy order",
    },
    {
      key: "n",
      action: () => {
        setQuickOrderSide("sell");
        toast({ 
          title: "Quick Sell Mode",
          description: `Ready to sell ${selectedSymbol}`,
          duration: 2000
        });
      },
      description: "Quick sell order",
    },
    {
      key: "a",
      action: () => {
        setActiveTab("alerts");
        toast({ title: "Add Alert", description: "Navigate to alerts tab", duration: 1500 });
      },
      description: "Add price alert",
    },
    {
      key: "w",
      action: async () => {
        try {
          await handleAddToWatchlist(selectedSymbol);
          toast({ title: "Added to Watchlist", description: selectedSymbol, duration: 1500 });
        } catch (e: any) {
          toast({ title: "Error", description: e.message, variant: "destructive" });
        }
      },
      description: "Add to watchlist",
    },
    {
      key: "c",
      action: () => {
        setActiveTab("charts");
        toast({ title: "Charts", description: "Viewing enhanced chart", duration: 1500 });
      },
      description: "Toggle chart type",
    },
    {
      key: "i",
      action: () => {
        setActiveTab("advanced");
        toast({ title: "Indicators", description: "View technical indicators", duration: 1500 });
      },
      description: "Cycle indicators",
    },
    ...TABS.map((tab, index) => ({
      key: String(index + 1),
      action: () => setActiveTab(tab),
      description: `Switch to ${tab} tab`,
    })),
  ], [autotradeEnabled, navigate, refresh, toggleAutoRefresh, toast, selectedSymbol]);

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWatchlist();
    }
  }, [user]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh watchlist every 45 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchWatchlist();
    }, 45000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchWatchlist = async () => {
    const { data: watchlistData } = await supabase
      .from("watchlist")
      .select("symbol")
      .eq("user_id", user?.id);

    if (watchlistData) {
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

  // Draggable dashboard items for overview
  const overviewItems: DashboardItem[] = useMemo(() => [
    { 
      id: "market-data", 
      component: isLoading ? <MarketDataSkeleton /> : <MarketData symbol={selectedSymbol} />,
      colSpan: 1
    },
    { 
      id: "trading-signal", 
      component: isLoading ? <TradingSignalSkeleton /> : (
        <EnhancedTradingSignal symbol={selectedSymbol} />
      ),
      colSpan: 1
    },
    { 
      id: "sentiment", 
      component: isLoading ? <SentimentSkeleton /> : (
        <SentimentAnalysis symbol={selectedSymbol} />
      ),
      colSpan: 1
    },
  ], [isLoading, selectedSymbol]);

  const [currentOverviewItems, setCurrentOverviewItems] = useState<DashboardItem[]>(overviewItems);

  useEffect(() => {
    setCurrentOverviewItems(overviewItems);
  }, [overviewItems]);

  return (
    <div className="min-h-screen bg-background p-6 theme-transition">
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
            <KeyboardShortcutsHelp />
            <ThemeToggle />
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
            <Button 
              variant={autoRefreshEnabled ? "default" : "outline"} 
              size="sm"
              onClick={() => refresh()}
              disabled={isRefreshing}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {autoRefreshEnabled && <span className="text-xs">{secondsUntilRefresh}s</span>}
            </Button>
            <Button
              variant={autoRefreshEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleAutoRefresh}
              className="gap-1"
            >
              <Timer className="h-4 w-4" />
              Auto
            </Button>
            <Button variant="outline" onClick={() => navigate("/autotrade")} className="hover:bg-accent/10 hover:text-accent transition-colors">
              <Zap className="h-4 w-4 mr-2" />
              Autotrade
            </Button>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-card/30 backdrop-blur-sm rounded-lg p-1 border border-border/50">
            <TabsList className="w-full flex flex-wrap justify-start gap-1 bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Overview
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="risk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Risk
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
                Strategy
              </TabsTrigger>
              <TabsTrigger value="paper" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Paper Trade
              </TabsTrigger>
              <TabsTrigger value="journal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Journal
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Tools
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Advanced
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                  Admin
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 animate-fade-in" key={`overview-${refreshKey}`}>
            <DraggableDashboard 
              items={currentOverviewItems}
              onReorder={setCurrentOverviewItems}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskManager
                accountSize={accountSize}
                onAccountSizeChange={setAccountSize}
                riskPerTrade={riskPerTrade}
                onRiskPerTradeChange={setRiskPerTrade}
              />
              <OrderEntry />
              {isLoading ? <WatchlistSkeleton /> : (
                <Watchlist
                  items={watchlistItems}
                  onRemove={handleRemoveFromWatchlist}
                  onSelect={handleSelectSymbol}
                  onAdd={handleAddToWatchlist}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="heatmap" className="animate-fade-in" key={`heatmap-${refreshKey}`}>
            <MarketHeatmap />
          </TabsContent>

          <TabsContent value="portfolio" className="animate-fade-in" key={`portfolio-${refreshKey}`}>
            <Portfolio />
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in" key={`analytics-${refreshKey}`}>
            <PortfolioAnalytics />
          </TabsContent>

          <TabsContent value="risk" className="animate-fade-in" key={`risk-${refreshKey}`}>
            <RiskAnalytics />
          </TabsContent>

          <TabsContent value="charts" className="animate-fade-in" key={`charts-${refreshKey}`}>
            <EnhancedChart symbol={selectedSymbol} />
          </TabsContent>

          <TabsContent value="comparison" className="animate-fade-in" key={`comparison-${refreshKey}`}>
            <StockComparison />
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in" key={`history-${refreshKey}`}>
            <TradingHistory />
          </TabsContent>

          <TabsContent value="backtest" className="animate-fade-in" key={`backtest-${refreshKey}`}>
            <Backtesting />
          </TabsContent>

          <TabsContent value="alerts" className="animate-fade-in" key={`alerts-${refreshKey}`}>
            <PriceAlerts />
          </TabsContent>

          <TabsContent value="strategy" className="animate-fade-in" key={`strategy-${refreshKey}`}>
            <StrategyBuilder />
          </TabsContent>

          <TabsContent value="paper" className="animate-fade-in" key={`paper-${refreshKey}`}>
            <PaperTrading />
          </TabsContent>

          <TabsContent value="journal" className="animate-fade-in" key={`journal-${refreshKey}`}>
            <TradeJournal />
          </TabsContent>

          <TabsContent value="tools" className="animate-fade-in" key={`tools-${refreshKey}`}>
            <PositionSizingCalculator />
          </TabsContent>

          <TabsContent value="advanced" className="animate-fade-in" key={`advanced-${refreshKey}`}>
            <EnhancedChart symbol={selectedSymbol} />
          </TabsContent>

          <TabsContent value="news" className="animate-fade-in" key={`news-${refreshKey}`}>
            <NewsArticles symbol={selectedSymbol} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="animate-fade-in">
              <AdminApproval />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
