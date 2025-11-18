import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PaperTrading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [newAccountName, setNewAccountName] = useState("");
  const [startingBalance, setStartingBalance] = useState("100000");

  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    quantity: "",
    price: "",
    action: "buy" as "buy" | "sell",
  });

  useEffect(() => {
    loadAccounts();
  }, [user]);

  useEffect(() => {
    if (selectedAccount) {
      loadPositions();
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("paper_trading_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAccounts(data);
      if (data.length > 0 && !selectedAccount) {
        setSelectedAccount(data[0].id);
      }
    }
  };

  const loadPositions = async () => {
    if (!selectedAccount) return;
    const { data, error } = await supabase
      .from("paper_trading_positions")
      .select("*")
      .eq("account_id", selectedAccount)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPositions(data);
    }
  };

  const createAccount = async () => {
    if (!user || !newAccountName) {
      toast({
        title: "Error",
        description: "Please provide an account name",
        variant: "destructive",
      });
      return;
    }

    const balance = parseFloat(startingBalance) || 100000;
    const { data, error } = await supabase.from("paper_trading_accounts").insert({
      user_id: user.id,
      name: newAccountName,
      starting_balance: balance,
      current_balance: balance,
    }).select();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Paper trading account created",
      });
      setNewAccountName("");
      setStartingBalance("100000");
      loadAccounts();
      if (data && data[0]) {
        setSelectedAccount(data[0].id);
      }
    }
  };

  const executeTrade = async () => {
    if (!selectedAccount || !tradeForm.symbol || !tradeForm.quantity || !tradeForm.price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const account = accounts.find((a) => a.id === selectedAccount);
    if (!account) return;

    const quantity = parseFloat(tradeForm.quantity);
    const price = parseFloat(tradeForm.price);
    const totalCost = quantity * price;

    if (tradeForm.action === "buy") {
      if (totalCost > account.current_balance) {
        toast({
          title: "Error",
          description: "Insufficient balance",
          variant: "destructive",
        });
        return;
      }

      // Create position
      const { error: posError } = await supabase.from("paper_trading_positions").insert({
        account_id: selectedAccount,
        symbol: tradeForm.symbol.toUpperCase(),
        quantity,
        entry_price: price,
        current_price: price,
        status: "open",
      });

      if (posError) {
        toast({
          title: "Error",
          description: posError.message,
          variant: "destructive",
        });
        return;
      }

      // Update account balance
      await supabase
        .from("paper_trading_accounts")
        .update({ current_balance: account.current_balance - totalCost })
        .eq("id", selectedAccount);
    } else {
      // Sell position
      const position = positions.find((p) => p.symbol === tradeForm.symbol.toUpperCase());
      if (!position || position.quantity < quantity) {
        toast({
          title: "Error",
          description: "Insufficient position",
          variant: "destructive",
        });
        return;
      }

      const pnl = (price - position.entry_price) * quantity;

      if (position.quantity === quantity) {
        // Close position
        await supabase
          .from("paper_trading_positions")
          .update({ 
            status: "closed", 
            closed_at: new Date().toISOString(),
            pnl 
          })
          .eq("id", position.id);
      } else {
        // Reduce position
        await supabase
          .from("paper_trading_positions")
          .update({ quantity: position.quantity - quantity })
          .eq("id", position.id);
      }

      // Update account balance
      await supabase
        .from("paper_trading_accounts")
        .update({ 
          current_balance: account.current_balance + totalCost,
          total_pnl: (account.total_pnl || 0) + pnl
        })
        .eq("id", selectedAccount);
    }

    toast({
      title: "Success",
      description: `${tradeForm.action === "buy" ? "Bought" : "Sold"} ${quantity} ${tradeForm.symbol}`,
    });

    setTradeForm({ symbol: "", quantity: "", price: "", action: "buy" });
    loadAccounts();
    loadPositions();
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccount);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Balance</h3>
          </div>
          <p className="text-3xl font-bold">
            ${currentAccount?.current_balance.toLocaleString() || "0"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Starting: ${currentAccount?.starting_balance.toLocaleString() || "0"}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Total P&L</h3>
          </div>
          <p className={`text-3xl font-bold ${(currentAccount?.total_pnl || 0) >= 0 ? "text-bullish" : "text-bearish"}`}>
            ${(currentAccount?.total_pnl || 0).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {((((currentAccount?.total_pnl || 0) / (currentAccount?.starting_balance || 1)) * 100)).toFixed(2)}% Return
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Open Positions</h3>
          </div>
          <p className="text-3xl font-bold">{positions.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Active trades</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create Account</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                placeholder="My Paper Account"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Starting Balance ($)</Label>
              <Input
                type="number"
                placeholder="100000"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
              />
            </div>
            <Button onClick={createAccount} className="w-full">
              Create Account
            </Button>
          </div>

          {accounts.length > 0 && (
            <div className="mt-6">
              <Label className="mb-2 block">Select Account</Label>
              <Select value={selectedAccount || ""} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - ${account.current_balance.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Execute Trade</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                placeholder="AAPL"
                value={tradeForm.symbol}
                onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={tradeForm.quantity}
                  onChange={(e) => setTradeForm({ ...tradeForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  placeholder="150.00"
                  value={tradeForm.price}
                  onChange={(e) => setTradeForm({ ...tradeForm, price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={tradeForm.action}
                onValueChange={(v: "buy" | "sell") => setTradeForm({ ...tradeForm, action: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={executeTrade} className="w-full" disabled={!selectedAccount}>
              Execute Trade
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
        <div className="space-y-2">
          {positions.map((position) => {
            const currentPnL = ((parseFloat(position.current_price || position.entry_price) - parseFloat(position.entry_price)) * parseFloat(position.quantity));
            return (
              <Card key={position.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{position.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {position.quantity} shares @ ${parseFloat(position.entry_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${currentPnL >= 0 ? "text-bullish" : "text-bearish"}`}>
                      ${currentPnL.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {((currentPnL / (parseFloat(position.entry_price) * parseFloat(position.quantity))) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
          {positions.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No open positions</p>
          )}
        </div>
      </Card>
    </div>
  );
};
