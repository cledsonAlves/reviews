import { useQuery } from "@tanstack/react-query";

export type StoreType = "google_play" | "apple_store";

export interface Review {
  review_id: string;
  user_name: string;
  user_image: string | null;
  rating: number;
  content: string;
  thumbs_up: number;
  app_version: string | null;
  date: string;
  reply_content: string | null;
  reply_date: string | null;
  store?: string;
}

export interface AppReviewsResponse {
  reviews: Review[];
  store: string;
}

const fetchReviews = async (packageId: string, store: StoreType): Promise<AppReviewsResponse> => {
  const res = await fetch(
    `https://api.jarifast.com.br/api/reviews/?package=${encodeURIComponent(packageId)}&store=${store}`
  );
  if (!res.ok) throw new Error("Failed to fetch reviews");
  const data = await res.json();

  if (Array.isArray(data)) {
    return { reviews: data, store: data[0]?.store || store };
  }

  if (data.reviews) {
    return { reviews: data.reviews, store: data.store || store };
  }

  return { reviews: [], store };
};

export function useAppReviews(packageId: string, store: StoreType) {
  return useQuery({
    queryKey: ["app-reviews", packageId, store],
    queryFn: () => fetchReviews(packageId, store),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: !!packageId,
  });
}
