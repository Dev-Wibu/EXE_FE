import type { FeatureName } from "@/interfaces";
import { $api } from "@/lib/api";

export const useFeatureUsageLogs = () => $api.useQuery("get", "/api/feature-usage-logs");

export const useFeatureUsageLogsByFeature = (featureName: FeatureName, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/feature-usage-logs/by-feature",
    { params: { query: { featureName } } },
    { enabled }
  );
