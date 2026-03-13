import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/hooks/useAppReviews";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface Props {
  reviews: Review[];
}

export function SentimentChart({ reviews }: Props) {
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const neutral = reviews.filter((r) => r.rating === 3).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;

  const data = [
    { name: "Positivo", value: positive, color: "hsl(142, 71%, 45%)" },
    { name: "Neutro", value: neutral, color: "hsl(38, 92%, 50%)" },
    { name: "Negativo", value: negative, color: "hsl(0, 72%, 51%)" },
  ].filter((d) => d.value > 0);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sentimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { label: "Positivo", value: positive, cls: "text-success" },
            { label: "Neutro", value: neutral, cls: "text-warning" },
            { label: "Negativo", value: negative, cls: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-lg font-bold font-mono ${s.cls}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
