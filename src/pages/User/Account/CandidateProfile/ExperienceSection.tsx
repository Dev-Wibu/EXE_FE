import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CandidateProfile,
  EducationEntry,
  ProjectDetail,
  WorkExperience,
} from "@/interfaces/schema.types";

interface ExperienceEditProps {
  mode: "edit";
  formData: Partial<CandidateProfile>;
  addProject: () => void;
  updateProject: (
    index: number,
    field: keyof ProjectDetail,
    value: string | number | string[]
  ) => void;
  removeProject: (index: number) => void;
  addWorkExperience: () => void;
  updateWorkExperience: (index: number, field: keyof WorkExperience, value: string) => void;
  removeWorkExperience: (index: number) => void;
  addEducation: () => void;
  updateEducation: (index: number, field: keyof EducationEntry, value: string) => void;
  removeEducation: (index: number) => void;
}

interface ExperienceViewProps {
  mode: "view";
  profile: CandidateProfile;
}

type ExperienceSectionProps = ExperienceEditProps | ExperienceViewProps;

export function ExperienceSection(props: ExperienceSectionProps) {
  if (props.mode === "view") {
    const { profile } = props;
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Dự án</CardTitle>
          </CardHeader>
          <CardContent>
            {(profile.projects ?? []).length > 0 ? (
              <div className="space-y-4">
                {profile.projects!.map((project, index) => (
                  <div key={index} className="rounded-lg border p-4 dark:border-slate-700">
                    <h4 className="font-semibold break-words">{project.name}</h4>
                    <p className="mt-1 text-sm break-words whitespace-pre-wrap text-gray-600 dark:text-slate-300">
                      {project.description}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-slate-400">
                      {project.role && (
                        <p className="break-words whitespace-pre-wrap">Vai trò: {project.role}</p>
                      )}
                      {project.teamSize && <p>Đội: {project.teamSize} người</p>}
                      {project.outcome && (
                        <p className="break-words whitespace-pre-wrap">
                          Kết quả: {project.outcome}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Chưa có dự án nào.</p>
            )}
          </CardContent>
        </Card>

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
      </>
    );
  }

  const {
    formData,
    addProject,
    updateProject,
    removeProject,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
  } = props;

  return (
    <>
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
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={project.description ?? ""}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  rows={5}
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
                  <textarea
                    className="mt-1 min-h-28 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    value={project.outcome ?? ""}
                    onChange={(e) => updateProject(index, "outcome", e.target.value)}
                    rows={5}
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
    </>
  );
}
