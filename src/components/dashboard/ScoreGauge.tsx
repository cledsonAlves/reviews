import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Props {
  score: number;
  ratings: number;
}

export function ScoreGauge({ score, ratings }: Props) {
  const pct = (score / 5) * 100;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score Geral
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeDasharray={`${(pct / 100) * 314} 314`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold font-mono gradient-text">{score.toFixed(1)}</span>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.round(score) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-mono">
          {ratings.toLocaleString("pt-BR")} avaliações
        </p>
      </CardContent>
    </Card>
  );
}
