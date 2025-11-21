import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MarketDataErrorProps {
  error: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const MarketDataError = ({ error, onRetry, isRetrying = false }: MarketDataErrorProps) => {
  const navigate = useNavigate();
  const isConfigError = error.includes('configured') || error.includes('API key') || error.includes('provider');

  return (
    <Alert variant="destructive" className="border-bearish/30 bg-bearish/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Market Data Error</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">{error}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-border hover:bg-background"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
            Retry
          </Button>
          {isConfigError && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure Provider
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
