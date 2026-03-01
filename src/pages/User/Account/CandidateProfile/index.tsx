/**
 * Candidate Profile Tab
 * Displays and manages candidate profile within AccountPage
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { BasicInfoSection } from "./BasicInfoSection";
import { ExperienceSection } from "./ExperienceSection";
import { SkillsSection } from "./SkillsSection";
import { useCandidateProfileForm } from "./useCandidateProfileForm";

export function CandidateProfileTab() {
  const form = useCandidateProfileForm();

  if (form.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (form.error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="py-8 text-center">
          <p className="text-red-500">Không thể tải hồ sơ ứng viên. Vui lòng thử lại.</p>
        </CardContent>
      </Card>
    );
  }

  if (!form.hasProfile && !form.isEditing) {
    return (
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold">Chưa có hồ sơ ứng viên</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Tạo hồ sơ ứng viên để nhà tuyển dụng có thể tìm thấy bạn.
          </p>
          <Button className="mt-4" onClick={form.startEditing}>
            Tạo hồ sơ
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (form.isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {form.hasProfile ? "Chỉnh sửa hồ sơ ứng viên" : "Tạo hồ sơ ứng viên"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={form.cancelEditing}>
              Hủy
            </Button>
            <Button
              onClick={form.handleSave}
              disabled={form.createMutation.isPending || form.updateMutation.isPending}>
              {form.createMutation.isPending || form.updateMutation.isPending
                ? "Đang lưu..."
                : form.hasProfile
                  ? "Cập nhật"
                  : "Tạo hồ sơ"}
            </Button>
          </div>
        </div>

        <BasicInfoSection mode="edit" formData={form.formData} setFormData={form.setFormData} />

        <SkillsSection
          mode="edit"
          activeSkillTab={form.activeSkillTab}
          setActiveSkillTab={form.setActiveSkillTab}
          newSkillValue={form.newSkillValue}
          setNewSkillValue={form.setNewSkillValue}
          techSkillsInput={form.techSkillsInput}
          softSkillsInput={form.softSkillsInput}
          toolsInput={form.toolsInput}
          certificationsInput={form.certificationsInput}
          achievementsInput={form.achievementsInput}
          getSkillList={form.getSkillList}
          addSkillBadge={form.addSkillBadge}
          removeSkillBadge={form.removeSkillBadge}
          addListItem={form.addListItem}
          updateListItem={form.updateListItem}
          removeListItem={form.removeListItem}
        />

        <ExperienceSection
          mode="edit"
          formData={form.formData}
          addProject={form.addProject}
          updateProject={form.updateProject}
          removeProject={form.removeProject}
          addWorkExperience={form.addWorkExperience}
          updateWorkExperience={form.updateWorkExperience}
          removeWorkExperience={form.removeWorkExperience}
          addEducation={form.addEducation}
          updateEducation={form.updateEducation}
          removeEducation={form.removeEducation}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hồ sơ ứng viên</h2>
        <Button onClick={form.startEditing}>Chỉnh sửa</Button>
      </div>

      <BasicInfoSection mode="view" profile={form.profile!} />
      <SkillsSection mode="view" profile={form.profile!} />
      <ExperienceSection mode="view" profile={form.profile!} />
    </div>
  );
}
