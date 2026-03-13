import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/hooks/useAppReviews";
import { Star } from "lucide-react";

interface Props {
  reviews: Review[];
  totalRatings: number;
}

export function RatingDistribution({ reviews, totalRatings }: Props) {
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0 };
  });

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Distribuição de Avaliações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dist.map(({ star, count, pct }) => (
          <div key={star} className="flex items-center gap-3">
            <div className="flex w-8 items-center gap-1 text-sm font-mono text-muted-foreground">
              {star}
              <Star className="h-3 w-3 fill-primary text-primary" />
            </div>
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-8 text-right">{count}</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-2">
          Baseado em {reviews.length} reviews carregados de {totalRatings.toLocaleString("pt-BR")} total
        </p>
      </CardContent>
    </Card>
  );
}
