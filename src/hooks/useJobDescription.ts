import { $api } from "@/lib/api";
import type { JobDescriptionSearchParams } from "@/services/job-description.manager";

export const useJobDescriptions = () => $api.useQuery("get", "/api/job-descriptions");

export const useJobDescription = (id: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/job-descriptions/{id}",
    { params: { path: { id } } },
    { enabled: enabled && id > 0 }
  );

export const useJobDescriptionsByCompany = (companyId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/job-descriptions/company/{companyId}",
    { params: { path: { companyId } } },
    { enabled: enabled && companyId > 0 }
  );

export const useSearchJobDescriptions = (params?: JobDescriptionSearchParams, enabled = true) =>
  $api.useQuery("get", "/api/job-descriptions/search", { params: { query: params } }, { enabled });

export const useCreateJobDescription = () => $api.useMutation("post", "/api/job-descriptions");

export const useUpdateJobDescription = () => $api.useMutation("put", "/api/job-descriptions");

export const useSoftDeleteJobDescription = () =>
  $api.useMutation("delete", "/api/job-descriptions/{id}/soft");
