import { useMutation } from "@tanstack/react-query";

import { $api } from "@/lib/api";
import type { CreateCompanyPayload, UpdateCompanyPayload } from "@/services/company.manager";
import { companyManager } from "@/services/company.manager";

export const useCompanies = () => $api.useQuery("get", "/api/companies");

export const useCompany = (id: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/companies/{id}",
    { params: { path: { id } } },
    { enabled: enabled && id > 0 }
  );

export const useCreateCompany = () =>
  useMutation({
    mutationFn: async (payload: CreateCompanyPayload) => {
      const response = await companyManager.create(payload);
      if (!response.success) {
        throw new Error(response.error || "Khong the tao cong ty");
      }
      return response.data;
    },
  });

export const useUpdateCompany = () =>
  useMutation({
    mutationFn: async (payload: UpdateCompanyPayload) => {
      const response = await companyManager.update(payload);
      if (!response.success) {
        throw new Error(response.error || "Khong the cap nhat cong ty");
      }
      return response.data;
    },
  });

export const useDeleteCompany = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await companyManager.delete(id);
      if (!response.success) {
        throw new Error(response.error || "Khong the xoa cong ty");
      }
      return true;
    },
  });
