import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const MarketDataSkeleton = () => (
  <Card className="p-5 bg-card border-border">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
    <div className="mt-6 space-y-3">
      <div className="flex items-baseline gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </Card>
);

export const TradingSignalSkeleton = () => (
  <Card className="p-5 bg-card border-border">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-12 w-1/2 rounded-lg" />
        <Skeleton className="h-12 w-1/2 rounded-lg" />
      </div>
    </div>
  </Card>
);

export const SentimentSkeleton = () => (
  <Card className="p-5 bg-card border-border">
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </Card>
);

export const ChartSkeleton = () => (
  <Card className="p-6 bg-card border-border">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded" />
        <Skeleton className="h-8 w-16 rounded" />
      </div>
    </div>
    <Skeleton className="h-[300px] w-full rounded-lg" />
  </Card>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <Card className="p-6 bg-card border-border">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
        </div>
      ))}
    </div>
  </Card>
);

export const WatchlistSkeleton = () => (
  <Card className="p-5 bg-card border-border">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  </Card>
);
