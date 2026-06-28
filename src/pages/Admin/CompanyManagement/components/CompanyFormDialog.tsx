import { MediaLightboxDialog, type MediaViewerItem } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { inferFileKind, openUrlInNewTab } from "@/lib/media-file-utils";
import { ExternalLink, ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Company, CompanyFormData, CompanyStatus } from "../types";
interface CompanyFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CompanyFormData;
  onFormChange: (data: CompanyFormData) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  selectedCompany?: Company | null;
  isSubmitting?: boolean;
}
const COMPANY_STATUSES: CompanyStatus[] = ["ACTIVE", "INACTIVE"];
export function CompanyFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  selectedCompany,
  isSubmitting = false,
}: CompanyFormDialogProps) {
  const { t } = useTranslation();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaViewerItem[]>([]);
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview, logoPreview]);
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setLogoPreview(null);
      setBannerPreview(null);
      setViewerOpen(false);
      setViewerItems([]);
    }
    onOpenChange(open);
  };
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(URL.createObjectURL(file));
    onFormChange({
      ...formData,
      logo: file,
    });
  };
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }
    setBannerPreview(URL.createObjectURL(file));
    onFormChange({
      ...formData,
      banner: file,
    });
  };
  const handleClearLogo = () => {
    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    onFormChange({
      ...formData,
      logo: undefined,
    });
  };
  const handleClearBanner = () => {
    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }
    setBannerPreview(null);
    onFormChange({
      ...formData,
      banner: undefined,
    });
  };
  const displayLogoUrl = logoPreview || selectedCompany?.logoUrl;
  const displayBannerUrl = bannerPreview || selectedCompany?.bannerUrl;
  const openMediaPreview = (label: string, url?: string | null) => {
    if (!url) {
      return;
    }
    const kind = inferFileKind({
      fileName: url,
    });
    if (kind === "other") {
      openUrlInNewTab(url);
      return;
    }
    setViewerItems([
      {
        id: `admin-company-preview-${label}`,
        name: label,
        src: url,
        kind,
        requireAuth: !url.startsWith("blob:"),
      },
    ]);
    setViewerOpen(true);
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">{t("adminCompanymanagement.companyName")}</Label>
              <Input
                id="company-name"
                value={formData.name || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    name: e.target.value,
                  })
                }
                placeholder={t("adminCompanymanagement.enterTheCompanyName")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-status">{t("common.status")}</Label>
              <Select
                value={formData.status || "ACTIVE"}
                onValueChange={(value) =>
                  onFormChange({
                    ...formData,
                    status: value as CompanyStatus,
                  })
                }>
                <SelectTrigger id="company-status">
                  <SelectValue placeholder={t("common.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-description">{t("common.describe")}</Label>
            <Textarea
              id="company-description"
              value={formData.description || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  description: e.target.value,
                })
              }
              placeholder={t("adminCompanymanagement.companyDescription")}
              rows={4}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-logo">{t("adminCompanymanagement.companyLogo")}</Label>
              <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
                {displayLogoUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-white shadow">
                      <img
                        src={displayLogoUrl}
                        alt={t("adminCompanymanagement.companyLogo")}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      {logoPreview ? (
                        <>
                          <span className="text-xs text-green-600">
                            {t("common.newFileSelected")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={handleClearLogo}
                            title={t("adminCompanymanagement.deleteLogo")}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openMediaPreview(
                              t("adminCompanymanagement.companyLogo"),
                              displayLogoUrl
                            )
                          }
                          className="flex items-center gap-1 bg-transparent p-0 text-xs text-blue-600 hover:underline dark:text-blue-400">
                          <span>{t("common.seeFullPhoto")}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    <span>{t("adminCompanymanagement.noLogoYet")}</span>
                  </div>
                )}
              </div>
              <Input id="company-logo" type="file" accept="image/*" onChange={handleLogoChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-banner">{t("adminCompanymanagement.companyBanners")}</Label>
              <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
                {displayBannerUrl ? (
                  <div className="space-y-2">
                    <div className="h-20 w-full overflow-hidden rounded-md bg-white shadow">
                      <img
                        src={displayBannerUrl}
                        alt={t("adminCompanymanagement.companyBanners")}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {bannerPreview ? (
                        <>
                          <span className="text-xs text-green-600">
                            {t("common.newFileSelected")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={handleClearBanner}
                            title={t("adminCompanymanagement.deleteBanners")}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openMediaPreview(
                              t("adminCompanymanagement.companyBanners"),
                              displayBannerUrl
                            )
                          }
                          className="flex items-center gap-1 bg-transparent p-0 text-xs text-blue-600 hover:underline dark:text-blue-400">
                          <span>{t("common.seeFullPhoto")}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    <span>{t("adminCompanymanagement.noBannersYet")}</span>
                  </div>
                )}
              </div>
              <Input
                id="company-banner"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("general.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" tone="white" />
                {t("common.processing")}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <MediaLightboxDialog open={viewerOpen} onOpenChange={setViewerOpen} items={viewerItems} />
    </Dialog>
  );
}
