import { $api } from "@/lib/api";
import type { components } from "../../schema-from-be";

export type Round = components["schemas"]["Round"];

export const useSetupRoundsForJd = () => $api.useMutation("put", "/api/rounds/jd/{jdId}");

export const useUpdateRoundsForJd = () => $api.useMutation("put", "/api/rounds/jd/{jdId}/update");

export const useCurrentRound = (applicationId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/rounds/find-by-application-order/{applicationId}",
    { params: { path: { applicationId } } },
    { enabled: enabled && applicationId > 0 }
  );
