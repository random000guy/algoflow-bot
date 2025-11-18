import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Bell, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Alert {
  id: string;
  symbol: string;
  alert_type: string;
  target_price: number | null;
  condition: string;
  is_active: boolean;
}

export const PriceAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({
    symbol: "",
    alertType: "price",
    targetPrice: "",
    condition: "above",
  });

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) setAlerts(data);
  };

  const createAlert = async () => {
    if (!user || !newAlert.symbol || !newAlert.targetPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id,
      symbol: newAlert.symbol.toUpperCase(),
      alert_type: newAlert.alertType,
      target_price: parseFloat(newAlert.targetPrice),
      condition: newAlert.condition,
      is_active: true,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Alert Created",
        description: "You'll receive email notifications when the alert is triggered",
      });
      setNewAlert({ symbol: "", alertType: "price", targetPrice: "", condition: "above" });
      fetchAlerts();
    }
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    
    if (!error) {
      toast({ title: "Alert Deleted" });
      fetchAlerts();
    }
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("price_alerts")
      .update({ is_active: !isActive })
      .eq("id", id);
    
    if (!error) fetchAlerts();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Create Price Alert</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Symbol</Label>
            <Input
              placeholder="AAPL"
              value={newAlert.symbol}
              onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={newAlert.condition} onValueChange={(v) => setNewAlert({ ...newAlert, condition: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Price</Label>
            <Input
              type="number"
              placeholder="150.00"
              value={newAlert.targetPrice}
              onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button onClick={createAlert} className="w-full">
              Create Alert
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Target Price</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-semibold">{alert.symbol}</TableCell>
                <TableCell className="capitalize">{alert.condition}</TableCell>
                <TableCell>${alert.target_price?.toFixed(2)}</TableCell>
                <TableCell>
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={() => toggleAlert(alert.id, alert.is_active)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
