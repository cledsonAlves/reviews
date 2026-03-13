import { useState } from "react";
import { useAppReviews, StoreType } from "@/hooks/useAppReviews";
import { useAppInfo } from "@/hooks/useAppInfo";
import { AppInfoHeader } from "@/components/dashboard/AppInfoHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import { RatingDistribution } from "@/components/dashboard/RatingDistribution";
import { ReviewsFeed } from "@/components/dashboard/ReviewsFeed";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { VersionChart } from "@/components/dashboard/VersionChart";
import { Star, MessageSquare, TrendingDown, RefreshCw, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [packageId, setPackageId] = useState("com.itau.investimentos");
  const [store, setStore] = useState<StoreType>("google_play");
  const [inputValue, setInputValue] = useState("com.itau.investimentos");

  const { data, isLoading, isError, isRefetching, refetch } = useAppReviews(packageId, store);
  const { data: appInfo, isLoading: appInfoLoading } = useAppInfo(packageId, store);

  const handleSearch = () => {
    if (inputValue.trim()) {
      setPackageId(inputValue.trim());
    }
  };

  const reviews = data?.reviews ?? [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  const negativeCount = reviews.filter((r) => r.rating <= 2).length;
  const negPct = reviews.length > 0 ? ((negativeCount / reviews.length) * 100).toFixed(0) : "0";
  const positiveCount = reviews.filter((r) => r.rating >= 4).length;

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard de Reviews</h1>
            <p className="text-xs text-muted-foreground mt-1">Monitore avaliações em tempo real</p>
          </div>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-secondary p-2 hover:bg-secondary/80 transition-colors"
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="com.exemplo.app"
              className="bg-secondary border-border font-mono text-sm"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg bg-primary px-4 hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Search className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>

          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setStore("google_play")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                store === "google_play"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Android
            </button>
            <button
              onClick={() => setStore("apple_store")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                store === "apple_store"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              iOS
            </button>
          </div>
        </div>

      </div>

      {/* App Info */}
      {appInfo && <AppInfoHeader appInfo={appInfo} store={store} />}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-destructive">Erro ao carregar dados. Tente novamente.</p>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Nota Média"
              value={avgRating.toFixed(2)}
              icon={Star}
              trend={`${reviews.length} reviews`}
            />
            <MetricCard
              label="Reviews Positivos"
              value={positiveCount.toString()}
              icon={MessageSquare}
              trend={`${reviews.length > 0 ? ((positiveCount / reviews.length) * 100).toFixed(0) : 0}%`}
              trendPositive
            />
            <MetricCard
              label="Reviews Negativos"
              value={`${negPct}%`}
              icon={TrendingDown}
              trend={`${negativeCount} de ${reviews.length}`}
              trendPositive={false}
            />
            <MetricCard
              label="Total Reviews"
              value={reviews.length.toString()}
              icon={MessageSquare}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-4">
              <ScoreGauge score={avgRating} ratings={reviews.length} />
              <RatingDistribution reviews={reviews} totalRatings={reviews.length} />
              <SentimentChart reviews={reviews} />
            </div>
            <div className="lg:col-span-8 space-y-4">
              <VersionChart reviews={reviews} />
              <ReviewsFeed reviews={reviews} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
