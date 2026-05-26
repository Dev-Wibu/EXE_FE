import { Building2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { extractDataArray } from "@/lib/utils";
import { companyManager } from "@/services";

import { CompanyDetailView } from "./CompanyDetailView";
import { CompanyFormDialog } from "./components";
import { CompanyListSidebar } from "./components/CompanyListSidebar";
import type { Company, CompanyFormData } from "./types";

export function CompanyManagementPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const detailCompanyId = companyId ? Number(companyId) : null;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({});

  const loadCompanies = useCallback(async () => {
    try {
      const response = await companyManager.getAll();
      if (response.success) {
        setCompanies(extractDataArray<Company>(response));
      } else {
        toast.error(response.error || "Không thể tải danh sách công ty");
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Không thể tải danh sách công ty");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) void loadCompanies();
    return () => {
      mounted = false;
    };
  }, [loadCompanies]);

  const handleCreate = () => {
    setFormData({ status: "ACTIVE" });
    setIsCreateDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await companyManager.create({
        data: {
          name: formData.name?.trim() || undefined,
          description: formData.description?.trim() || undefined,
          status: formData.status,
        },
        logo: formData.logo,
        banner: formData.banner,
      });
      if (response.success) {
        toast.success("Đã tạo công ty thành công");
        setIsCreateDialogOpen(false);
        void loadCompanies();
        if (response.data?.id) {
          navigate(`/admin/companies/${response.data.id}?tab=companies`);
        }
      } else {
        toast.error(response.error || "Không thể tạo công ty");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Không thể tạo công ty");
    }
  };

  const hasDetail = !!detailCompanyId;

  return (
    <div className="border-border/50 bg-background/50 flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl border shadow-sm">
      {/*
       * Responsive layout:
       * - Mobile: Sidebar visible only when no company is selected. Detail visible only when company is selected.
       * - Desktop (md+): Both columns visible side-by-side at all times.
       */}
      <CompanyListSidebar
        companies={companies}
        selectedCompanyId={detailCompanyId}
        onSelectCompany={(id) => navigate(`/admin/companies/${id}?tab=companies`)}
        onCreateCompany={handleCreate}
        className={hasDetail ? "hidden md:flex" : "flex"}
      />

      <main
        className={`flex-1 overflow-y-auto ${hasDetail ? "flex" : "hidden md:flex"} flex-col`}
      >
        {detailCompanyId ? (
          <CompanyDetailView companyId={detailCompanyId} onCompanyUpdate={loadCompanies} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="bg-primary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <Building2 className="text-primary h-10 w-10" />
            </div>
            <h2 className="text-foreground mb-2 text-2xl font-bold">Quản lý Công ty & JD</h2>
            <p className="text-muted-foreground max-w-md">
              Vui lòng chọn một đối tác từ danh sách bên trái để xem chi tiết thông tin và các mô tả
              công việc (JD) đang tuyển.
            </p>
          </div>
        )}
      </main>

      <CompanyFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm đối tác mới"
        description="Điền thông tin cơ bản để tạo đối tác mới"
        submitLabel="Tạo đối tác"
      />
    </div>
  );
}
