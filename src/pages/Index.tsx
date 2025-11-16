import { useState } from "react";
import { MarketData } from "@/components/MarketData";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { TradingSignal } from "@/components/TradingSignal";
import { RiskManager } from "@/components/RiskManager";
import { OrderEntry } from "@/components/OrderEntry";
import { Watchlist } from "@/components/Watchlist";
import { Activity, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [watchlistItems, setWatchlistItems] = useState([
    { symbol: "AAPL", price: 187.35, change: 2.45 },
    { symbol: "MSFT", price: 378.91, change: -0.82 },
    { symbol: "GOOGL", price: 141.23, change: 1.15 },
    { symbol: "TSLA", price: 242.68, change: 5.32 },
  ]);

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlistItems(items => items.filter(item => item.symbol !== symbol));
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
              <h1 className="text-3xl font-bold">Trading Bot Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Automated market analysis and trading signals • {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/settings")}
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Data */}
          <div className="space-y-6">
            <MarketData symbol="AAPL" />
            
            <SentimentAnalysis
              score={0.68}
              articles={247}
              lastUpdate="2 min ago"
            />

            <Watchlist
              items={watchlistItems}
              onRemove={handleRemoveFromWatchlist}
              onSelect={handleSelectSymbol}
            />
          </div>

          {/* Middle Column - Signals */}
          <div className="space-y-6">
            <TradingSignal
              signal="BUY"
              confidence={87}
              reason="Strong bullish sentiment combined with positive price momentum and increasing volume"
              targetPrice={195.50}
              stopLoss={182.30}
            />

            <RiskManager
              accountSize={accountSize}
              onAccountSizeChange={setAccountSize}
              riskPerTrade={riskPerTrade}
              onRiskPerTradeChange={setRiskPerTrade}
            />
          </div>

          {/* Right Column - Order Entry */}
          <div>
            <OrderEntry />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
