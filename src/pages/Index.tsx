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
import { Activity, Settings as SettingsIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMarketData } from "@/hooks/useMarketData";

const Index = () => {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [autotradeEnabled, setAutotradeEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { error: marketDataError } = useMarketData("AAPL");

  const [watchlistItems, setWatchlistItems] = useState<Array<{ symbol: string; price: number; change: number }>>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWatchlist();
    }
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
    console.log("Selected symbol:", symbol);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Trading Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-r border-border pr-3">
              <Switch
                id="autotrade"
                checked={autotradeEnabled}
                onCheckedChange={toggleAutotrade}
              />
              <Label htmlFor="autotrade" className="cursor-pointer">
                Autotrade {autotradeEnabled ? 'ON' : 'OFF'}
              </Label>
            </div>
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Market Data Info Banner */}
        {marketDataError && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Demo data is being displayed.</strong> To view live market data, configure a market data provider in{" "}
              <button 
                onClick={() => navigate("/settings")}
                className="font-semibold underline hover:text-primary transition-colors"
              >
                Settings
              </button>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full flex flex-wrap justify-start gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
            <TabsTrigger value="paper">Paper Trading</TabsTrigger>
            <TabsTrigger value="charts">Advanced Charts</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MarketData symbol="AAPL" />
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

          <TabsContent value="charts">
            <AdvancedChart />
          </TabsContent>

          <TabsContent value="news">
            <NewsArticles symbol="AAPL" />
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
