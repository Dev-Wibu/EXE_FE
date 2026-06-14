import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CandidateProfile } from "@/interfaces/schema.types";
import { Award, Code2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ListField, SkillField } from "./useCandidateProfileForm";
import { buildSkillTabs } from "./useCandidateProfileForm";

interface SkillsEditProps {
  mode: "edit";
  activeSkillTab: SkillField;
  setActiveSkillTab: (tab: SkillField) => void;
  newSkillValue: Record<SkillField, string>;
  setNewSkillValue: React.Dispatch<React.SetStateAction<Record<SkillField, string>>>;
  techSkillsInput: string[];
  softSkillsInput: string[];
  toolsInput: string[];
  certificationsInput: string[];
  achievementsInput: string[];
  getSkillList: (field: SkillField) => string[];
  addSkillBadge: (field: SkillField) => void;
  removeSkillBadge: (field: SkillField, index: number) => void;
  addListItem: (field: Exclude<ListField, SkillField>) => void;
  updateListItem: (field: Exclude<ListField, SkillField>, index: number, value: string) => void;
  removeListItem: (field: Exclude<ListField, SkillField>, index: number) => void;
}

interface SkillsViewProps {
  mode: "view";
  profile: CandidateProfile;
}

type SkillsSectionProps = SkillsEditProps | SkillsViewProps;

export function SkillsSection(props: SkillsSectionProps) {
  const { t } = useTranslation();

  if (props.mode === "view") {
    const { profile } = props;
    return (
      <div className="flex flex-col gap-6">
        {/* Skills Card */}
        <div className="glass-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <Code2 className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("common.skill")}
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                {t("common.technicalSkills")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.technicalSkills ?? []).length > 0 ? (
                  profile.technicalSkills?.map((skill) => (
                    <Badge
                      key={skill}
                      className="rounded-full bg-[#0058be]/10 px-3 py-1 text-xs font-medium text-[#0058be] dark:bg-[#0058be]/30 dark:text-[#66B2FF]">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[#45464d] dark:text-[#8f9099]">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                {t("common.softSkills")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.softSkills ?? []).length > 0 ? (
                  profile.softSkills?.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="rounded-full border-[#c6c6cd] px-3 py-1 text-xs font-medium text-[#45464d] dark:border-[#3a4558] dark:text-[#8f9099]">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[#45464d] dark:text-[#8f9099]">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                {t("common.tools")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.tools ?? []).length > 0 ? (
                  profile.tools?.map((tool) => (
                    <Badge
                      key={tool}
                      className="rounded-full bg-[#0058be]/10 px-3 py-1 text-xs font-medium text-[#0058be] dark:bg-[#0058be]/30 dark:text-[#66B2FF]">
                      {tool}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[#45464d] dark:text-[#8f9099]">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Certificates & Achievements Card */}
        <div className="glass-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
              <Award className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
              {t("userAccount.certificatesAchievements")}
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                {t("common.certificate")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.certifications ?? []).length > 0 ? (
                  profile.certifications?.map((cert) => (
                    <Badge
                      key={cert}
                      className="rounded-full bg-[#0058be]/10 px-3 py-1 text-xs font-medium text-[#0058be] dark:bg-[#0058be]/30 dark:text-[#66B2FF]">
                      {cert}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[#45464d] dark:text-[#8f9099]">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
                {t("common.achievements")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.achievements ?? []).length > 0 ? (
                  profile.achievements?.map((ach) => (
                    <Badge
                      key={ach}
                      variant="outline"
                      className="rounded-full border-[#c6c6cd] px-3 py-1 text-xs font-medium text-[#45464d] dark:border-[#3a4558] dark:text-[#8f9099]">
                      {ach}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[#45464d] dark:text-[#8f9099]">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    activeSkillTab,
    setActiveSkillTab,
    newSkillValue,
    setNewSkillValue,
    techSkillsInput,
    softSkillsInput,
    toolsInput,
    certificationsInput,
    achievementsInput,
    getSkillList,
    addSkillBadge,
    removeSkillBadge,
    addListItem,
    updateListItem,
    removeListItem,
  } = props;

  const activeSkills = getSkillList(activeSkillTab);
  const skillTabs = buildSkillTabs(t);
  const skillCounts: Record<SkillField, number> = {
    technicalSkills: techSkillsInput.filter(Boolean).length,
    softSkills: softSkillsInput.filter(Boolean).length,
    tools: toolsInput.filter(Boolean).length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Skills Card */}
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
            <Code2 className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
            {t("common.skill")}
          </h3>
        </div>

        {/* Tab selector */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {skillTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSkillTab(tab.key)}
              className={
                activeSkillTab === tab.key
                  ? "flex flex-col items-center justify-center rounded-xl border-2 border-[#0058be] bg-[#dae2fd] p-3 text-center transition-all dark:border-[#66B2FF] dark:bg-[#0058be]/30"
                  : "flex flex-col items-center justify-center rounded-xl border border-[#c6c6cd] bg-white p-3 text-center text-[#45464d] transition-all hover:border-[#0058be] hover:bg-[#eff4ff] dark:border-[#3a4558] dark:bg-[#131b2e] dark:text-[#8f9099] dark:hover:border-[#66B2FF] dark:hover:bg-[#1a2a3a]"
              }>
              <span className="text-2xl font-bold text-[#0058be] dark:text-[#66B2FF]">
                {skillCounts[tab.key]}
              </span>
              <span className="mt-0.5 text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Skill input area */}
        <div className="rounded-xl border border-[rgba(15,23,42,0.1)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
              {skillTabs.find((s) => s.key === activeSkillTab)?.label}
            </Label>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {activeSkills.length > 0 ? (
              activeSkills.map((skill, index) => (
                <Badge
                  key={`${activeSkillTab}-${skill}-${index}`}
                  className="flex items-center gap-1.5 rounded-full bg-[#0058be]/10 px-3 py-1 pr-1.5 text-xs font-medium text-[#0058be] dark:bg-[#0058be]/30 dark:text-[#66B2FF]">
                  <span>{skill}</span>
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-[#0058be]/20"
                    onClick={() => removeSkillBadge(activeSkillTab, index)}
                    aria-label={t("common.deleteVar0", { var_0: skill })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-[#45464d] dark:text-[#8f9099]">
                {t("userAccount.noDataYet")}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={newSkillValue[activeSkillTab]}
              onChange={(e) =>
                setNewSkillValue((prev) => ({
                  ...prev,
                  [activeSkillTab]: e.target.value,
                }))
              }
              placeholder={t("userAccount.enterTheSkillAndTap")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkillBadge(activeSkillTab);
                }
              }}
              className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addSkillBadge(activeSkillTab)}
              className="border-[#0058be] text-[#0058be] hover:bg-[#dae2fd] dark:border-[#66B2FF] dark:text-[#66B2FF] dark:hover:bg-[#0058be]/20">
              <Plus className="mr-1 h-4 w-4" />
              {t("common.more")}
            </Button>
          </div>
        </div>
      </div>

      {/* Certificates & Achievements Card */}
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
            <Award className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
            {t("userAccount.certificatesAchievements")}
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
                {t("common.certificate")}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem("certifications")}
                className="border-[#c6c6cd] text-[#45464d] hover:bg-[#eff4ff] dark:border-[#3a4558] dark:text-[#8f9099] dark:hover:bg-[#1a2a3a]">
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t("common.more")}
              </Button>
            </div>
            <div className="space-y-2">
              {(certificationsInput.length > 0 ? certificationsInput : [""]).map((cert, index) => (
                <div key={`cert-${index}`} className="flex items-center gap-2">
                  <Input
                    value={cert}
                    onChange={(e) => updateListItem("certifications", index, e.target.value)}
                    placeholder={t("userAccount.exampleAwsSolutionArchitect")}
                    className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem("certifications", index)}
                    disabled={certificationsInput.length <= 1}
                    className="h-9 w-9 shrink-0 text-[#45464d] hover:bg-red-50 hover:text-red-500 dark:text-[#8f9099] dark:hover:bg-red-900/20 dark:hover:text-red-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
                {t("common.achievements")}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem("achievements")}
                className="border-[#c6c6cd] text-[#45464d] hover:bg-[#eff4ff] dark:border-[#3a4558] dark:text-[#8f9099] dark:hover:bg-[#1a2a3a]">
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t("common.more")}
              </Button>
            </div>
            <div className="space-y-2">
              {(achievementsInput.length > 0 ? achievementsInput : [""]).map(
                (achievement, index) => (
                  <div key={`achievement-${index}`} className="flex items-center gap-2">
                    <Input
                      value={achievement}
                      onChange={(e) => updateListItem("achievements", index, e.target.value)}
                      placeholder={t("userAccount.exampleListOfExcellentStudents")}
                      className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem("achievements", index)}
                      disabled={achievementsInput.length <= 1}
                      className="h-9 w-9 shrink-0 text-[#45464d] hover:bg-red-50 hover:text-red-500 dark:text-[#8f9099] dark:hover:bg-red-900/20 dark:hover:text-red-400">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
