import { useState, useEffect, useMemo } from "react";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { DraggableDashboard, DashboardItem } from "@/components/DraggableDashboard";
import { 
  MarketDataSkeleton, 
  TradingSignalSkeleton, 
  SentimentSkeleton,
  WatchlistSkeleton 
} from "@/components/DashboardSkeleton";
import { usePriceAlertNotifications } from "@/hooks/usePriceAlertNotifications";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Activity, Settings as SettingsIcon } from "lucide-react";
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

const TABS = ["overview", "portfolio", "charts", "comparison", "history", "backtest", "alerts", "news", "strategy", "paper", "advanced"];

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
  
  // Enable price alert notifications
  usePriceAlertNotifications();

  const [watchlistItems, setWatchlistItems] = useState<Array<{ symbol: string; price: number; change: number }>>([]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: "r",
      action: () => {
        refetchMarketData();
        toast({ title: "Refreshing data...", duration: 1500 });
      },
      description: "Refresh market data",
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
    ...TABS.map((tab, index) => ({
      key: String(index + 1),
      action: () => setActiveTab(tab),
      description: `Switch to ${tab} tab`,
    })),
  ], [autotradeEnabled, navigate, refetchMarketData, toast]);

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
        <TradingSignal
          signal="BUY"
          confidence={87}
          reason="Strong bullish sentiment combined with positive price momentum"
          targetPrice={195.50}
          stopLoss={182.30}
        />
      ),
      colSpan: 1
    },
    { 
      id: "sentiment", 
      component: isLoading ? <SentimentSkeleton /> : (
        <SentimentAnalysis
          score={0.68}
          articles={247}
          lastUpdate="2 min ago"
        />
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

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
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

          <TabsContent value="portfolio" className="animate-fade-in">
            <Portfolio />
          </TabsContent>

          <TabsContent value="charts" className="animate-fade-in">
            <HistoricalChart symbol={selectedSymbol} />
          </TabsContent>

          <TabsContent value="comparison" className="animate-fade-in">
            <StockComparison />
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <TradingHistory />
          </TabsContent>

          <TabsContent value="backtest" className="animate-fade-in">
            <Backtesting />
          </TabsContent>

          <TabsContent value="alerts" className="animate-fade-in">
            <PriceAlerts />
          </TabsContent>

          <TabsContent value="strategy" className="animate-fade-in">
            <StrategyBuilder />
          </TabsContent>

          <TabsContent value="paper" className="animate-fade-in">
            <PaperTrading />
          </TabsContent>

          <TabsContent value="advanced" className="animate-fade-in">
            <AdvancedChart symbol={selectedSymbol} />
          </TabsContent>

          <TabsContent value="news" className="animate-fade-in">
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
