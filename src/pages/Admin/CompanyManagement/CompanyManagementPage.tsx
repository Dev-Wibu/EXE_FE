import { extractDataArray } from "@/lib/utils";
import { companyManager } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CompanyDetailView } from "./CompanyDetailView";
import { CompanyFormDialog } from "./components";
import { CompanyListSidebar } from "./components/CompanyListSidebar";
import type { Company, CompanyFormData } from "./types";
interface CompanyManagementPageProps {
  isActive?: boolean;
}

export function CompanyManagementPage({ isActive: propActive }: CompanyManagementPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();

  const activeTabParam = searchParams.get("tab");
  const isActive =
    propActive !== undefined
      ? propActive
      : activeTabParam === "companies" || (!activeTabParam && !companyId);

  const [frozenCompanyId, setFrozenCompanyId] = useState<number | null>(
    companyId ? Number(companyId) : null
  );

  const [prevCompanyId, setPrevCompanyId] = useState<string | undefined>(companyId);
  const [prevIsActive, setPrevIsActive] = useState<boolean>(isActive);

  if (isActive !== prevIsActive || companyId !== prevCompanyId) {
    setPrevIsActive(isActive);
    setPrevCompanyId(companyId);
    if (isActive) {
      if (companyId) {
        setFrozenCompanyId(Number(companyId));
      } else {
        if (prevIsActive) {
          setFrozenCompanyId(null);
        }
      }
    }
  }

  useEffect(() => {
    if (isActive && frozenCompanyId && !companyId) {
      navigate(`/admin/companies/${frozenCompanyId}?tab=companies`, { replace: true });
    }
  }, [isActive, frozenCompanyId, companyId, navigate]);

  const detailCompanyId = frozenCompanyId;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({});
  const { data: companies = [], refetch: refetchCompanies } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: async () => {
      const response = await companyManager.getAll();
      if (response.success) {
        // @ts-expect-error: Schema type mismatch between frontend and backend
        return extractDataArray<Company>(response);
      }
      toast.error(response.error || t("common.unableToLoadCompanyList"));
      return [];
    },
  });
  const handleCreate = () => {
    setFormData({
      status: "ACTIVE",
    });
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
        toast.success(t("adminCompanymanagement.successfullyCreatedCompany"));
        setIsCreateDialogOpen(false);
        void refetchCompanies();
        if (response.data?.id) {
          navigate(`/admin/companies/${response.data.id}?tab=companies`);
        }
      } else {
        toast.error(response.error || t("common.cannotCreateCompany"));
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error(t("common.cannotCreateCompany"));
    }
  };
  const hasDetail = !!detailCompanyId;
  return (
    <div className="border-border/50 bg-background/50 flex h-[calc(100vh-6rem)] min-h-0 w-full overflow-hidden rounded-2xl border shadow-sm">
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
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${hasDetail ? "flex" : "hidden md:flex"}`}>
        {detailCompanyId ? (
          <CompanyDetailView
            companyId={detailCompanyId}
            onCompanyUpdate={() => void refetchCompanies()}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="bg-primary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <Building2 className="text-primary h-10 w-10" />
            </div>
            <h2 className="text-foreground mb-2 text-2xl font-bold">
              {t("adminCompanymanagement.companyManagementJd")}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {t("adminCompanymanagement.pleaseSelectAPartnerFrom")}
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
        title={t("adminCompanymanagement.addNewPartners")}
        description={t("adminCompanymanagement.fillInBasicInformationTo")}
        submitLabel={t("adminCompanymanagement.createPartners")}
      />
    </div>
  );
}
