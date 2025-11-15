import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const OrderEntry = () => {
  const { toast } = useToast();
  const [symbol, setSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState("10");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("market");

  const handlePlaceOrder = () => {
    const orderDetails = {
      symbol,
      quantity: Number(quantity),
      side,
      type: orderType,
      timestamp: new Date().toISOString(),
    };

    console.log("Simulated Order:", orderDetails);

    toast({
      title: "Order Simulated",
      description: (
        <div className="space-y-1 font-mono text-xs">
          <p>{side.toUpperCase()} {quantity} {symbol}</p>
          <p>Type: {orderType}</p>
        </div>
      ),
    });
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <Send className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Order Entry</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="font-mono"
            placeholder="AAPL"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="side">Side</Label>
            <Select value={side} onValueChange={(value: "buy" | "sell") => setSide(value)}>
              <SelectTrigger id="side">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-type">Order Type</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger id="order-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="limit">Limit</SelectItem>
              <SelectItem value="stop">Stop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            This is a simulated order. No real trades will be executed.
          </p>
        </div>

        <Button
          onClick={handlePlaceOrder}
          className={`w-full font-semibold ${
            side === "buy"
              ? "bg-bullish hover:bg-bullish/90 text-bullish-foreground"
              : "bg-bearish hover:bg-bearish/90 text-bearish-foreground"
          }`}
        >
          Place {side.toUpperCase()} Order
        </Button>
      </div>
    </Card>
  );
};
