import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["1-9"], description: "Switch tabs (1=Overview, 2=Portfolio, etc.)", category: "Navigation" },
  { keys: ["S"], description: "Go to settings", category: "Navigation" },
  { keys: ["Esc"], description: "Close dialogs", category: "Navigation" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "Navigation" },
  
  // Data & Trading
  { keys: ["R"], description: "Refresh market data", category: "Trading" },
  { keys: ["T"], description: "Toggle autotrade", category: "Trading" },
  { keys: ["B"], description: "Quick buy order", category: "Trading" },
  { keys: ["N"], description: "Quick sell order", category: "Trading" },
  { keys: ["A"], description: "Add price alert", category: "Trading" },
  { keys: ["W"], description: "Add to watchlist", category: "Trading" },
  
  // Charts
  { keys: ["C"], description: "Toggle chart type", category: "Charts" },
  { keys: ["I"], description: "Cycle indicators", category: "Charts" },
  { keys: ["Z"], description: "Zoom chart", category: "Charts" },
  { keys: ["F"], description: "Fullscreen chart", category: "Charts" },
];

export const KeyboardShortcutsHelp = () => {
  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts for faster navigation and trading
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6 mt-4">
            {categories.map((category) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-primary mb-3">{category}</h4>
                <div className="space-y-2">
                  {shortcuts
                    .filter(s => s.category === category)
                    .map((shortcut) => (
                      <div
                        key={shortcut.description}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key) => (
                            <kbd
                              key={key}
                              className="px-2.5 py-1 text-xs font-semibold bg-background border border-border rounded-md shadow-sm font-mono"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">?</kbd> anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
