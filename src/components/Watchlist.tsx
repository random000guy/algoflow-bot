import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, TrendingUp, TrendingDown, X, Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { POPULAR_STOCKS } from "@/data/popularStocks";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
}

interface WatchlistProps {
  items: WatchlistItem[];
  onRemove: (symbol: string) => void;
  onSelect: (symbol: string) => void;
  onAdd: (symbol: string) => Promise<void>;
}

export const Watchlist = ({ items, onRemove, onSelect, onAdd }: WatchlistProps) => {
  const [newSymbol, setNewSymbol] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return POPULAR_STOCKS;
    const query = searchQuery.toLowerCase();
    return POPULAR_STOCKS.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleAdd = async (symbol: string) => {
    if (!symbol) {
      toast.error("Please select a stock symbol");
      return;
    }

    setIsAdding(true);
    try {
      await onAdd(symbol);
      setNewSymbol("");
      setSearchQuery("");
      setOpen(false);
      toast.success(`Added ${symbol} to watchlist`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add symbol");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Watchlist</h3>
        <Badge variant="secondary" className="ml-auto">
          {items.length}
        </Badge>
      </div>

      <div className="mb-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isAdding}
            >
              <Search className="h-4 w-4 mr-2" />
              {newSymbol || "Search and add stock..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search stocks..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No stocks found.</CommandEmpty>
                <CommandGroup heading="Popular Stocks">
                  {filteredStocks.map((stock) => (
                    <CommandItem
                      key={stock.symbol}
                      value={stock.symbol}
                      onSelect={() => {
                        setNewSymbol(stock.symbol);
                        handleAdd(stock.symbol);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold font-mono">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground">{stock.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isPositive = item.change >= 0;
          return (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-data-bg border border-data-border hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => onSelect(item.symbol)}
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-bold font-mono">{item.symbol}</p>
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${isPositive ? "text-bullish" : "text-bearish"}`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold font-mono">
                    {isPositive ? "+" : ""}{item.change.toFixed(2)}%
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.symbol);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No symbols in watchlist</p>
          </div>
        )}
      </div>
    </Card>
  );
};
