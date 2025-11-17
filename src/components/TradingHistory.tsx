import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface Trade {
  id: string;
  symbol: string;
  action: string;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  status: string;
  created_at: string;
  closed_at: string | null;
}

export const TradingHistory = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTrades(data);
    }
    setLoading(false);
  };

  const cumulativePnL = trades.reduce((acc, trade, index) => {
    const prevTotal = index > 0 ? acc[index - 1].total : 0;
    return [...acc, {
      date: format(new Date(trade.created_at), "MM/dd"),
      total: prevTotal + (trade.pnl || 0)
    }];
  }, [] as { date: string; total: number }[]).reverse();

  if (loading) return <div>Loading trades...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
        {cumulativePnL.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativePnL}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">No trades yet</p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trade History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Exit</TableHead>
              <TableHead>P&L</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{format(new Date(trade.created_at), "MM/dd/yyyy HH:mm")}</TableCell>
                <TableCell className="font-semibold">{trade.symbol}</TableCell>
                <TableCell className={trade.action === 'BUY' ? 'text-bullish' : 'text-bearish'}>
                  {trade.action}
                </TableCell>
                <TableCell>{trade.quantity}</TableCell>
                <TableCell>${trade.entry_price.toFixed(2)}</TableCell>
                <TableCell>{trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}</TableCell>
                <TableCell className={`font-semibold ${(trade.pnl || 0) >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                  {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${trade.status === 'open' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {trade.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
