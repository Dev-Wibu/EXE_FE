import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CandidateProfile } from "@/interfaces/schema.types";

import type { ListField, SkillField } from "./useCandidateProfileForm";
import { SKILL_TABS } from "./useCandidateProfileForm";

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
  if (props.mode === "view") {
    const { profile } = props;
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Kỹ năng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Kỹ năng kỹ thuật</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(profile.technicalSkills ?? []).length > 0 ? (
                  profile.technicalSkills!.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Kỹ năng mềm</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(profile.softSkills ?? []).length > 0 ? (
                  profile.softSkills!.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Công cụ</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(profile.tools ?? []).length > 0 ? (
                  profile.tools!.map((tool) => (
                    <Badge key={tool} variant="secondary">
                      {tool}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chứng chỉ & Thành tích</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Chứng chỉ</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(profile.certifications ?? []).length > 0 ? (
                  profile.certifications!.map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Thành tích</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(profile.achievements ?? []).length > 0 ? (
                  profile.achievements!.map((ach) => (
                    <Badge key={ach} variant="outline">
                      {ach}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </>
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
  const skillCounts: Record<SkillField, number> = {
    technicalSkills: techSkillsInput.filter(Boolean).length,
    softSkills: softSkillsInput.filter(Boolean).length,
    tools: toolsInput.filter(Boolean).length,
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kỹ năng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SKILL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSkillTab(tab.key)}
                className={
                  activeSkillTab === tab.key
                    ? "flex min-h-16 flex-col items-center justify-center rounded-lg border border-[#0047AB] bg-blue-50 px-2 py-1.5 text-center text-[#0047AB]"
                    : "flex min-h-16 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-slate-600 hover:bg-slate-100"
                }>
                <span className="text-xl font-bold">{skillCounts[tab.key]}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-lg border p-3 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <Label>{SKILL_TABS.find((s) => s.key === activeSkillTab)?.label}</Label>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeSkills.length > 0 ? (
                activeSkills.map((skill, index) => (
                  <Badge
                    key={`${activeSkillTab}-${skill}-${index}`}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => removeSkillBadge(activeSkillTab, index)}
                      aria-label={`Xóa ${skill}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-400">Chưa có dữ liệu.</span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                value={newSkillValue[activeSkillTab]}
                onChange={(e) =>
                  setNewSkillValue((prev) => ({
                    ...prev,
                    [activeSkillTab]: e.target.value,
                  }))
                }
                placeholder="Nhập kỹ năng và nhấn Thêm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkillBadge(activeSkillTab);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addSkillBadge(activeSkillTab)}>
                <Plus className="mr-1 h-4 w-4" />
                Thêm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chứng chỉ & Thành tích</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Chứng chỉ</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem("certifications")}
                className="gap-1">
                <Plus className="h-4 w-4" />
                Thêm
              </Button>
            </div>
            <div className="space-y-2">
              {(certificationsInput.length > 0 ? certificationsInput : [""]).map((cert, index) => (
                <div key={`cert-${index}`} className="flex items-center gap-2">
                  <Input
                    value={cert}
                    onChange={(e) => updateListItem("certifications", index, e.target.value)}
                    placeholder="VD: Kiến trúc sư giải pháp AWS"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem("certifications", index)}
                    disabled={certificationsInput.length <= 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Thành tích</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem("achievements")}
                className="gap-1">
                <Plus className="h-4 w-4" />
                Thêm
              </Button>
            </div>
            <div className="space-y-2">
              {(achievementsInput.length > 0 ? achievementsInput : [""]).map(
                (achievement, index) => (
                  <div key={`achievement-${index}`} className="flex items-center gap-2">
                    <Input
                      value={achievement}
                      onChange={(e) => updateListItem("achievements", index, e.target.value)}
                      placeholder="VD: Danh sách sinh viên xuất sắc 2021"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem("achievements", index)}
                      disabled={achievementsInput.length <= 1}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
