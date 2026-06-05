import { MediaLightboxDialog, type MediaViewerItem } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMajorOptions } from "@/constants/majors";
import { inferFileKind, openUrlInNewTab } from "@/lib/media-file-utils";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Upload,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { UserProfileData } from "./types";
interface ProfileTabProps {
  userProfile: UserProfileData;
  isEditing: boolean;
  isSaving: boolean;
  formData: Partial<UserProfileData>;
  avatarPreview: string | null;
  onRefreshData: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void;
  onInputChange: (field: keyof UserProfileData, value: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAvatar: () => void;
  onOpenCvModal: () => void;
}
export function ProfileTab({
  userProfile,
  isEditing,
  isSaving,
  formData,
  avatarPreview,
  onRefreshData,
  onStartEdit,
  onCancelEdit,
  onSaveProfile,
  onInputChange,
  onAvatarChange,
  onClearAvatar,
  onOpenCvModal,
}: ProfileTabProps) {
  const { t } = useTranslation();
  const majorOptions = useMajorOptions();
  const getMajorLabel = (value: string): string => {
    const major = majorOptions.find((option) => option.value === value);
    return major?.label || "";
  };
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaViewerItem[]>([]);
  const handlePreviewCurrentCv = () => {
    if (!userProfile.cvUrl) {
      return;
    }
    const cvKind = inferFileKind({
      fileName: userProfile.cvUrl,
    });
    if (cvKind === "other") {
      openUrlInNewTab(userProfile.cvUrl);
      return;
    }
    setViewerItems([
      {
        id: "profile-current-cv",
        name: t("common.currentCv"),
        src: userProfile.cvUrl,
        kind: cvKind,
        requireAuth: true,
      },
    ]);
    setViewerOpen(true);
  };
  return (
    <div className="flex flex-col gap-6">
      {/* User Info Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0px_6px_20px_0px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-linear-to-r from-[#EAF2FF] via-white to-white p-6 dark:border-slate-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
                  {t("common.personalInformation")}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefreshData}
                  title={t("common.refreshData")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("userAccount.updatedTheBasicProfileSo")}
              </p>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={onStartEdit}>
                {t("general.edit")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={isSaving}>
                  <X className="mr-1 h-4 w-4" />
                  {t("general.cancel")}
                </Button>
                <Button size="sm" onClick={onSaveProfile} disabled={isSaving}>
                  <Save className="mr-1 h-4 w-4" />
                  {isSaving ? t("common.saving") : t("general.save")}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-white/70 dark:bg-slate-900 dark:ring-slate-900/80">
                {avatarPreview || userProfile.avatar ? (
                  <img
                    src={avatarPreview || userProfile.avatar || ""}
                    alt={userProfile.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-9 w-9 text-[#0047AB] dark:text-[#66B2FF]" />
                )}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("common.avatar")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("userAccount.pngOrJpgMaximum5mb")}
              </p>
              {isEditing && (
                <>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={onAvatarChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                    {t("userAccount.changePhoto")}
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={onClearAvatar}
                      className="mt-2 text-xs font-medium text-rose-500 hover:text-rose-600">
                      {t("userAccount.removeSelectedPhoto")}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <User className="h-4 w-4" />
                  <Label className="text-sm">{t("common.fullName")}</Label>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => onInputChange("name", e.target.value)}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                    {userProfile.name}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Mail className="h-4 w-4" />
                  <Label className="text-sm">{t("common.email")}</Label>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {t("common.cannotBeChanged")}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {userProfile.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education & Career Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0px_6px_20px_0px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          {t("userAccount.educationCareerGoals")}
        </h3>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* University - Editable */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <GraduationCap className="h-4 w-4" />
              <Label className="text-sm">{t("common.university")}</Label>
            </div>
            {isEditing ? (
              <Input
                value={formData.university || ""}
                onChange={(e) => onInputChange("university", e.target.value)}
                className="mt-2"
                placeholder={t("userAccount.forExampleHanoiUniversityOf")}
              />
            ) : (
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {userProfile.university || t("common.notUpdatedYet")}
              </p>
            )}
          </div>

          {/* Major - Editable */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <BookOpen className="h-4 w-4" />
              <Label className="text-sm">{t("common.specialized")}</Label>
            </div>
            {isEditing ? (
              <Select
                value={formData.major || ""}
                onValueChange={(value) => onInputChange("major", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t("common.chooseAMajor")} />
                </SelectTrigger>
                <SelectContent>
                  {majorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {getMajorLabel(userProfile.major || "") || t("common.notUpdatedYet")}
              </p>
            )}
          </div>

          {/* CV Upload - Dedicated Modal (PDF only) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <FileText className="h-4 w-4" />
                  <Label className="text-sm">{t("common.cvResume")}</Label>
                </div>
                {userProfile.cvUrl ? (
                  <button
                    type="button"
                    onClick={handlePreviewCurrentCv}
                    className="mt-2 flex items-center gap-2 bg-transparent p-0 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                    <ExternalLink className="h-4 w-4" />
                    {t("userAccount.viewCurrentCv")}
                  </button>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">
                    {t("userAccount.noCvYet")}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("common.onlyAcceptPdfFilesMaximum10mb")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onOpenCvModal}>
                <Upload className="mr-2 h-4 w-4" />
                {userProfile.cvUrl ? t("common.updateCv") : t("common.uploadCv")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0px_6px_20px_0px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
                {t("common.changePassword")}
              </h3>
              <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
                {t("common.changeYourPasswordToSecureYourAcco")}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 font-['Inter'] text-base font-medium text-[#0047AB] hover:text-[#005B9A] dark:text-[#66B2FF] dark:hover:text-[#A5C8F2]">
            {t("common.change")}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MediaLightboxDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        items={viewerItems}
        initialIndex={0}
      />
    </div>
  );
}
