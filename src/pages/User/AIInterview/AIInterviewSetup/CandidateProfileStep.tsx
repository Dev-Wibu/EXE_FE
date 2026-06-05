import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Pencil,
  Plus,
  Save,
  Upload,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AIInterviewSetupHook } from "./useAIInterviewSetup";
export function CandidateProfileStep({ hook }: { hook: AIInterviewSetupHook }) {
  const { t } = useTranslation();
  const {
    isEditingProfile,
    setIsEditingProfile,
    isSavingProfile,
    candidateForm,
    updateCandidateForm,
    techSkillInput,
    setTechSkillInput,
    addTechSkill,
    removeTechSkill,
    softSkillInput,
    setSoftSkillInput,
    addSoftSkill,
    removeSoftSkill,
    toolInput,
    setToolInput,
    addTool,
    removeTool,
    certificationInput,
    setCertificationInput,
    addCertification,
    removeCertification,
    achievementInput,
    setAchievementInput,
    addAchievement,
    removeAchievement,
    addProject,
    updateProject,
    removeProject,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
    isUploading,
    fileInputRef,
    handleUploadCV,
    handleStartEditing,
    handleCancelEditing,
    handleSaveProfile,
    existingProfile,
    profileLoading,
    hasExistingProfile,
  } = hook;
  const profile = existingProfile as Record<string, unknown> | undefined;
  const canSave =
    candidateForm.targetRole.trim() !== "" && candidateForm.introduction.trim() !== "";
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">{t("common.candidateProfile")}</CardTitle>
        </div>
        <CardDescription>
          {hasExistingProfile && !isEditingProfile
            ? t("userAiinterview.yourProfileIsReadyYou")
            : isEditingProfile
              ? t("userAiinterview.fillInProfileInformationThen")
              : t("userAiinterview.uploadYourCvToAuto")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void handleUploadCV(file);
              e.target.value = "";
            }
          }}
        />

        {/* ── Loading skeleton ── */}
        {profileLoading && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {/* ── Has profile + view mode ── */}
        {!profileLoading && hasExistingProfile && !isEditingProfile && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  {t("userAiinterview.currentProfile")}
                </h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditing}
                className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                {t("general.edit")}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">{t("general.targetPosition")} </span>
                <span className="font-medium">
                  {(profile?.targetRole as string) || t("common.notUpdatedYet")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("mentorStudents.level")} </span>
                <span className="font-medium">
                  {(profile?.targetLevel as string) || t("common.notUpdatedYet")}
                </span>
              </div>
            </div>
            {Boolean(profile?.introduction) && (
              <p className="text-muted-foreground line-clamp-3 text-sm">
                {String(profile?.introduction)}
              </p>
            )}
            {Array.isArray(profile?.technicalSkills) &&
              (profile.technicalSkills as string[]).length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">
                    {t("mentorStudents.technicalSkills")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.technicalSkills as string[]).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            {Array.isArray(profile?.softSkills) && (profile.softSkills as string[]).length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">
                  {t("mentorStudents.softSkills")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.softSkills as string[]).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(profile?.tools) && (profile.tools as string[]).length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">{t("mentorStudents.tools")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.tools as string[]).map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(profile?.certifications) &&
              (profile.certifications as string[]).length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">
                    {t("general.certifications")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.certifications as string[]).map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            {Array.isArray(profile?.achievements) &&
              (profile.achievements as string[]).length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">{t("general.achievements")}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.achievements as string[]).map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            {/* Full detail: Projects */}
            {Array.isArray(profile?.projects) &&
              (profile.projects as Record<string, unknown>[]).length > 0 && (
                <div className="space-y-1.5 border-t pt-2">
                  <span className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t("general.projects")}
                    {(profile.projects as unknown[]).length})
                  </span>
                  <div className="space-y-1.5">
                    {(profile.projects as Record<string, unknown>[]).map((p, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-zinc-200 bg-white/60 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">
                          {String(p.name ?? "")}
                        </p>
                        {p.role != null && (
                          <p className="text-zinc-500 dark:text-zinc-400">
                            {t("general.role")} {String(p.role)}
                          </p>
                        )}
                        {p.description != null && (
                          <p className="mt-0.5 line-clamp-2 text-zinc-500 dark:text-zinc-400">
                            {String(p.description)}
                          </p>
                        )}
                        {p.outcome != null && (
                          <p className="text-zinc-500 dark:text-zinc-400">
                            {t("common.result1")} {String(p.outcome)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {/* Full detail: Work Experiences */}
            {Array.isArray(profile?.workExperiences) &&
              (profile.workExperiences as Record<string, unknown>[]).length > 0 && (
                <div className="space-y-1.5 border-t pt-2">
                  <span className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    {t("general.experience")}
                    {(profile.workExperiences as unknown[]).length})
                  </span>
                  <div className="space-y-1.5">
                    {(profile.workExperiences as Record<string, unknown>[]).map((e, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-zinc-200 bg-white/60 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">
                          {String(e.position ?? "")}{" "}
                          {e.company != null ? `— ${String(e.company)}` : ""}
                        </p>
                        {(e.start_date != null || e.end_date != null) && (
                          <p className="text-zinc-500 dark:text-zinc-400">
                            {String(e.start_date ?? "")}{" "}
                            {e.end_date != null ? `→ ${String(e.end_date)}` : ""}
                          </p>
                        )}
                        {e.description != null && (
                          <p className="mt-0.5 line-clamp-2 text-zinc-500 dark:text-zinc-400">
                            {String(e.description)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {/* Full detail: Educations */}
            {Array.isArray(profile?.educations) &&
              (profile.educations as Record<string, unknown>[]).length > 0 && (
                <div className="space-y-1.5 border-t pt-2">
                  <span className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {t("general.education")}
                    {(profile.educations as unknown[]).length})
                  </span>
                  <div className="space-y-1.5">
                    {(profile.educations as Record<string, unknown>[]).map((edu, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-zinc-200 bg-white/60 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">
                          {String(edu.school ?? "")}{" "}
                          {edu.major != null ? `— ${String(edu.major)}` : ""}
                        </p>
                        {edu.degree != null && (
                          <p className="text-zinc-500 dark:text-zinc-400">
                            {String(edu.degree)}
                            {edu.gpa != null
                              ? ` · ${t("common.gpaWithValue", { value: String(edu.gpa) })}`
                              : ""}
                          </p>
                        )}
                        {(edu.start_date != null || edu.end_date != null) && (
                          <p className="text-zinc-500 dark:text-zinc-400">
                            {String(edu.start_date ?? "")}{" "}
                            {edu.end_date != null ? `→ ${String(edu.end_date)}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ── No profile + view mode: two action buttons ── */}
        {!profileLoading && !hasExistingProfile && !isEditingProfile && (
          <div className="space-y-4">
            {isUploading ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
                <Spinner size="lg" tone="success" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {t("userAiinterview.analyzingCv")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 transition-all hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20">
                  <Upload className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {t("userAiinterview.uploadYourCv")}
                  </span>
                  <span className="text-muted-foreground text-center text-xs">
                    {t("userAiinterview.autofillFromCv")}
                  </span>
                </button>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-violet-300 bg-violet-50/50 p-6 transition-all hover:border-violet-400 hover:bg-violet-50 dark:border-violet-700 dark:bg-violet-950/20">
                  <Pencil className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    {t("userAiinterview.enterManually")}
                  </span>
                  <span className="text-muted-foreground text-center text-xs">
                    {t("userAiinterview.fillInInformationYourself")}
                  </span>
                </button>
              </div>
            )}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t("userAiinterview.youDoNotHaveA")}{" "}
                <strong>{t("userAiinterview.saveProfile")}</strong>{" "}
                {t("userAiinterview.toContinue")}
              </p>
            </div>
          </div>
        )}

        {/* ── Edit / Create form ── */}
        {isEditingProfile && (
          <div className="space-y-4">
            {/* Upload shortcut — always shown in edit mode */}
            <div className="flex items-center justify-between rounded-lg border border-dashed border-emerald-300 bg-emerald-50/30 px-4 py-2.5 dark:border-emerald-700 dark:bg-emerald-950/10">
              <span className="text-muted-foreground text-xs">
                {t("userAiinterview.wantToAutofillFromCv")}
              </span>
              {isUploading ? (
                <Spinner size="sm" tone="success" />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  {t("userAiinterview.uploadYourCv")}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="targetRole">
                  {t("userAiinterview.targetLocation")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="targetRole"
                  placeholder={t("userAiinterview.exampleBackendProgrammer")}
                  value={candidateForm.targetRole}
                  onChange={(e) => updateCandidateForm("targetRole", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetLevel">{t("common.level")}</Label>
                <Input
                  id="targetLevel"
                  placeholder={t("userAiinterview.placeholderLevel")}
                  value={candidateForm.targetLevel}
                  onChange={(e) => updateCandidateForm("targetLevel", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="introduction">
                {t("common.introduceYourself")} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="introduction"
                placeholder={t("userAiinterview.shortDescriptionAboutYourselfExperience")}
                value={candidateForm.introduction}
                onChange={(e) => updateCandidateForm("introduction", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("common.technicalSkills")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {candidateForm.technicalSkills.map((skill, i) => (
                  <Badge
                    key={`tech-${skill}-${i}`}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => removeTechSkill(i)}
                      aria-label={t("common.deleteVar0", {
                        var_0: skill,
                      })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("userAiinterview.enterTechnicalSkillsAndPress")}
                  value={techSkillInput}
                  onChange={(e) => setTechSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTechSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTechSkill}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.more")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("common.softSkills")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {candidateForm.softSkills.map((skill, i) => (
                  <Badge
                    key={`soft-${skill}-${i}`}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => removeSoftSkill(i)}
                      aria-label={t("common.deleteVar0", {
                        var_0: skill,
                      })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("userAiinterview.enterSoftSkillsAndTap")}
                  value={softSkillInput}
                  onChange={(e) => setSoftSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSoftSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addSoftSkill}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.more")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("common.tools")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {candidateForm.tools.map((tool, i) => (
                  <Badge
                    key={`tool-${tool}-${i}`}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1">
                    <span>{tool}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => removeTool(i)}
                      aria-label={t("common.deleteVar0", {
                        var_0: tool,
                      })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("userAiinterview.enterToolsAndPressAdd")}
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTool();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTool}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.more")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("common.certificate")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {candidateForm.certifications.map((cert, i) => (
                  <Badge
                    key={`cert-${cert}-${i}`}
                    variant="outline"
                    className="flex items-center gap-1 pr-1">
                    <span>{cert}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => removeCertification(i)}
                      aria-label={t("common.deleteVar0", {
                        var_0: cert,
                      })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("userAiinterview.placeholderCertification")}
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCertification();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCertification}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.more")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("common.achievements")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {candidateForm.achievements.map((ach, i) => (
                  <Badge
                    key={`ach-${ach}-${i}`}
                    variant="outline"
                    className="flex items-center gap-1 pr-1">
                    <span>{ach}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => removeAchievement(i)}
                      aria-label={t("common.deleteVar0", {
                        var_0: ach,
                      })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("userAiinterview.exampleExcellentStudentTop1")}
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAchievement();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addAchievement}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.more")}
                </Button>
              </div>
            </div>

            {/* ── Projects ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {t("common.project")}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addProject}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.addProject")}
                </Button>
              </div>
              {candidateForm.projects.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  {t("userAiinterview.thereAreNoProjectsYet")}
                </p>
              )}
              {candidateForm.projects.map((project, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-dashed p-4 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t("common.project")} {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-600"
                      onClick={() => removeProject(index)}>
                      <X className="mr-1 h-3.5 w-3.5" />
                      {t("general.delete")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.projectName")}</Label>
                      <Input
                        placeholder={t("userAiinterview.exampleManagementSystem")}
                        value={project.name ?? ""}
                        onChange={(e) => updateProject(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.role")}</Label>
                      <Input
                        placeholder={t("userAiinterview.placeholderProjectRole")}
                        value={project.role ?? ""}
                        onChange={(e) => updateProject(index, "role", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.describe")}</Label>
                    <Textarea
                      placeholder={t("userAiinterview.projectDescription")}
                      value={project.description ?? ""}
                      onChange={(e) => updateProject(index, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("userAiinterview.teamSizePeople")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={project.teamSize ?? 1}
                        onChange={(e) => updateProject(index, "teamSize", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("userAiinterview.resultsAchieved")}</Label>
                      <Input
                        placeholder={t("userAiinterview.exampleReduceProcessingTimeBy")}
                        value={project.outcome ?? ""}
                        onChange={(e) => updateProject(index, "outcome", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Work Experiences ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {t("common.workExperience")}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addWorkExperience}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.moreExperience")}
                </Button>
              </div>
              {candidateForm.workExperiences.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  {t("userAiinterview.noExperienceYetClickAdd")}
                </p>
              )}
              {candidateForm.workExperiences.map((exp, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-dashed p-4 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t("common.experience")} {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-600"
                      onClick={() => removeWorkExperience(index)}>
                      <X className="mr-1 h-3.5 w-3.5" />
                      {t("general.delete")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.company")}</Label>
                      <Input
                        placeholder={t("userAiinterview.placeholderCompany")}
                        value={exp.company ?? ""}
                        onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.location1")}</Label>
                      <Input
                        placeholder={t("userAiinterview.placeholderJobTitle")}
                        value={exp.position ?? ""}
                        onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.jobDescription")}</Label>
                    <Textarea
                      placeholder={t("general.jobDescription")}
                      value={exp.description ?? ""}
                      onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.startDate")}</Label>
                      <Input
                        type="date"
                        value={exp.start_date ?? ""}
                        onChange={(e) => updateWorkExperience(index, "start_date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.endDate")}</Label>
                      <Input
                        type="date"
                        value={exp.end_date ?? ""}
                        onChange={(e) => updateWorkExperience(index, "end_date", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Educations ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {t("common.education")}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("common.moreEducation")}
                </Button>
              </div>
              {candidateForm.educations.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  {t("userAiinterview.noEducationYetClickAdd")}
                </p>
              )}
              {candidateForm.educations.map((edu, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-dashed p-4 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t("common.education")} {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-600"
                      onClick={() => removeEducation(index)}>
                      <X className="mr-1 h-3.5 w-3.5" />
                      {t("general.delete")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.school")}</Label>
                      <Input
                        placeholder={t("userAiinterview.exampleFptUniversity")}
                        value={edu.school ?? ""}
                        onChange={(e) => updateEducation(index, "school", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.specialized")}</Label>
                      <Input
                        placeholder={t("userAiinterview.exampleSoftwareEngineering")}
                        value={edu.major ?? ""}
                        onChange={(e) => updateEducation(index, "major", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.degree")}</Label>
                      <Input
                        placeholder={t("userAiinterview.exampleBachelor")}
                        value={edu.degree ?? ""}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.gpa")}</Label>
                      <Input
                        placeholder={t("userAiinterview.placeholderGpa")}
                        value={edu.gpa ?? ""}
                        onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.startDate")}</Label>
                      <Input
                        type="date"
                        value={edu.start_date ?? ""}
                        onChange={(e) => updateEducation(index, "start_date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.endDate")}</Label>
                      <Input
                        type="date"
                        value={edu.end_date ?? ""}
                        onChange={(e) => updateEducation(index, "end_date", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-end gap-2 border-t pt-3">
              {hasExistingProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEditing}
                  disabled={isSavingProfile}>
                  {t("general.cancel")}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => void handleSaveProfile()}
                disabled={!canSave || isSavingProfile}
                className="gap-1.5 bg-[#0047AB] text-white hover:bg-[#005B9A]">
                {isSavingProfile ? (
                  <Spinner size="sm" tone="white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("userAiinterview.saveProfile")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
