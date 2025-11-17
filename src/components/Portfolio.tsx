import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avg_entry_price: number;
  current_price: number | null;
  unrealized_pnl: number | null;
  asset_type: string;
}

export const Portfolio = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPositions();
    }
  }, [user]);

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from("portfolio_positions")
      .select("*")
      .eq("user_id", user?.id);

    if (!error && data) {
      setPositions(data);
    }
    setLoading(false);
  };

  const totalValue = positions.reduce((sum, p) => 
    sum + (p.current_price || p.avg_entry_price) * p.quantity, 0
  );
  
  const totalPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  
  const allocationData = positions.map(p => ({
    name: p.symbol,
    value: (p.current_price || p.avg_entry_price) * p.quantity
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

  if (loading) return <div>Loading portfolio...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Total Value</h3>
          <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Unrealized P&L</h3>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              ${totalPnL.toFixed(2)}
            </p>
            {totalPnL >= 0 ? <TrendingUp className="text-bullish" /> : <TrendingDown className="text-bearish" />}
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Positions</h3>
          <p className="text-3xl font-bold">{positions.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Holdings</h3>
          <div className="space-y-3">
            {positions.map((position) => (
              <div key={position.id} className="flex justify-between items-center border-b border-border pb-2">
                <div>
                  <p className="font-semibold">{position.symbol}</p>
                  <p className="text-sm text-muted-foreground">{position.quantity} shares</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${((position.current_price || position.avg_entry_price) * position.quantity).toFixed(2)}</p>
                  <p className={`text-sm ${(position.unrealized_pnl || 0) >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                    {(position.unrealized_pnl || 0) >= 0 ? '+' : ''}{position.unrealized_pnl?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
          {allocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">No positions yet</p>
          )}
        </Card>
      </div>
    </div>
  );
};
