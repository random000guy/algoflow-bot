import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Alert {
  id: string;
  symbol: string;
  condition: string;
  target_price: number;
}

export const usePriceAlertNotifications = () => {
  const { user } = useAuth();
  const lastCheckRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkAlerts = async () => {
      try {
        // Fetch active alerts
        const { data: alerts } = await supabase
          .from("price_alerts")
          .select("id, symbol, condition, target_price")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .is("triggered_at", null);

        if (!alerts || alerts.length === 0) return;

        // Check each alert
        for (const alert of alerts) {
          try {
            const { data: marketData } = await supabase.functions.invoke(
              "fetch-market-data",
              {
                body: { symbol: alert.symbol },
              }
            );

            if (!marketData?.price) continue;

            const currentPrice = marketData.price;
            let triggered = false;

            if (alert.condition === "above" && currentPrice >= alert.target_price) {
              triggered = true;
            } else if (alert.condition === "below" && currentPrice <= alert.target_price) {
              triggered = true;
            }

            if (triggered && !lastCheckRef.current.has(alert.id)) {
              lastCheckRef.current.add(alert.id);

              // Show toast notification
              toast({
                title: `🔔 Price Alert: ${alert.symbol}`,
                description: `${alert.symbol} is now ${alert.condition} $${alert.target_price.toFixed(2)} at $${currentPrice.toFixed(2)}`,
                duration: 10000,
              });

              // Update alert as triggered
              await supabase
                .from("price_alerts")
                .update({
                  is_active: false,
                  triggered_at: new Date().toISOString(),
                })
                .eq("id", alert.id);
            }
          } catch (error) {
            console.error(`Error checking alert for ${alert.symbol}:`, error);
          }
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    // Check immediately
    checkAlerts();

    // Check every 30 seconds
    const interval = setInterval(checkAlerts, 30000);

    return () => clearInterval(interval);
  }, [user]);
};
