import { $api } from "@/lib/api";

export const useApplications = () => $api.useQuery("get", "/api/applications");

export const useApplication = (id: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/applications/{id}",
    { params: { path: { id } } },
    { enabled: enabled && id > 0 }
  );

export const useMyApplications = (enabled = true) =>
  $api.useQuery("get", "/api/applications/me", undefined, { enabled });

export const useApplyJobDescription = () => $api.useMutation("post", "/api/applications");
