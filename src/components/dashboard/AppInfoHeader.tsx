import { AppInfo } from "@/hooks/useAppInfo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Download, Code, Building2, Mail, Calendar, ExternalLink } from "lucide-react";
import { StoreType } from "@/hooks/useAppReviews";

interface Props {
  appInfo: AppInfo;
  store: StoreType;
}

export function AppInfoHeader({ appInfo, store }: Props) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <img
              src={appInfo.icon_url}
              alt={appInfo.title}
              className="h-20 w-20 rounded-2xl shadow-lg border border-border"
            />
          </div>

          {/* App Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{appInfo.title}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{appInfo.package}</p>
              </div>
              <a
                href={appInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded-lg bg-secondary p-2 hover:bg-secondary/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>

            {/* Score + Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold font-mono gradient-text">
                  {appInfo.score.toFixed(1)}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(appInfo.score)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {store === "apple_store" ? "App Store" : "Google Play"}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                {appInfo.genre}
              </Badge>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-primary" />
                <span className="font-mono">{appInfo.ratings.toLocaleString("pt-BR")}</span>
                <span>avaliações</span>
              </div>
              {appInfo.installs && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Download className="h-3 w-3 text-primary" />
                  <span className="font-mono">{appInfo.installs}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Code className="h-3 w-3 text-primary" />
                <span className="font-mono">v{appInfo.version}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 text-primary" />
                <span className="truncate">{appInfo.developer}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pt-1">
              {appInfo.description_short}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
