import { CVUploadModal } from "@/components/ui/cv-upload-modal";
import { SpinnerBlock } from "@/components/ui/spinner";
import { normalizeMajor } from "@/constants/majors";
import { formatDate } from "@/lib/formatting";
import { usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { FileText, User } from "lucide-react";
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
  const { user: authUser, setUser } = useAuthStore();
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
          university: formData.university,
          major: normalizeMajor(formData.major),
          ...(userProfile.public_id ? { public_id: userProfile.public_id } : {}),
          ...(userProfile.cv_public_id ? { cv_public_id: userProfile.cv_public_id } : {}),
        },
        avatarFile || undefined,
        undefined
      );
      if (response.success) {
        await fetchUserData();
        if (response.data) {
          setUser({ ...authUser, ...response.data });
        }
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

  const summaryAvatar = avatarPreview || userProfile?.avatar || authUser?.avatarUrl || null;
  const summaryName = userProfile?.name || authUser?.name || t("common.account");
  const summaryEmail = userProfile?.email || authUser?.email || "—";
  const summaryJoinedAt = userProfile?.createdAt ? formatDate(userProfile.createdAt) : "—";

  return (
    <div className="px-2 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0px_6px_20px_0px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#DCEEFF] dark:bg-[#0047AB]/30">
                    {summaryAvatar ? (
                      <img
                        src={summaryAvatar}
                        alt={summaryName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="font-['Inter'] text-xl font-semibold text-slate-900 dark:text-white">
                    {summaryName}
                  </h2>
                  <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
                    {summaryEmail}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {t("userAccount.joinDate")} {summaryJoinedAt}
                  </p>
                </div>
              </div>
              <div className="my-4 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0px_6px_20px_0px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                {t("common.category")}
              </p>
              <div className="mt-3 flex flex-col gap-1">
                {tabItems.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSwitchTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                        isActive
                          ? "border-[#0047AB]/40 bg-[#DCEEFF]/60 text-[#0047AB] shadow-sm dark:border-[#66B2FF]/40 dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
                          : "border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-white text-[#0047AB] dark:bg-slate-900 dark:text-[#66B2FF]"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                        <TabIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-tight font-semibold">{tab.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
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
