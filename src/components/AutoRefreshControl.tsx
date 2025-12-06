import { Button } from "@/components/ui/button";
import { RefreshCw, Timer, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REFRESH_INTERVALS } from "@/hooks/useAutoRefresh";

interface AutoRefreshControlProps {
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  secondsUntilRefresh: number;
  interval: number;
  onRefresh: () => void;
  onToggle: () => void;
  onIntervalChange: (interval: number) => void;
}

export const AutoRefreshControl = ({
  isRefreshing,
  autoRefreshEnabled,
  secondsUntilRefresh,
  interval,
  onRefresh,
  onToggle,
  onIntervalChange,
}: AutoRefreshControlProps) => {
  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="flex items-center gap-1">
      <Button 
        variant={autoRefreshEnabled ? "default" : "outline"} 
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="gap-1"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {autoRefreshEnabled && <span className="text-xs">{formatTime(secondsUntilRefresh)}</span>}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
            className="gap-1 px-2"
          >
            <Timer className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">
              {autoRefreshEnabled ? formatTime(interval) : "Auto"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={onToggle}
            className="font-medium"
          >
            {autoRefreshEnabled ? "⏸ Disable Auto-Refresh" : "▶ Enable Auto-Refresh"}
          </DropdownMenuItem>
          <div className="border-t my-1" />
          {REFRESH_INTERVALS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onIntervalChange(opt.value)}
              className={interval === opt.value ? "bg-accent" : ""}
            >
              Every {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
