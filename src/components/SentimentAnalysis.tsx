import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ThumbsUp, ThumbsDown, Minus } from "lucide-react";

interface SentimentAnalysisProps {
  score: number; // -1 to 1
  articles: number;
  lastUpdate: string;
}

export const SentimentAnalysis = ({ score, articles, lastUpdate }: SentimentAnalysisProps) => {
  // Convert -1 to 1 scale to 0 to 100 for progress bar
  const progressValue = ((score + 1) / 2) * 100;
  
  const getSentimentLabel = () => {
    if (score > 0.3) return { text: "Bullish", color: "text-bullish", icon: ThumbsUp };
    if (score < -0.3) return { text: "Bearish", color: "text-bearish", icon: ThumbsDown };
    return { text: "Neutral", color: "text-neutral", icon: Minus };
  };

  const sentiment = getSentimentLabel();
  const SentimentIcon = sentiment.icon;

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Sentiment Analysis</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-2xl font-bold ${sentiment.color} flex items-center gap-2`}>
            <SentimentIcon className="h-6 w-6" />
            {sentiment.text}
          </span>
          <span className="text-3xl font-bold font-mono">{score.toFixed(2)}</span>
        </div>

        <Progress value={progressValue} className="h-2" />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{articles} articles analyzed</span>
          <span>Updated: {lastUpdate}</span>
        </div>
      </div>
    </Card>
  );
};
