import { $api } from "@/lib/api";
import type { components } from "../../schema-from-be";

export type ApplicationDetail = components["schemas"]["ApplicationDetail"];

export const useApplicationDetails = (applicationId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/application-details/application/{applicationId}",
    { params: { path: { applicationId } } },
    { enabled: enabled && applicationId > 0 }
  );

export const useApplicationDetail = (id: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/application-details/{id}",
    { params: { path: { id } } },
    { enabled: enabled && id > 0 }
  );
