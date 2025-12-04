import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseAutoRefreshOptions {
  onRefresh: () => Promise<void> | void;
  interval?: number; // in seconds
  enabled?: boolean;
}

export const useAutoRefresh = ({ onRefresh, interval = 30, enabled = false }: UseAutoRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enabled);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(interval);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async (showToast = true) => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
      setSecondsUntilRefresh(interval);
      if (showToast) {
        toast({
          title: "Data refreshed",
          description: "All data has been updated",
          duration: 1500,
        });
      }
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, interval, toast]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => {
      const newValue = !prev;
      toast({
        title: newValue ? "Auto-refresh enabled" : "Auto-refresh disabled",
        description: newValue ? `Refreshing every ${interval} seconds` : "Manual refresh only",
        duration: 2000,
      });
      return newValue;
    });
  }, [interval, toast]);

  // Auto refresh interval
  useEffect(() => {
    if (autoRefreshEnabled) {
      intervalRef.current = setInterval(() => {
        refresh(false);
      }, interval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, interval, refresh]);

  // Countdown timer
  useEffect(() => {
    if (autoRefreshEnabled) {
      countdownRef.current = setInterval(() => {
        setSecondsUntilRefresh((prev) => (prev <= 1 ? interval : prev - 1));
      }, 1000);
    } else {
      setSecondsUntilRefresh(interval);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [autoRefreshEnabled, interval]);

  return {
    isRefreshing,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refresh,
    lastRefresh,
    secondsUntilRefresh,
  };
};