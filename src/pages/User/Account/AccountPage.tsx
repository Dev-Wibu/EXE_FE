import { CVUploadModal } from "@/components/ui/cv-upload-modal";
import { SpinnerBlock } from "@/components/ui/spinner";
import { normalizeMajor, useMajorOptions } from "@/constants/majors";
import type { User as UserType } from "@/interfaces/schema.types";
import { formatDate } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { userManager, usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Edit,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  Share2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ProfileTab } from "./AccountTabs";
import type { UserProfileData } from "./AccountTabs/types";
import { CandidateProfileTab } from "./CandidateProfile";

type AccountSubTab = "profile" | "candidateProfile";

const parseAccountSubTab = (value?: string | null): AccountSubTab | null => {
  if (value === "profile" || value === "candidateProfile") {
    return value as AccountSubTab;
  }
  return null;
};

export function AccountPage() {
  const { t } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const authUserId = authUser?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountSubTab>(
    parseAccountSubTab(searchParams.get("subtab")) || "profile"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<UserProfileData>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [isCvUploading, setIsCvUploading] = useState(false);
  const hasLoadedUserDataRef = useRef(false);

  const fetchUserData = useCallback(async () => {
    const currentAuthUser = useAuthStore.getState().user;
    if (!authUserId || !currentAuthUser) {
      setIsLoading(false);
      return;
    }
    if (!hasLoadedUserDataRef.current) {
      setIsLoading(true);
    }
    try {
      const response = await usersAdminManager.getById(authUserId);
      if (response.success && response.data) {
        const userData = response.data;
        setUserProfile({
          id: String(userData.id || authUserId),
          name: userData.name || currentAuthUser.name || "",
          email: userData.email || currentAuthUser.email || "",
          avatar: userData.avatarUrl || null,
          public_id: userData.public_id || null,
          // @ts-expect-error: Backend Swagger schema mismatch - university not in User type
          university: userData.university || "",
          major: userData.major || "",
          cvUrl: userData.cvUrl || null,
          cv_public_id: userData.cv_public_id || null,
          createdAt: new Date().toISOString(),
        });
      } else {
        setUserProfile({
          id: String(authUserId),
          name: currentAuthUser.name || "",
          email: currentAuthUser.email || "",
          avatar: currentAuthUser.avatarUrl || null,
          public_id: currentAuthUser.public_id || null,
          university: "",
          major: "",
          cvUrl: null,
          cv_public_id: null,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (currentAuthUser) {
        setUserProfile({
          id: String(currentAuthUser.id),
          name: currentAuthUser.name || "",
          email: currentAuthUser.email || "",
          avatar: currentAuthUser.avatarUrl || null,
          public_id: currentAuthUser.public_id || null,
          university: "",
          major: "",
          cvUrl: null,
          cv_public_id: null,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
      hasLoadedUserDataRef.current = true;
    }
  }, [authUserId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const nextTab = parseAccountSubTab(searchParams.get("subtab")) || "profile";
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [searchParams]);

  const handleSwitchTab = useCallback(
    (nextTab: AccountSubTab) => {
      setActiveTab(nextTab);
      const nextParams = new URLSearchParams(searchParams);
      if (nextTab === "profile") {
        nextParams.delete("subtab");
      } else {
        nextParams.set("subtab", nextTab);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleRefreshData = async () => {
    await fetchUserData();
    toast.success(t("common.dataUpdated"));
  };

  const handleStartEdit = () => {
    if (!userProfile) return;
    setFormData({
      name: userProfile.name,
      university: userProfile.university,
      major: userProfile.major,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarFile(file);
    }
  };

  const handleClearAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleCvUpload = async (file: File) => {
    if (!userProfile?.id) {
      toast.error(t("userAccount.userIdNotFound"));
      return;
    }
    setIsCvUploading(true);
    try {
      const response = await usersAdminManager.uploadCv(userProfile.id, file);
      if (response.success) {
        await fetchUserData();
        toast.success(t("common.uploadCvSuccessfully"));
      } else {
        toast.error(response.error || t("common.uploadCvFailed"));
        throw new Error(response.error);
      }
    } catch {
      throw new Error(t("common.uploadCvFailed"));
    } finally {
      setIsCvUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id) {
      toast.error(t("userAccount.userIdNotFound"));
      return;
    }
    setIsSaving(true);
    try {
      const response = await usersAdminManager.update(
        userProfile.id,
        {
          name: formData.name,
          // @ts-expect-error: Backend Swagger schema mismatch - university not in User type
          university: formData.university,
          major: normalizeMajor(formData.major),
          ...(userProfile.public_id ? { public_id: userProfile.public_id } : {}),
          ...(userProfile.cv_public_id ? { cv_public_id: userProfile.cv_public_id } : {}),
        },
        avatarFile || undefined,
        undefined
      );
      if (response.success) {
        // Fetch fresh user profile from /api/users/me to get updated avatar
        const profileResponse = await userManager.getProfile();
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data as UserType);
        }
        await fetchUserData();
        toast.success(t("common.updatedInformationSuccessfully"));
        setIsEditing(false);
        setFormData({});
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        toast.error(response.error || t("common.updateFailedPleaseTryAgain"));
      }
    } catch {
      toast.error(t("common.updateFailedPleaseTryAgain"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return userProfile ? (
          <ProfileTab
            userProfile={userProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            avatarPreview={avatarPreview}
            onRefreshData={handleRefreshData}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveProfile={handleSaveProfile}
            onInputChange={handleInputChange}
            onAvatarChange={handleAvatarChange}
            onClearAvatar={handleClearAvatar}
            onOpenCvModal={() => setIsCvModalOpen(true)}
          />
        ) : null;
      case "candidateProfile":
        return <CandidateProfileTab />;
      default:
        return userProfile ? (
          <ProfileTab
            userProfile={userProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            avatarPreview={avatarPreview}
            onRefreshData={handleRefreshData}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveProfile={handleSaveProfile}
            onInputChange={handleInputChange}
            onAvatarChange={handleAvatarChange}
            onClearAvatar={handleClearAvatar}
            onOpenCvModal={() => setIsCvModalOpen(true)}
          />
        ) : null;
    }
  };

  const summaryAvatar = avatarPreview || userProfile?.avatar || authUser?.avatarUrl || null;
  const summaryName = userProfile?.name || authUser?.name || t("common.account");
  const summaryEmail = userProfile?.email || authUser?.email || "—";
  const summaryJoinedAt = userProfile?.createdAt ? formatDate(userProfile.createdAt) : "—";
  // @ts-expect-error: Backend Swagger schema mismatch - university/major not in User type
  const summaryUniversity = userProfile?.university || authUser?.university || "";
  const summaryMajor = userProfile?.major || authUser?.major || "";

  const majorOptions = useMajorOptions();
  const getMajorLabel = (value: string): string => {
    const major = majorOptions.find((option) => option.value === value);
    return major?.label || "";
  };

  const tabItems: Array<{
    id: AccountSubTab;
    label: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      id: "profile",
      label: t("common.personalInformation"),
      description: t("userAccount.updateYourProfileEducationAnd"),
      icon: User,
    },
    {
      id: "candidateProfile",
      label: t("common.candidateProfile"),
      description: t("userAccount.managePersonalRecruitmentRecords"),
      icon: FileText,
    },
  ];

  const summaryMajorLabel = getMajorLabel(summaryMajor);

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b1c30]">
      <div className="mx-auto max-w-[1280px] px-4 pt-6 pb-12 lg:px-6">
        {/* Hero Header - Glass Card */}
        <div className="glass-card relative mb-6 overflow-hidden rounded-xl p-6">
          {/* Decorative blur circle */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#0058be]/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-white shadow-xl md:h-40 md:w-40">
                {summaryAvatar ? (
                  <img
                    src={summaryAvatar}
                    alt={summaryName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#e5eeff] dark:bg-[#1a2a3a]">
                    <User className="h-12 w-12 text-[#0058be] dark:text-[#66B2FF]" />
                  </div>
                )}
              </div>
              {/* Online badge */}
              <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-400 shadow-sm md:right-0 md:bottom-0 dark:border-[#1a2a3a]">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-[#0b1c30] md:text-3xl dark:text-white">
                {summaryName}
              </h1>
              {summaryUniversity && (
                <p className="mt-1 text-base font-medium text-[#0058be] dark:text-[#66B2FF]">
                  {summaryUniversity}
                  {summaryMajorLabel && ` • ${summaryMajorLabel}`}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-[#45464d] md:justify-start dark:text-[#8f9099]">
                {summaryEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {summaryEmail}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("userAccount.joinDate")} {summaryJoinedAt}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-3">
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 rounded-lg bg-[#0058be] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#0047a8]">
                <Edit className="h-4 w-4" />
                {t("general.edit")}
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c6c6cd] text-[#45464d] transition-colors hover:bg-[#eff4ff] dark:border-[#3a4558] dark:text-[#8f9099] dark:hover:bg-[#1a2a3a]">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar + Content */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <aside className="flex flex-col gap-6 lg:col-span-4">
            {/* Personal Info Card */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="mb-4 text-base font-semibold text-[#0b1c30] dark:text-white">
                {t("userAccount.personalInfo")}
              </h3>
              <div className="space-y-4">
                {/* University */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] dark:bg-[#1a2a3a]">
                    <GraduationCap className="h-4 w-4 text-[#0058be] dark:text-[#66B2FF]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                      {t("common.university")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[#0b1c30] dark:text-white">
                      {summaryUniversity || t("common.notUpdatedYet")}
                    </p>
                  </div>
                </div>

                {/* Major */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] dark:bg-[#1a2a3a]">
                    <BookOpen className="h-4 w-4 text-[#0058be] dark:text-[#66B2FF]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                      {t("common.specialized")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[#0b1c30] dark:text-white">
                      {summaryMajorLabel || t("common.notUpdatedYet")}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] dark:bg-[#1a2a3a]">
                    <Mail className="h-4 w-4 text-[#0058be] dark:text-[#66B2FF]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                      {t("common.email")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[#0b1c30] dark:text-white">
                      {summaryEmail}
                    </p>
                  </div>
                </div>

                {/* Joined */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] dark:bg-[#1a2a3a]">
                    <Calendar className="h-4 w-4 text-[#0058be] dark:text-[#66B2FF]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                      {t("userAccount.memberSince")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[#0b1c30] dark:text-white">
                      {summaryJoinedAt}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Links Card */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="mb-4 text-base font-semibold text-[#0b1c30] dark:text-white">
                {t("userAccount.quickSettings")}
              </h3>
              <ul className="space-y-1">
                {tabItems.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => handleSwitchTab(tab.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors",
                          isActive
                            ? "bg-[#dae2fd] dark:bg-[#0058be]/30"
                            : "hover:bg-[#eff4ff] dark:hover:bg-[#1a2a3a]"
                        )}>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              isActive
                                ? "bg-[#0058be] text-white"
                                : "bg-[#e5eeff] text-[#0058be] dark:bg-[#1a2a3a] dark:text-[#66B2FF]"
                            )}>
                            <TabIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0b1c30] dark:text-white">
                              {tab.label}
                            </p>
                            <p className="text-xs text-[#45464d] dark:text-[#8f9099]">
                              {tab.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-[#0058be]" : "text-[#76777d]"
                          )}
                        />
                      </button>
                    </li>
                  );
                })}

                {/* Change Password */}
                <li>
                  <button className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-[#eff4ff] dark:hover:bg-[#1a2a3a]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0b1c30] dark:text-white">
                          {t("common.changePassword")}
                        </p>
                        <p className="text-xs text-[#45464d] dark:text-[#8f9099]">
                          {t("common.updateYourSecuritySettings")}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#76777d]" />
                  </button>
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="glass-card flex items-center justify-center rounded-xl p-12">
                <SpinnerBlock size="lg" />
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>

      <CVUploadModal
        isOpen={isCvModalOpen}
        onOpenChange={setIsCvModalOpen}
        currentCvUrl={userProfile?.cvUrl}
        onUpload={handleCvUpload}
        isUploading={isCvUploading}
        title={t("common.uploadCv")}
        description={t("userAccount.uploadYourCvSoThe")}
      />
    </div>
  );
}
