/**
 * Candidate Profile Tab
 * Displays and manages candidate profile within AccountPage
 */

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CandidateProfile,
  EducationEntry,
  ProjectDetail,
  WorkExperience,
} from "@/interfaces/schema.types";
import { queryClient } from "@/lib/queryClient";
import {
  useCandidateProfile,
  useCreateCandidateProfile,
  useUpdateCandidateProfile,
} from "@/services/candidate-profile.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// Helper to parse comma-separated string into array
function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CandidateProfileTab() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? 0;

  const { data: profileData, isLoading, error } = useCandidateProfile(userId);
  const profile = (profileData as unknown as CandidateProfile) ?? null;

  const createMutation = useCreateCandidateProfile();
  const updateMutation = useUpdateCandidateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CandidateProfile>>({});

  // Tag input states (comma-separated strings)
  const [techSkillsInput, setTechSkillsInput] = useState("");
  const [softSkillsInput, setSoftSkillsInput] = useState("");
  const [toolsInput, setToolsInput] = useState("");
  const [certsInput, setCertsInput] = useState("");
  const [achievementsInput, setAchievementsInput] = useState("");

  const hasProfile = !!profile?.id;

  const startEditing = () => {
    if (hasProfile) {
      setFormData({
        targetRole: profile.targetRole ?? "",
        targetLevel: profile.targetLevel ?? "",
        introduction: profile.introduction ?? "",
        projects: profile.projects ?? [],
        workExperiences: profile.workExperiences ?? [],
        educations: profile.educations ?? [],
      });
      setTechSkillsInput((profile.technicalSkills ?? []).join(", "));
      setSoftSkillsInput((profile.softSkills ?? []).join(", "));
      setToolsInput((profile.tools ?? []).join(", "));
      setCertsInput((profile.certifications ?? []).join(", "));
      setAchievementsInput((profile.achievements ?? []).join(", "));
    } else {
      setFormData({
        targetRole: "",
        targetLevel: "",
        introduction: "",
        projects: [],
        workExperiences: [],
        educations: [],
      });
      setTechSkillsInput("");
      setSoftSkillsInput("");
      setToolsInput("");
      setCertsInput("");
      setAchievementsInput("");
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const payload: Partial<CandidateProfile> = {
      ...formData,
      technicalSkills: parseTags(techSkillsInput),
      softSkills: parseTags(softSkillsInput),
      tools: parseTags(toolsInput),
      certifications: parseTags(certsInput),
      achievements: parseTags(achievementsInput),
    };

    try {
      if (hasProfile) {
        await updateMutation.mutateAsync({
          body: { id: profile.id, ...payload } as never,
        });
        toast.success("Cập nhật hồ sơ thành công!");
      } else {
        await createMutation.mutateAsync({ body: payload as never });
        toast.success("Tạo hồ sơ thành công!");
      }
      queryClient.invalidateQueries({ queryKey: ["get", `/api/candidate-profiles/${userId}`] });
      setIsEditing(false);
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  // Project helpers
  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects ?? []),
        { name: "", description: "", role: "", teamSize: 1, usedTools: [], outcome: "" },
      ],
    }));
  };

  const updateProject = (index: number, field: keyof ProjectDetail, value: string | number | string[]) => {
    setFormData((prev) => {
      const projects = [...(prev.projects ?? [])];
      projects[index] = { ...projects[index], [field]: value };
      return { ...prev, projects };
    });
  };

  const removeProject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).filter((_, i) => i !== index),
    }));
  };

  // Work experience helpers
  const addWorkExperience = () => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: [
        ...(prev.workExperiences ?? []),
        { company: "", position: "", description: "", start_date: "", end_date: "" },
      ],
    }));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    setFormData((prev) => {
      const workExperiences = [...(prev.workExperiences ?? [])];
      workExperiences[index] = { ...workExperiences[index], [field]: value };
      return { ...prev, workExperiences };
    });
  };

  const removeWorkExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: (prev.workExperiences ?? []).filter((_, i) => i !== index),
    }));
  };

  // Education helpers
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      educations: [
        ...(prev.educations ?? []),
        { school: "", major: "", degree: "", gpa: "", start_date: "", end_date: "" },
      ],
    }));
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setFormData((prev) => {
      const educations = [...(prev.educations ?? [])];
      educations[index] = { ...educations[index], [field]: value };
      return { ...prev, educations };
    });
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educations: (prev.educations ?? []).filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="py-8 text-center">
          <p className="text-red-500">Không thể tải hồ sơ ứng viên. Vui lòng thử lại.</p>
        </CardContent>
      </Card>
    );
  }

  // No profile and not editing
  if (!hasProfile && !isEditing) {
    return (
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold">Chưa có hồ sơ ứng viên</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Tạo hồ sơ ứng viên để nhà tuyển dụng có thể tìm thấy bạn.
          </p>
          <Button className="mt-4" onClick={startEditing}>
            Tạo hồ sơ
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {hasProfile ? "Chỉnh sửa hồ sơ ứng viên" : "Tạo hồ sơ ứng viên"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditing}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? "Đang lưu..."
                : hasProfile
                  ? "Cập nhật"
                  : "Tạo hồ sơ"}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Vai trò mục tiêu</Label>
                <Input
                  value={formData.targetRole ?? ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetRole: e.target.value }))}
                  placeholder="VD: Software Engineer"
                />
              </div>
              <div>
                <Label>Cấp độ</Label>
                <Input
                  value={formData.targetLevel ?? ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetLevel: e.target.value }))}
                  placeholder="VD: Senior, Junior, Mid"
                />
              </div>
            </div>
            <div>
              <Label>Giới thiệu</Label>
              <textarea
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                rows={3}
                value={formData.introduction ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, introduction: e.target.value }))}
                placeholder="Giới thiệu bản thân..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Kỹ năng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kỹ năng kỹ thuật (phân cách bằng dấu phẩy)</Label>
              <Input
                value={techSkillsInput}
                onChange={(e) => setTechSkillsInput(e.target.value)}
                placeholder="VD: Java, React, TypeScript"
              />
            </div>
            <div>
              <Label>Kỹ năng mềm (phân cách bằng dấu phẩy)</Label>
              <Input
                value={softSkillsInput}
                onChange={(e) => setSoftSkillsInput(e.target.value)}
                placeholder="VD: Communication, Leadership"
              />
            </div>
            <div>
              <Label>Công cụ (phân cách bằng dấu phẩy)</Label>
              <Input
                value={toolsInput}
                onChange={(e) => setToolsInput(e.target.value)}
                placeholder="VD: Git, Docker, AWS"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dự án</CardTitle>
              <Button variant="outline" size="sm" onClick={addProject}>
                Thêm dự án
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.projects ?? []).map((project, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="font-medium">Dự án {index + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeProject(index)}>
                    Xóa
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Tên dự án</Label>
                    <Input
                      value={project.name ?? ""}
                      onChange={(e) => updateProject(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Vai trò</Label>
                    <Input
                      value={project.role ?? ""}
                      onChange={(e) => updateProject(index, "role", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Input
                    value={project.description ?? ""}
                    onChange={(e) => updateProject(index, "description", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Quy mô đội</Label>
                    <Input
                      type="number"
                      value={project.teamSize ?? 1}
                      onChange={(e) => updateProject(index, "teamSize", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Kết quả</Label>
                    <Input
                      value={project.outcome ?? ""}
                      onChange={(e) => updateProject(index, "outcome", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(formData.projects ?? []).length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                Chưa có dự án nào. Nhấn &quot;Thêm dự án&quot; để thêm.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kinh nghiệm làm việc</CardTitle>
              <Button variant="outline" size="sm" onClick={addWorkExperience}>
                Thêm kinh nghiệm
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.workExperiences ?? []).map((exp, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="font-medium">Kinh nghiệm {index + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeWorkExperience(index)}>
                    Xóa
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Công ty</Label>
                    <Input
                      value={exp.company ?? ""}
                      onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Vị trí</Label>
                    <Input
                      value={exp.position ?? ""}
                      onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Input
                    value={exp.description ?? ""}
                    onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Ngày bắt đầu</Label>
                    <Input
                      type="date"
                      value={exp.start_date ?? ""}
                      onChange={(e) => updateWorkExperience(index, "start_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Ngày kết thúc</Label>
                    <Input
                      type="date"
                      value={exp.end_date ?? ""}
                      onChange={(e) => updateWorkExperience(index, "end_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(formData.workExperiences ?? []).length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                Chưa có kinh nghiệm nào. Nhấn &quot;Thêm kinh nghiệm&quot; để thêm.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Học vấn</CardTitle>
              <Button variant="outline" size="sm" onClick={addEducation}>
                Thêm học vấn
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.educations ?? []).map((edu, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="font-medium">Học vấn {index + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeEducation(index)}>
                    Xóa
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Trường</Label>
                    <Input
                      value={edu.school ?? ""}
                      onChange={(e) => updateEducation(index, "school", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Chuyên ngành</Label>
                    <Input
                      value={edu.major ?? ""}
                      onChange={(e) => updateEducation(index, "major", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <Label>Bằng cấp</Label>
                    <Input
                      value={edu.degree ?? ""}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>GPA</Label>
                    <Input
                      value={edu.gpa ?? ""}
                      onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Ngày bắt đầu</Label>
                    <Input
                      type="date"
                      value={edu.start_date ?? ""}
                      onChange={(e) => updateEducation(index, "start_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Ngày kết thúc</Label>
                    <Input
                      type="date"
                      value={edu.end_date ?? ""}
                      onChange={(e) => updateEducation(index, "end_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(formData.educations ?? []).length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                Chưa có học vấn nào. Nhấn &quot;Thêm học vấn&quot; để thêm.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Certifications & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Chứng chỉ & Thành tích</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Chứng chỉ (phân cách bằng dấu phẩy)</Label>
              <Input
                value={certsInput}
                onChange={(e) => setCertsInput(e.target.value)}
                placeholder="VD: AWS Solutions Architect, CKA"
              />
            </div>
            <div>
              <Label>Thành tích (phân cách bằng dấu phẩy)</Label>
              <Input
                value={achievementsInput}
                onChange={(e) => setAchievementsInput(e.target.value)}
                placeholder="VD: Dean's List 2021, Hackathon Winner"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hồ sơ ứng viên</h2>
        <Button onClick={startEditing}>Chỉnh sửa</Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Vai trò mục tiêu</Label>
              <p className="font-medium">{profile.targetRole || "—"}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Cấp độ</Label>
              <p className="font-medium">{profile.targetLevel || "—"}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">Giới thiệu</Label>
            <p className="mt-1">{profile.introduction || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Kỹ năng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">Kỹ năng kỹ thuật</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {(profile.technicalSkills ?? []).length > 0
                ? profile.technicalSkills!.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                : <span className="text-sm text-gray-400">—</span>}
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">Kỹ năng mềm</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {(profile.softSkills ?? []).length > 0
                ? profile.softSkills!.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))
                : <span className="text-sm text-gray-400">—</span>}
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">Công cụ</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {(profile.tools ?? []).length > 0
                ? profile.tools!.map((tool) => (
                    <Badge key={tool} variant="secondary">
                      {tool}
                    </Badge>
                  ))
                : <span className="text-sm text-gray-400">—</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Dự án</CardTitle>
        </CardHeader>
        <CardContent>
          {(profile.projects ?? []).length > 0 ? (
            <div className="space-y-4">
              {profile.projects!.map((project, index) => (
                <div key={index} className="rounded-lg border p-4 dark:border-slate-700">
                  <h4 className="font-semibold">{project.name}</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                    {project.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-slate-400">
                    {project.role && <span>Vai trò: {project.role}</span>}
                    {project.teamSize && <span>Đội: {project.teamSize} người</span>}
                    {project.outcome && <span>Kết quả: {project.outcome}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chưa có dự án nào.</p>
          )}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Kinh nghiệm làm việc</CardTitle>
        </CardHeader>
        <CardContent>
          {(profile.workExperiences ?? []).length > 0 ? (
            <div className="space-y-4">
              {profile.workExperiences!.map((exp, index) => (
                <div key={index} className="rounded-lg border p-4 dark:border-slate-700">
                  <h4 className="font-semibold">{exp.position}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-300">{exp.company}</p>
                  <p className="mt-1 text-sm">{exp.description}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {exp.start_date} — {exp.end_date || "Hiện tại"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chưa có kinh nghiệm nào.</p>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>Học vấn</CardTitle>
        </CardHeader>
        <CardContent>
          {(profile.educations ?? []).length > 0 ? (
            <div className="space-y-4">
              {profile.educations!.map((edu, index) => (
                <div key={index} className="rounded-lg border p-4 dark:border-slate-700">
                  <h4 className="font-semibold">{edu.school}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {edu.major} — {edu.degree}
                  </p>
                  {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    {edu.start_date} — {edu.end_date || "Hiện tại"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chưa có thông tin học vấn.</p>
          )}
        </CardContent>
      </Card>

      {/* Certifications & Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Chứng chỉ & Thành tích</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">Chứng chỉ</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {(profile.certifications ?? []).length > 0
                ? profile.certifications!.map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))
                : <span className="text-sm text-gray-400">—</span>}
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">Thành tích</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {(profile.achievements ?? []).length > 0
                ? profile.achievements!.map((ach) => (
                    <Badge key={ach} variant="outline">
                      {ach}
                    </Badge>
                  ))
                : <span className="text-sm text-gray-400">—</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
