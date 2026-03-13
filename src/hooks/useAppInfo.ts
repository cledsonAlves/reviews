import { useQuery } from "@tanstack/react-query";
import { StoreType } from "./useAppReviews";

export interface AppInfo {
  package: string;
  title: string;
  version: string;
  score: number;
  ratings: number;
  reviews_count: number;
  installs: string | null;
  developer: string;
  developer_email: string | null;
  genre: string;
  released: string;
  updated: string;
  description_short: string;
  icon_url: string;
  url: string;
}

const fetchAppInfo = async (packageId: string, store: StoreType): Promise<AppInfo> => {
  const res = await fetch(
    `https://api.jarifast.com.br/api/app-info/${encodeURIComponent(packageId)}?store=${store}&lang=pt&country=br`
  );
  if (!res.ok) throw new Error("Failed to fetch app info");
  return res.json();
};

export function useAppInfo(packageId: string, store: StoreType) {
  return useQuery({
    queryKey: ["app-info", packageId, store],
    queryFn: () => fetchAppInfo(packageId, store),
    staleTime: 60000,
    enabled: !!packageId,
  });
}
