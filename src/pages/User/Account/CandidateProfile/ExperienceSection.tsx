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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  if (props.mode === "view") {
    const { profile } = props;
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>{t("common.project")}</CardTitle>
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
                        <p className="break-words whitespace-pre-wrap">
                          {t("general.role")} {project.role}
                        </p>
                      )}
                      {project.teamSize && (
                        <p>
                          {t("common.team")} {project.teamSize} {t("common.people")}
                        </p>
                      )}
                      {project.outcome && (
                        <p className="break-words whitespace-pre-wrap">
                          {t("common.result1")} {project.outcome}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("userAccount.thereAreNoProjectsYet")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("common.workExperience")}</CardTitle>
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
                      {exp.start_date} — {exp.end_date || t("common.present")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("userAccount.noExperienceYet")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("common.education")}</CardTitle>
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
                    {edu.gpa && (
                      <p className="text-sm">
                        {t("common.gpa")}: {edu.gpa}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {edu.start_date} — {edu.end_date || t("common.present")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {t("userAccount.noEducationInformationAvailable")}
              </p>
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
            <CardTitle>{t("common.project")}</CardTitle>
            <Button variant="outline" size="sm" onClick={addProject}>
              {t("common.addProject")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.projects ?? []).map((project, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("common.project")} {index + 1}
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeProject(index)}>
                  {t("general.delete")}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("common.projectName")}</Label>
                  <Input
                    value={project.name ?? ""}
                    onChange={(e) => updateProject(index, "name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("common.role")}</Label>
                  <Input
                    value={project.role ?? ""}
                    onChange={(e) => updateProject(index, "role", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>{t("common.describe")}</Label>
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={project.description ?? ""}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("userAccount.teamSize")}</Label>
                  <Input
                    type="number"
                    value={project.teamSize ?? 1}
                    onChange={(e) => updateProject(index, "teamSize", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>{t("common.result")}</Label>
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
              {t("userAccount.thereAreNoProjectsYet1")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("common.workExperience")}</CardTitle>
            <Button variant="outline" size="sm" onClick={addWorkExperience}>
              {t("common.moreExperience")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.workExperiences ?? []).map((exp, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("common.experience")} {index + 1}
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeWorkExperience(index)}>
                  {t("general.delete")}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("common.company")}</Label>
                  <Input
                    value={exp.company ?? ""}
                    onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("common.location1")}</Label>
                  <Input
                    value={exp.position ?? ""}
                    onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>{t("common.describe")}</Label>
                <Input
                  value={exp.description ?? ""}
                  onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("common.startDate")}</Label>
                  <Input
                    type="date"
                    value={exp.start_date ?? ""}
                    onChange={(e) => updateWorkExperience(index, "start_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("common.endDate")}</Label>
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
              {t("userAccount.noExperienceYetClickQuot")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("common.education")}</CardTitle>
            <Button variant="outline" size="sm" onClick={addEducation}>
              {t("common.moreEducation")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.educations ?? []).map((edu, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("common.education")} {index + 1}
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeEducation(index)}>
                  {t("general.delete")}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("common.school")}</Label>
                  <Input
                    value={edu.school ?? ""}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("common.specialized")}</Label>
                  <Input
                    value={edu.major ?? ""}
                    onChange={(e) => updateEducation(index, "major", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Label>{t("common.degree")}</Label>
                  <Input
                    value={edu.degree ?? ""}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("common.gpa")}</Label>
                  <Input
                    value={edu.gpa ?? ""}
                    onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("common.startDate")}</Label>
                  <Input
                    type="date"
                    value={edu.start_date ?? ""}
                    onChange={(e) => updateEducation(index, "start_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("common.endDate")}</Label>
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
              {t("userAccount.noEducationYetClickQuot")}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
