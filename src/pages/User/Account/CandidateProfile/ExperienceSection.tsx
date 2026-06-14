import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CandidateProfile,
  EducationEntry,
  ProjectDetail,
  WorkExperience,
} from "@/interfaces/schema.types";
import { BookOpen, Briefcase, GraduationCap, Plus } from "lucide-react";
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
      <div className="flex flex-col gap-6">
        {/* Projects Card */}
        <div className="glass-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <Briefcase className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("common.project")}
            </h3>
          </div>
          {(profile.projects ?? []).length > 0 ? (
            <div className="space-y-3">
              {profile.projects?.map((project, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
                  <h4 className="font-semibold text-[#0b1c30] dark:text-white">{project.name}</h4>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-[#45464d] dark:text-[#8f9099]">
                    {project.description}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-[#76777d] dark:text-[#8f9099]">
                    {project.role && (
                      <p>
                        {t("general.role")} {project.role}
                      </p>
                    )}
                    {project.teamSize && (
                      <p>
                        {t("common.team")} {project.teamSize} {t("common.people")}
                      </p>
                    )}
                    {project.outcome && (
                      <p className="whitespace-pre-wrap">
                        {t("common.result1")} {project.outcome}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#45464d] dark:text-[#8f9099]">
              {t("userAccount.thereAreNoProjectsYet")}
            </p>
          )}
        </div>

        {/* Work Experience Card */}
        <div className="glass-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <BookOpen className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("common.workExperience")}
            </h3>
          </div>
          {(profile.workExperiences ?? []).length > 0 ? (
            <div className="space-y-3">
              {profile.workExperiences?.map((exp, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
                  <h4 className="font-semibold text-[#0b1c30] dark:text-white">{exp.position}</h4>
                  <p className="text-sm text-[#45464d] dark:text-[#8f9099]">{exp.company}</p>
                  <p className="mt-2 text-sm text-[#0b1c30] dark:text-white">{exp.description}</p>
                  <p className="mt-2 text-xs text-[#76777d] dark:text-[#8f9099]">
                    {exp.start_date} — {exp.end_date || t("common.present")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#45464d] dark:text-[#8f9099]">
              {t("userAccount.noExperienceYet")}
            </p>
          )}
        </div>

        {/* Education Card */}
        <div className="glass-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <GraduationCap className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("common.education")}
            </h3>
          </div>
          {(profile.educations ?? []).length > 0 ? (
            <div className="space-y-3">
              {profile.educations?.map((edu, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
                  <h4 className="font-semibold text-[#0b1c30] dark:text-white">{edu.school}</h4>
                  <p className="text-sm text-[#45464d] dark:text-[#8f9099]">
                    {edu.major} — {edu.degree}
                  </p>
                  {edu.gpa && (
                    <p className="mt-1 text-sm text-[#0b1c30] dark:text-white">
                      {t("common.gpa")}: {edu.gpa}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[#76777d] dark:text-[#8f9099]">
                    {edu.start_date} — {edu.end_date || t("common.present")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#45464d] dark:text-[#8f9099]">
              {t("userAccount.noEducationInformationAvailable")}
            </p>
          )}
        </div>
      </div>
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
    <div className="flex flex-col gap-6">
      {/* Projects Card */}
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <Briefcase className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("common.project")}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addProject}
            className="border-[#0058be] text-[#0058be] hover:bg-[#dae2fd] dark:border-[#66B2FF] dark:text-[#66B2FF] dark:hover:bg-[#0058be]/20">
            <Plus className="mr-1 h-4 w-4" />
            {t("common.addProject")}
          </Button>
        </div>
        <div className="space-y-4">
          {(formData.projects ?? []).map((project, index) => (
            <div
              key={index}
              className="rounded-xl border border-[rgba(15,23,42,0.1)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
                  {t("common.project")} {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProject(index)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
                  {t("general.delete")}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.projectName")}
                  </Label>
                  <Input
                    value={project.name ?? ""}
                    onChange={(e) => updateProject(index, "name", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.role")}
                  </Label>
                  <Input
                    value={project.role ?? ""}
                    onChange={(e) => updateProject(index, "role", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                  {t("common.describe")}
                </Label>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-xl border border-[#c6c6cd] bg-white p-3 text-sm transition-colors focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 focus:outline-none dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white dark:focus:border-[#66B2FF] dark:focus:ring-[#66B2FF]/20"
                  value={project.description ?? ""}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  rows={4}
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("userAccount.teamSize")}
                  </Label>
                  <Input
                    type="number"
                    value={project.teamSize ?? 1}
                    onChange={(e) => updateProject(index, "teamSize", Number(e.target.value))}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.result")}
                  </Label>
                  <textarea
                    className="mt-1 min-h-24 w-full rounded-xl border border-[#c6c6cd] bg-white p-3 text-sm transition-colors focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 focus:outline-none dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white dark:focus:border-[#66B2FF] dark:focus:ring-[#66B2FF]/20"
                    value={project.outcome ?? ""}
                    onChange={(e) => updateProject(index, "outcome", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ))}
          {(formData.projects ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-[#45464d] dark:text-[#8f9099]">
              {t("userAccount.thereAreNoProjectsYet1")}
            </p>
          )}
        </div>
      </div>

      {/* Work Experience Card */}
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <BookOpen className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("common.workExperience")}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addWorkExperience}
            className="border-[#0058be] text-[#0058be] hover:bg-[#dae2fd] dark:border-[#66B2FF] dark:text-[#66B2FF] dark:hover:bg-[#0058be]/20">
            <Plus className="mr-1 h-4 w-4" />
            {t("common.moreExperience")}
          </Button>
        </div>
        <div className="space-y-4">
          {(formData.workExperiences ?? []).map((exp, index) => (
            <div
              key={index}
              className="rounded-xl border border-[rgba(15,23,42,0.1)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
                  {t("common.experience")} {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkExperience(index)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
                  {t("general.delete")}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.company")}
                  </Label>
                  <Input
                    value={exp.company ?? ""}
                    onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.location1")}
                  </Label>
                  <Input
                    value={exp.position ?? ""}
                    onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                  {t("common.describe")}
                </Label>
                <Input
                  value={exp.description ?? ""}
                  onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                  className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.startDate")}
                  </Label>
                  <Input
                    type="date"
                    value={exp.start_date ?? ""}
                    onChange={(e) => updateWorkExperience(index, "start_date", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.endDate")}
                  </Label>
                  <Input
                    type="date"
                    value={exp.end_date ?? ""}
                    onChange={(e) => updateWorkExperience(index, "end_date", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
          {(formData.workExperiences ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-[#45464d] dark:text-[#8f9099]">
              {t("userAccount.noExperienceYetClickQuot")}
            </p>
          )}
        </div>
      </div>

      {/* Education Card */}
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <GraduationCap className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("common.education")}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addEducation}
            className="border-[#0058be] text-[#0058be] hover:bg-[#dae2fd] dark:border-[#66B2FF] dark:text-[#66B2FF] dark:hover:bg-[#0058be]/20">
            <Plus className="mr-1 h-4 w-4" />
            {t("common.moreEducation")}
          </Button>
        </div>
        <div className="space-y-4">
          {(formData.educations ?? []).map((edu, index) => (
            <div
              key={index}
              className="rounded-xl border border-[rgba(15,23,42,0.1)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
                  {t("common.education")} {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
                  {t("general.delete")}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.school")}
                  </Label>
                  <Input
                    value={edu.school ?? ""}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.specialized")}
                  </Label>
                  <Input
                    value={edu.major ?? ""}
                    onChange={(e) => updateEducation(index, "major", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.degree")}
                  </Label>
                  <Input
                    value={edu.degree ?? ""}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.gpa")}
                  </Label>
                  <Input
                    value={edu.gpa ?? ""}
                    onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.startDate")}
                  </Label>
                  <Input
                    type="date"
                    value={edu.start_date ?? ""}
                    onChange={(e) => updateEducation(index, "start_date", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-[#45464d] dark:text-[#8f9099]">
                    {t("common.endDate")}
                  </Label>
                  <Input
                    type="date"
                    value={edu.end_date ?? ""}
                    onChange={(e) => updateEducation(index, "end_date", e.target.value)}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
          {(formData.educations ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-[#45464d] dark:text-[#8f9099]">
              {t("userAccount.noEducationYetClickQuot")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
