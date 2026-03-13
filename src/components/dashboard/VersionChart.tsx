import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/hooks/useAppReviews";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  reviews: Review[];
}

export function VersionChart({ reviews }: Props) {
  const versionMap: Record<string, { total: number; sum: number }> = {};
  reviews.forEach((r) => {
    const ver = r.app_version || "N/A";
    if (!versionMap[ver]) versionMap[ver] = { total: 0, sum: 0 };
    versionMap[ver].total++;
    versionMap[ver].sum += r.rating;
  });

  const data = Object.entries(versionMap)
    .map(([version, { total, sum }]) => ({
      version,
      avg: Number((sum / total).toFixed(2)),
      count: total,
    }))
    .sort((a, b) => a.version.localeCompare(b.version));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score por Versão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis
              dataKey="version"
              tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 41%, 9%)",
                border: "1px solid hsl(222, 20%, 16%)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(210, 20%, 92%)" }}
            />
            <Bar dataKey="avg" fill="hsl(27, 87%, 46%)" radius={[4, 4, 0, 0]} name="Nota Média" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
