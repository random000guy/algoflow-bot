import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Calendar, Tag, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_date: string;
  exit_date: string | null;
  notes: string | null;
  tags: string[] | null;
  strategy: string | null;
  pnl: number | null;
  pnl_percentage: number | null;
  status: "open" | "closed" | "partial";
}

const STRATEGIES = [
  "Momentum",
  "Mean Reversion",
  "Breakout",
  "Scalping",
  "Swing Trading",
  "Position Trading",
  "News Based",
  "Technical Analysis",
  "Other",
];

export const TradeJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    symbol: "",
    action: "BUY" as "BUY" | "SELL",
    entry_price: "",
    exit_price: "",
    quantity: "",
    entry_date: new Date().toISOString().split("T")[0],
    exit_date: "",
    notes: "",
    tags: "",
    strategy: "",
    status: "open" as "open" | "closed" | "partial",
  });

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trade_journal")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setEntries((data as JournalEntry[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const resetForm = () => {
    setFormData({
      symbol: "",
      action: "BUY",
      entry_price: "",
      exit_price: "",
      quantity: "",
      entry_date: new Date().toISOString().split("T")[0],
      exit_date: "",
      notes: "",
      tags: "",
      strategy: "",
      status: "open",
    });
    setEditingEntry(null);
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      const payload = {
        user_id: user.id,
        symbol: formData.symbol.toUpperCase(),
        action: formData.action,
        entry_price: parseFloat(formData.entry_price),
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
        quantity: parseFloat(formData.quantity),
        entry_date: formData.entry_date,
        exit_date: formData.exit_date || null,
        notes: formData.notes || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : null,
        strategy: formData.strategy || null,
        status: formData.status,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from("trade_journal")
          .update(payload)
          .eq("id", editingEntry.id);
        if (error) throw error;
        toast({ title: "Entry updated successfully" });
      } else {
        const { error } = await supabase.from("trade_journal").insert(payload);
        if (error) throw error;
        toast({ title: "Entry added successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      symbol: entry.symbol,
      action: entry.action,
      entry_price: entry.entry_price.toString(),
      exit_price: entry.exit_price?.toString() || "",
      quantity: entry.quantity.toString(),
      entry_date: entry.entry_date.split("T")[0],
      exit_date: entry.exit_date?.split("T")[0] || "",
      notes: entry.notes || "",
      tags: entry.tags?.join(", ") || "",
      strategy: entry.strategy || "",
      status: entry.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("trade_journal").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Entry deleted" });
      fetchEntries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const stats = {
    totalTrades: entries.length,
    openTrades: entries.filter((e) => e.status === "open").length,
    closedTrades: entries.filter((e) => e.status === "closed").length,
    totalPnL: entries.reduce((sum, e) => sum + (e.pnl || 0), 0),
    winRate: entries.filter((e) => e.status === "closed").length > 0
      ? (entries.filter((e) => e.pnl && e.pnl > 0).length / entries.filter((e) => e.status === "closed").length) * 100
      : 0,
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Trade Journal</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Track and analyze your trading performance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Edit Trade" : "Log New Trade"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="symbol">Symbol</Label>
                      <Input
                        id="symbol"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="AAPL"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Action</Label>
                      <Select
                        value={formData.action}
                        onValueChange={(v) => setFormData({ ...formData, action: v as "BUY" | "SELL" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUY">BUY</SelectItem>
                          <SelectItem value="SELL">SELL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="entry_price">Entry Price</Label>
                      <Input
                        id="entry_price"
                        type="number"
                        value={formData.entry_price}
                        onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exit_price">Exit Price</Label>
                      <Input
                        id="exit_price"
                        type="number"
                        value={formData.exit_price}
                        onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="entry_date">Entry Date</Label>
                      <Input
                        id="entry_date"
                        type="date"
                        value={formData.entry_date}
                        onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exit_date">Exit Date</Label>
                      <Input
                        id="exit_date"
                        type="date"
                        value={formData.exit_date}
                        onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Strategy</Label>
                      <Select
                        value={formData.strategy}
                        onValueChange={(v) => setFormData({ ...formData, strategy: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          {STRATEGIES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="earnings, breakout, trend"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Trade rationale, lessons learned..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit}>{editingEntry ? "Update" : "Save"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalTrades}</div>
            <div className="text-xs text-muted-foreground">Total Trades</div>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
            <div className="text-2xl font-bold text-warning">{stats.openTrades}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </div>
          <div className="p-3 rounded-lg bg-bullish/10 border border-bullish/20 text-center">
            <div className="text-2xl font-bold text-bullish">{stats.closedTrades}</div>
            <div className="text-xs text-muted-foreground">Closed</div>
          </div>
          <div className={`p-3 rounded-lg border text-center ${stats.totalPnL >= 0 ? "bg-bullish/10 border-bullish/20" : "bg-destructive/10 border-destructive/20"}`}>
            <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? "text-bullish" : "text-destructive"}`}>
              ${stats.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Total P&L</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-center">
            <div className="text-2xl font-bold text-accent">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">
                    {format(new Date(entry.entry_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-semibold">{entry.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={entry.action === "BUY" ? "default" : "destructive"} className="text-xs">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>${entry.entry_price.toFixed(2)}</TableCell>
                  <TableCell>{entry.exit_price ? `$${entry.exit_price.toFixed(2)}` : "-"}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>
                    {entry.pnl !== null ? (
                      <div className={`flex items-center gap-1 ${entry.pnl >= 0 ? "text-bullish" : "text-destructive"}`}>
                        {entry.pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        ${Math.abs(entry.pnl).toFixed(2)}
                        <span className="text-xs">({entry.pnl_percentage?.toFixed(1)}%)</span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-xs">{entry.strategy || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      entry.status === "open" ? "outline" :
                      entry.status === "closed" ? "secondary" : "default"
                    } className="text-xs">
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(entry)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No trades logged yet. Click "Add Trade" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};