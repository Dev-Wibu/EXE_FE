import { Award } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SpinnerBlock } from "@/components/ui/spinner";
import { mentorManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

import type { MentorProfileData } from "./MentorAccountTabs";
import {
  MentorDocumentsSection,
  MentorPasswordSection,
  MentorProfileSection,
} from "./MentorAccountTabs";

export function MentorAccountPage() {
  const { user: authUser, setUser } = useAuthStore();
  const [mentorProfile, setMentorProfile] = useState<MentorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<MentorProfileData>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchMentorData = useCallback(async () => {
    if (!authUser?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await mentorManager.getById(authUser.id);
      if (response.success && response.data) {
        const mentorData = response.data;
        setMentorProfile({
          id: String(mentorData.id || authUser.id),
          name: mentorData.name || authUser.name || "",
          email: mentorData.email || authUser.email || "",
          avatar: mentorData.avatarUrl || null,
          public_id: mentorData.public_id || null,
          bio: mentorData.bio || "",
          expertise: mentorData.expertise || "",
          yearsOfExperience: mentorData.yearsOfExperience || 0,
          linkedInUrl: mentorData.linkedInUrl || "",
          currentCompany: mentorData.currentCompany || "",
          pricePerMinute: mentorData.pricePerMinute || 0,
          averageRating: mentorData.averageRating ?? 0,
          identityImg: mentorData.identityImg || null,
          public_id_identity: mentorData.public_id_identity || null,
          degreeImg: mentorData.degreeImg || null,
          public_id_degree: mentorData.public_id_degree || null,
          otherFile: mentorData.otherFile || null,
          public_id_other: mentorData.public_id_other || null,
          totalSession: mentorData.totalSession || 0,
          active: mentorData.active !== false,
          createdAt: new Date().toISOString(),
        });
      } else {
        setMentorProfile({
          id: String(authUser.id),
          name: authUser.name || "",
          email: authUser.email || "",
          avatar: authUser.avatarUrl || null,
          public_id: authUser.public_id || null,
          bio: "",
          expertise: "",
          yearsOfExperience: 0,
          linkedInUrl: "",
          currentCompany: "",
          pricePerMinute: 0,
          averageRating: 0,
          totalSession: 0,
          active: true,
          createdAt: new Date().toISOString(),
        });
        console.warn("Failed to fetch mentor data, using auth store data");
      }
    } catch (error) {
      console.error("Error fetching mentor data:", error);
      if (authUser) {
        setMentorProfile({
          id: String(authUser.id),
          name: authUser.name || "",
          email: authUser.email || "",
          avatar: authUser.avatarUrl || null,
          public_id: authUser.public_id || null,
          bio: "",
          expertise: "",
          yearsOfExperience: 0,
          linkedInUrl: "",
          currentCompany: "",
          pricePerMinute: 0,
          averageRating: 0,
          totalSession: 0,
          active: true,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchMentorData();
  }, [fetchMentorData]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleRefreshData = async () => {
    await fetchMentorData();
    toast.success("Đã cập nhật dữ liệu!");
  };

  const handleStartEdit = () => {
    if (!mentorProfile) return;
    setFormData({
      name: mentorProfile.name,
      bio: mentorProfile.bio,
      expertise: mentorProfile.expertise,
      yearsOfExperience: mentorProfile.yearsOfExperience,
      linkedInUrl: mentorProfile.linkedInUrl,
      currentCompany: mentorProfile.currentCompany,
      pricePerMinute: mentorProfile.pricePerMinute,
      averageRating: mentorProfile.averageRating,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({});
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
    }
  };

  const handleClearAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
  };

  const handleSaveProfile = async () => {
    if (!mentorProfile?.id) {
      toast.error("Không tìm thấy ID mentor");
      return;
    }

    setIsSaving(true);
    try {
      const response = await mentorManager.update(mentorProfile.id, {
        name: formData.name,
        bio: formData.bio,
        expertise: formData.expertise,
        yearsOfExperience: formData.yearsOfExperience,
        linkedInUrl: formData.linkedInUrl,
        currentCompany: formData.currentCompany,
        pricePerMinute: formData.pricePerMinute,
        ...(mentorProfile.public_id ? { public_id: mentorProfile.public_id } : {}),
      });

      if (response.success) {
        await fetchMentorData();

        if (response.data) {
          setUser({
            ...authUser,
            ...response.data,
          });
        }

        toast.success("Cập nhật thông tin thành công!");
        setIsEditing(false);
        setFormData({});
        setAvatarPreview(null);
      } else {
        toast.error(response.error || "Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof MentorProfileData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <SpinnerBlock size="lg" />
      </div>
    );
  }

  if (!mentorProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-['Inter'] text-base text-gray-500 dark:text-slate-400">
          Không tìm thấy thông tin mentor
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Banner */}
      <div className="flex h-56 items-center justify-between rounded-[30px] bg-linear-to-r from-emerald-100 to-teal-100 px-10 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="flex flex-col gap-4">
          <h1 className="font-['Open_Sans'] text-3xl leading-tight font-bold text-emerald-800 dark:text-emerald-400">
            Tài khoản Mentor
          </h1>
          <p className="font-['Open_Sans'] text-base font-normal text-gray-700 dark:text-slate-300">
            Quản lý thông tin cá nhân và hồ sơ mentor của bạn
          </p>
        </div>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50">
          <Award className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <MentorProfileSection
          mentorProfile={mentorProfile}
          isEditing={isEditing}
          isSaving={isSaving}
          formData={formData}
          avatarPreview={avatarPreview}
          onRefreshData={handleRefreshData}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSaveProfile={handleSaveProfile}
          onAvatarChange={handleAvatarChange}
          onClearAvatar={handleClearAvatar}
          onInputChange={handleInputChange}
        />

        <div className="flex flex-col gap-6">
          <MentorDocumentsSection mentorProfile={mentorProfile} />

          <MentorPasswordSection />
        </div>
      </div>
    </div>
  );
}
