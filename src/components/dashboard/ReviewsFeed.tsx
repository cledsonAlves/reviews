import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/hooks/useAppReviews";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  reviews: Review[];
}

function getSentimentClass(rating: number) {
  if (rating >= 4) return "review-positive";
  if (rating >= 3) return "review-neutral";
  return "review-negative";
}

export function ReviewsFeed({ reviews }: Props) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Reviews Recentes
          </CardTitle>
          <span className="text-xs font-mono text-muted-foreground">{reviews.length} reviews</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {reviews.map((review) => (
          <div
            key={review.review_id}
            className={`rounded-lg bg-secondary/50 p-4 ${getSentimentClass(review.rating)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{review.user_name}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {format(new Date(review.date), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
            <p className="text-sm text-secondary-foreground leading-relaxed">{review.content}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {review.app_version && <span className="font-mono">v{review.app_version}</span>}
              {review.thumbs_up > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" /> {review.thumbs_up}
                </span>
              )}
              {review.reply_content && (
                <span className="flex items-center gap-1 text-primary">
                  <MessageSquare className="h-3 w-3" /> Respondido
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
