import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MTAccount {
  id: string;
  account_name: string;
  account_number: string;
  server: string;
  platform_type: string;
  is_active: boolean;
}

export const MetaTraderConnect = () => {
  const [accounts, setAccounts] = useState<MTAccount[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [server, setServer] = useState("");
  const [platformType, setPlatformType] = useState<"MT4" | "MT5">("MT5");
  const { toast } = useToast();
  const { user } = useAuth();

  const loadAccounts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("metatrader_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading accounts",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAccounts(data || []);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("metatrader_accounts").insert({
      user_id: user.id,
      account_name: accountName,
      account_number: accountNumber,
      server: server,
      platform_type: platformType,
    });

    if (error) {
      toast({
        title: "Error adding account",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account added",
        description: "MetaTrader account connected successfully.",
      });
      setAccountName("");
      setAccountNumber("");
      setServer("");
      setIsAdding(false);
      loadAccounts();
    }
  };

  const handleDeleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("metatrader_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error removing account",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account removed",
        description: "MetaTrader account disconnected.",
      });
      loadAccounts();
    }
  };

  useState(() => {
    loadAccounts();
  });

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">MetaTrader Accounts</h3>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddAccount} className="space-y-4 mb-6 p-4 bg-background/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              placeholder="My Trading Account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">Account Number</Label>
            <Input
              id="account-number"
              placeholder="123456"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="server">Server</Label>
            <Input
              id="server"
              placeholder="ICMarkets-Demo"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platformType} onValueChange={(v) => setPlatformType(v as "MT4" | "MT5")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MT4">MetaTrader 4</SelectItem>
                <SelectItem value="MT5">MetaTrader 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Connect Account</Button>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {accounts.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No MetaTrader accounts connected yet
          </p>
        )}
        
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
          >
            <div>
              <p className="font-semibold">{account.account_name}</p>
              <p className="text-sm text-muted-foreground">
                {account.platform_type} • {account.account_number} • {account.server}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAccount(account.id)}
            >
              <Trash2 className="h-4 w-4 text-bearish" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
