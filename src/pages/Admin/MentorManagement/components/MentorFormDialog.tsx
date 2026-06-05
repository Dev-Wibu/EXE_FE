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
import { Textarea } from "@/components/ui/textarea";
import { inferFileKind, openUrlInNewTab } from "@/lib/media-file-utils";
import { ExternalLink, Eye, EyeOff, FileText, ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Mentor, MentorFormData } from "../types";

/**
 * Extended form data type to include file uploads
 * Based on schema-from-be.d.ts createMentor operation which requires:
 * - data: MentorInfo (JSON)
 * - avatar?: File (binary)
 * - identityFile?: File (binary)
 * - degreeFile?: File (binary)
 * - otherFile?: File (binary)
 */
interface ExtendedMentorFormData extends Partial<MentorFormData> {
  avatar?: File;
  identityFile?: File;
  degreeFile?: File;
  otherFile?: File;
}
interface MentorFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ExtendedMentorFormData;
  onFormChange: (data: ExtendedMentorFormData) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  /** Mentor being edited (optional, for showing existing file URLs) */
  selectedMentor?: Mentor | null;
}

// Check if URL is an image
const isImageUrl = (url: string | null | undefined, fileName?: string): boolean => {
  if (!url) return false;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

  // For blob URLs, check the file name if provided
  if (url.startsWith("blob:") && fileName) {
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  }

  // For server URLs, extract the path and check extension
  try {
    const urlPath = new URL(url).pathname.toLowerCase();
    return imageExtensions.some((ext) => urlPath.endsWith(ext));
  } catch {
    // If URL parsing fails, fallback to endsWith check on the full string
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
  }
};

// File preview component - defined outside main component to avoid re-creation during render
interface FilePreviewProps {
  url: string | null | undefined;
  previewUrl: string | null;
  isNew: boolean;
  onClear: () => void;
  onOpen: () => void;
  label: string;
  fileName?: string;
}
function FilePreview({
  url,
  previewUrl,
  isNew,
  onClear,
  onOpen,
  label,
  fileName,
}: FilePreviewProps) {
  const { t } = useTranslation();
  if (!url) return null;
  // Check if the URL points to an image, using fileName for blob URLs
  const isImage =
    isImageUrl(url, fileName) ||
    (previewUrl?.startsWith("blob:") && fileName && isImageUrl(previewUrl, fileName));
  return (
    <div className="relative mb-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-800">
      {isImage ? (
        <div className="relative mx-auto h-24 w-full overflow-hidden rounded-md">
          <img
            src={url}
            alt={label}
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="flex h-24 flex-col items-center justify-center">
          <FileText className="h-10 w-10 text-blue-500" />
          <span className="mt-1 max-w-full truncate text-xs text-gray-500">
            {fileName || t("adminMentormanagement.document")}
          </span>
        </div>
      )}
      <div className="mt-1 flex items-center justify-center gap-2">
        {isNew ? (
          <>
            <span className="text-xs text-green-600">{t("adminMentormanagement.newFile")}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={onClear}
              title={t("general.delete")}>
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-1 bg-transparent p-0 text-xs text-blue-600 hover:underline dark:text-blue-400">
            <span>{t("common.view")}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}
export function MentorFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  selectedMentor,
}: MentorFormDialogProps) {
  const { t } = useTranslation();
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  // State for local file previews (blob URLs for new file uploads)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [degreePreview, setDegreePreview] = useState<string | null>(null);
  const [otherPreview, setOtherPreview] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaViewerItem[]>([]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      if (identityPreview?.startsWith("blob:")) URL.revokeObjectURL(identityPreview);
      if (degreePreview?.startsWith("blob:")) URL.revokeObjectURL(degreePreview);
      if (otherPreview?.startsWith("blob:")) URL.revokeObjectURL(otherPreview);
    };
  }, [avatarPreview, identityPreview, degreePreview, otherPreview]);

  // Handle dialog open/close with preview reset
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset previews when closing
      setAvatarPreview(null);
      setIdentityPreview(null);
      setDegreePreview(null);
      setOtherPreview(null);
      setViewerOpen(false);
      setViewerItems([]);
    }
    onOpenChange(open);
  };

  // Handle file input changes with preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(file));
      onFormChange({
        ...formData,
        avatar: file,
      });
    }
  };
  const handleIdentityFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (identityPreview?.startsWith("blob:")) URL.revokeObjectURL(identityPreview);
      setIdentityPreview(URL.createObjectURL(file));
      onFormChange({
        ...formData,
        identityFile: file,
      });
    }
  };
  const handleDegreeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (degreePreview?.startsWith("blob:")) URL.revokeObjectURL(degreePreview);
      setDegreePreview(URL.createObjectURL(file));
      onFormChange({
        ...formData,
        degreeFile: file,
      });
    }
  };
  const handleOtherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (otherPreview?.startsWith("blob:")) URL.revokeObjectURL(otherPreview);
      setOtherPreview(URL.createObjectURL(file));
      onFormChange({
        ...formData,
        otherFile: file,
      });
    }
  };

  // Clear file handlers
  const handleClearAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    onFormChange({
      ...formData,
      avatar: undefined,
    });
  };
  const handleClearIdentity = () => {
    if (identityPreview?.startsWith("blob:")) URL.revokeObjectURL(identityPreview);
    setIdentityPreview(null);
    onFormChange({
      ...formData,
      identityFile: undefined,
    });
  };
  const handleClearDegree = () => {
    if (degreePreview?.startsWith("blob:")) URL.revokeObjectURL(degreePreview);
    setDegreePreview(null);
    onFormChange({
      ...formData,
      degreeFile: undefined,
    });
  };
  const handleClearOther = () => {
    if (otherPreview?.startsWith("blob:")) URL.revokeObjectURL(otherPreview);
    setOtherPreview(null);
    onFormChange({
      ...formData,
      otherFile: undefined,
    });
  };

  // Get display URLs - prioritize new upload preview over existing URL
  const displayAvatarUrl = avatarPreview || selectedMentor?.avatarUrl;
  const displayIdentityUrl = identityPreview || selectedMentor?.identityImg;
  const displayDegreeUrl = degreePreview || selectedMentor?.degreeImg;
  const displayOtherUrl = otherPreview || selectedMentor?.otherFile;
  const handleOpenFilePreview = ({
    label,
    url,
    file,
  }: {
    label: string;
    url?: string | null;
    file?: File;
  }) => {
    if (!url && !file) {
      return;
    }
    const fileKind = inferFileKind({
      fileName: file?.name || url || "",
      mimeType: file?.type,
    });
    if (fileKind === "other" && url) {
      openUrlInNewTab(url);
      return;
    }
    setViewerItems([
      {
        id: `mentor-form-${label}`,
        name: label,
        src: url ?? undefined,
        file,
        kind: fileKind,
        requireAuth: Boolean(url && !url.startsWith("blob:")),
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("common.fullName1")}</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    name: e.target.value,
                  })
                }
                placeholder={t("adminMentormanagement.enterMentorName")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("common.email")} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    email: e.target.value,
                  })
                }
                placeholder={t("common.emailPlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("common.password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    password: e.target.value,
                  })
                }
                placeholder={t("common.enterPassword")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">{t("common.introduceYourself")}</Label>
            <Textarea
              id="bio"
              value={formData.bio || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  bio: e.target.value,
                })
              }
              placeholder={t("adminMentormanagement.briefDescriptionYourExperienceSkills")}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expertise">{t("common.expertise")}</Label>
            <Textarea
              id="expertise"
              value={formData.expertise || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  expertise: e.target.value,
                })
              }
              placeholder={t("adminMentormanagement.forExampleReactNodeJs")}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="yearsOfExperience">{t("common.numberOfYearsOfExperience")}</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                value={formData.yearsOfExperience || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    yearsOfExperience: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentCompany">{t("common.currentCompany")}</Label>
              <Input
                id="currentCompany"
                value={formData.currentCompany || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    currentCompany: e.target.value,
                  })
                }
                placeholder={t("adminMentormanagement.companyName")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pricePerMinute">
              {t("adminMentormanagement.unitPricePerMinuteVnd")}
            </Label>
            <Input
              id="pricePerMinute"
              type="number"
              min={0}
              value={formData.pricePerMinute ?? ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  pricePerMinute: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder={t("adminMentormanagement.forExample5000")}
            />
          </div>
          {/* MentorInfo: id, name, email, password, bio, expertise, yearsOfExperience, linkedInUrl, currentCompany, pricePerMinute */}
          <div className="space-y-1.5">
            <Label htmlFor="linkedInUrl">{t("common.linkedinLink")}</Label>
            <Input
              id="linkedInUrl"
              value={formData.linkedInUrl || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  linkedInUrl: e.target.value,
                })
              }
              placeholder={t("common.linkedinPlaceholder")}
            />
          </div>
          {/* File Upload Section with Previews */}
          <div className="mt-2 border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">{t("adminMentormanagement.document")}</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Avatar */}
              <div className="space-y-1.5">
                <Label htmlFor="avatar">{t("common.avatar")}</Label>
                <FilePreview
                  url={displayAvatarUrl}
                  previewUrl={avatarPreview}
                  isNew={!!avatarPreview}
                  onClear={handleClearAvatar}
                  onOpen={() =>
                    handleOpenFilePreview({
                      label: t("common.avatar"),
                      url: displayAvatarUrl,
                      file: formData.avatar,
                    })
                  }
                  label={t("common.avatar")}
                  fileName={formData.avatar?.name}
                />
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="cursor-pointer"
                />
                {!displayAvatarUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <ImageIcon className="h-3 w-3" />
                    {t("common.noProfilePictureHasBeenSelectedYet")}
                  </p>
                )}
              </div>

              {/* Identity Document */}
              <div className="space-y-1.5">
                <Label htmlFor="identityFile">{t("adminMentormanagement.personalDocuments")}</Label>
                <FilePreview
                  url={displayIdentityUrl}
                  previewUrl={identityPreview}
                  isNew={!!identityPreview}
                  onClear={handleClearIdentity}
                  onOpen={() =>
                    handleOpenFilePreview({
                      label: t("adminMentormanagement.personalDocuments"),
                      url: displayIdentityUrl,
                      file: formData.identityFile,
                    })
                  }
                  label={t("common.identity")}
                  fileName={formData.identityFile?.name}
                />
                <Input
                  id="identityFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleIdentityFileChange}
                  className="cursor-pointer"
                />
                {!displayIdentityUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    {t("adminMentormanagement.idDocumentsHaveNotBeen")}
                  </p>
                )}
              </div>

              {/* Degree/Certificate */}
              <div className="space-y-1.5">
                <Label htmlFor="degreeFile">{t("common.degreecertificate")}</Label>
                <FilePreview
                  url={displayDegreeUrl}
                  previewUrl={degreePreview}
                  isNew={!!degreePreview}
                  onClear={handleClearDegree}
                  onOpen={() =>
                    handleOpenFilePreview({
                      label: t("common.degreecertificate"),
                      url: displayDegreeUrl,
                      file: formData.degreeFile,
                    })
                  }
                  label={t("common.degree")}
                  fileName={formData.degreeFile?.name}
                />
                <Input
                  id="degreeFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleDegreeFileChange}
                  className="cursor-pointer"
                />
                {!displayDegreeUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    {t("adminMentormanagement.noDegreeCertificateHasBeen")}
                  </p>
                )}
              </div>

              {/* Other File */}
              <div className="space-y-1.5">
                <Label htmlFor="otherFile">{t("adminMentormanagement.otherFiles")}</Label>
                <FilePreview
                  url={displayOtherUrl}
                  previewUrl={otherPreview}
                  isNew={!!otherPreview}
                  onClear={handleClearOther}
                  onOpen={() =>
                    handleOpenFilePreview({
                      label: t("common.otherDocuments"),
                      url: displayOtherUrl,
                      file: formData.otherFile,
                    })
                  }
                  label={t("common.other")}
                  fileName={formData.otherFile?.name}
                />
                <Input
                  id="otherFile"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleOtherFileChange}
                  className="cursor-pointer"
                />
                {!displayOtherUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    {t("adminMentormanagement.noOtherFilesHaveBeen")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("general.cancel")}
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>

      <MediaLightboxDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        items={viewerItems}
        initialIndex={0}
      />
    </Dialog>
  );
}
