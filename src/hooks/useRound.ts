import { $api } from "@/lib/api";

export const useSetupRoundsForJd = () => $api.useMutation("put", "/api/rounds/jd/{jdId}");

export const useUpdateRoundsForJd = () => $api.useMutation("put", "/api/rounds/jd/{jdId}/update");
