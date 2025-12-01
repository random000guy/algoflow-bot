import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MetaTraderConnect } from "@/components/MetaTraderConnect";
import { MarketDataSettings } from "@/components/MarketDataSettings";
import { marketDataCache } from "@/lib/marketDataCache";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        {/* Settings Content */}
        <div className="grid gap-6">
          <MarketDataSettings />
          <MetaTraderConnect />
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Cache Management</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Market data is cached for 90 seconds to improve performance and reduce API calls. 
                Clear the cache to force fresh data retrieval on your next request.
              </p>
              <Button 
                onClick={() => {
                  marketDataCache.clear();
                  toast({
                    title: "Cache Cleared",
                    description: "Market data cache has been cleared successfully",
                  });
                }}
                variant="outline"
              >
                Clear Market Data Cache
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
