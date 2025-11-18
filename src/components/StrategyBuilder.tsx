import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Save, Play, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StrategyBlock {
  id: string;
  type: "condition" | "action" | "indicator";
  config: {
    indicator?: string;
    comparison?: string;
    value?: string;
    action?: string;
  };
}

export const StrategyBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [blocks, setBlocks] = useState<StrategyBlock[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  const availableBlocks = [
    { type: "indicator", label: "RSI", icon: "📊" },
    { type: "indicator", label: "MACD", icon: "📈" },
    { type: "indicator", label: "SMA", icon: "📉" },
    { type: "condition", label: "Greater Than", icon: ">" },
    { type: "condition", label: "Less Than", icon: "<" },
    { type: "action", label: "Buy", icon: "💰" },
    { type: "action", label: "Sell", icon: "💸" },
  ];

  useEffect(() => {
    loadStrategies();
  }, [user]);

  const loadStrategies = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("strategies")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStrategies(data);
    }
  };

  const addBlock = (blockType: string) => {
    const newBlock: StrategyBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: blockType as any,
      config: {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const updateBlockConfig = (id: string, config: any) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, config: { ...b.config, ...config } } : b)));
  };

  const saveStrategy = async () => {
    if (!user || !name) {
      toast({
        title: "Error",
        description: "Please provide a strategy name",
        variant: "destructive",
      });
      return;
    }

    const strategyData = {
      user_id: user.id,
      name,
      description,
      config: { blocks } as any,
      is_active: false,
    };

    const { error } = selectedStrategy
      ? await supabase.from("strategies").update(strategyData).eq("id", selectedStrategy)
      : await supabase.from("strategies").insert(strategyData);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Strategy ${selectedStrategy ? "updated" : "saved"} successfully`,
      });
      loadStrategies();
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setBlocks([]);
    setSelectedStrategy(null);
  };

  const loadStrategy = (strategy: any) => {
    setSelectedStrategy(strategy.id);
    setName(strategy.name);
    setDescription(strategy.description || "");
    setBlocks(strategy.config?.blocks || []);
  };

  const deleteStrategy = async (id: string) => {
    const { error } = await supabase.from("strategies").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Strategy deleted successfully",
      });
      loadStrategies();
      if (selectedStrategy === id) resetForm();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <Wand2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Strategy Builder</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label>Strategy Name</Label>
            <Input
              placeholder="My Winning Strategy"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe your strategy..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <Label className="mb-2 block">Available Blocks</Label>
          <div className="flex flex-wrap gap-2">
            {availableBlocks.map((block, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => addBlock(block.type)}
                className="cursor-grab"
              >
                <span className="mr-2">{block.icon}</span>
                {block.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Strategy Flow</Label>
          <div className="min-h-[200px] border-2 border-dashed rounded-lg p-4 space-y-2">
            {blocks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Add blocks above to build your strategy
              </p>
            ) : (
              blocks.map((block) => (
                <Card key={block.id} className="p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{block.type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {block.type === "indicator" && (
                    <Select
                      value={block.config.indicator}
                      onValueChange={(v) => updateBlockConfig(block.id, { indicator: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select indicator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rsi">RSI</SelectItem>
                        <SelectItem value="macd">MACD</SelectItem>
                        <SelectItem value="sma">SMA</SelectItem>
                        <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {block.type === "condition" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={block.config.comparison}
                        onValueChange={(v) => updateBlockConfig(block.id, { comparison: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Comparison" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gt">Greater Than</SelectItem>
                          <SelectItem value="lt">Less Than</SelectItem>
                          <SelectItem value="eq">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Value"
                        value={block.config.value}
                        onChange={(e) => updateBlockConfig(block.id, { value: e.target.value })}
                      />
                    </div>
                  )}

                  {block.type === "action" && (
                    <Select
                      value={block.config.action}
                      onValueChange={(v) => updateBlockConfig(block.id, { action: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={saveStrategy} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Strategy
          </Button>
          <Button variant="outline" onClick={resetForm}>
            Clear
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Saved Strategies</h3>
        <div className="space-y-2">
          {strategies.map((strategy) => (
            <Card
              key={strategy.id}
              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1" onClick={() => loadStrategy(strategy)}>
                  <p className="font-medium">{strategy.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {strategy.description?.substring(0, 50)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteStrategy(strategy.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {strategies.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No strategies yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};
