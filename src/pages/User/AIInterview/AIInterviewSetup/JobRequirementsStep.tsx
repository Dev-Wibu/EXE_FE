import { Briefcase, CheckCircle2, Pencil, Plus, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import type { AIInterviewSetupHook } from "./useAIInterviewSetup";

export function JobRequirementsStep({ hook }: { hook: AIInterviewSetupHook }) {
  const {
    jobDescription,
    setJobDescription,
    isGeneratingJR,
    handleGenerateJR,
    generatedJR,
    setGeneratedJR,
    isEditingJR,
    setIsEditingJR,
    hardSkillInputJR,
    setHardSkillInputJR,
    softSkillInputJR,
    setSoftSkillInputJR,
    toolInputJR,
    setToolInputJR,
    responsibilityInputJR,
    setResponsibilityInputJR,
    updateJRBasicInfo,
    addJRCompetency,
    removeJRCompetency,
    addJRResponsibility,
    removeJRResponsibility,
    updateJRResponsibility,
  } = hook;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg">Yêu cầu công việc</CardTitle>
        </div>
        <CardDescription>
          Nhập mô tả công việc để hệ thống tạo yêu cầu phỏng vấn phù hợp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="jobDescription">
            Mô tả công việc <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="jobDescription"
            placeholder="Dán hoặc nhập mô tả công việc bạn muốn phỏng vấn. VD: Tuyển lập trình viên Backend có kinh nghiệm Java, Spring Boot, microservices..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            className="resize-y"
          />
          <p className="text-muted-foreground text-xs">
            Hệ thống sẽ phân tích mô tả công việc và tạo yêu cầu phỏng vấn chi tiết (kỹ năng, công
            cụ, trách nhiệm...) để AI đặt câu hỏi chính xác hơn.
          </p>
        </div>

        <Button
          onClick={handleGenerateJR}
          disabled={!jobDescription.trim() || isGeneratingJR}
          className="bg-amber-600 text-white hover:bg-amber-700">
          {isGeneratingJR ? (
            <>
              <Spinner size="sm" tone="white" className="mr-2" />
              Đang phân tích mô tả công việc...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo yêu cầu công việc
            </>
          )}
        </Button>

        {/* Generated JR result */}
        {generatedJR !== null && (
          <div className="space-y-4 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Yêu cầu công việc đã được tạo
                </h4>
              </div>
              {!isEditingJR && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingJR(true)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Chỉnh sửa
                </Button>
              )}
            </div>

            {/* ── VIEW MODE ── */}
            {!isEditingJR && (
              <>
                {Boolean(generatedJR.basic_info) && typeof generatedJR.basic_info === "object" && (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Vị trí: </span>
                      <span className="text-foreground font-medium">
                        {String(
                          (generatedJR.basic_info as Record<string, string>).job_title || "Không có"
                        )}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Lĩnh vực: </span>
                      <span className="text-foreground font-medium">
                        {String(
                          (generatedJR.basic_info as Record<string, string>).industry_domain ||
                            "Không có"
                        )}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Cấp độ: </span>
                      <span className="text-foreground font-medium">
                        {String(
                          (generatedJR.basic_info as Record<string, string>).seniority_level ||
                            "Không có"
                        )}
                      </span>
                    </p>
                  </div>
                )}

                {Boolean(generatedJR.competencies) &&
                  typeof generatedJR.competencies === "object" && (
                    <div className="space-y-2">
                      {Array.isArray(
                        (generatedJR.competencies as Record<string, unknown>).hard_skills
                      ) && (
                        <div>
                          <span className="text-muted-foreground text-xs font-medium">
                            Kỹ năng cứng:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(
                              (generatedJR.competencies as Record<string, unknown>)
                                .hard_skills as string[]
                            ).map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {Array.isArray(
                        (generatedJR.competencies as Record<string, unknown>).soft_skills
                      ) && (
                        <div>
                          <span className="text-muted-foreground text-xs font-medium">
                            Kỹ năng mềm:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(
                              (generatedJR.competencies as Record<string, unknown>)
                                .soft_skills as string[]
                            ).map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {Array.isArray(
                        (generatedJR.competencies as Record<string, unknown>).tools_and_platforms
                      ) && (
                        <div>
                          <span className="text-muted-foreground text-xs font-medium">
                            Công cụ và nền tảng:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(
                              (generatedJR.competencies as Record<string, unknown>)
                                .tools_and_platforms as string[]
                            ).map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {Array.isArray(generatedJR.responsibilities) && (
                  <div>
                    <span className="text-muted-foreground text-xs font-medium">
                      Trách nhiệm chính:
                    </span>
                    <ul className="text-muted-foreground mt-1 list-inside list-disc space-y-0.5 text-sm">
                      {(generatedJR.responsibilities as string[]).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={() => setGeneratedJR(null)}>
                  Tạo lại
                </Button>
              </>
            )}

            {/* ── EDIT MODE ── */}
            {isEditingJR && (
              <div className="space-y-4">
                {/* Basic info editable */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Vị trí</Label>
                    <Input
                      value={String(
                        (generatedJR.basic_info as Record<string, string>)?.job_title ?? ""
                      )}
                      onChange={(e) => updateJRBasicInfo("job_title", e.target.value)}
                      placeholder="Vị trí công việc"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lĩnh vực</Label>
                    <Input
                      value={String(
                        (generatedJR.basic_info as Record<string, string>)?.industry_domain ?? ""
                      )}
                      onChange={(e) => updateJRBasicInfo("industry_domain", e.target.value)}
                      placeholder="Lĩnh vực"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cấp độ</Label>
                    <Input
                      value={String(
                        (generatedJR.basic_info as Record<string, string>)?.seniority_level ?? ""
                      )}
                      onChange={(e) => updateJRBasicInfo("seniority_level", e.target.value)}
                      placeholder="Cấp độ"
                    />
                  </div>
                </div>

                {/* Competencies editable */}
                {[
                  {
                    type: "hard_skills" as const,
                    label: "Kỹ năng cứng",
                    inputVal: hardSkillInputJR,
                    setInputVal: setHardSkillInputJR,
                  },
                  {
                    type: "soft_skills" as const,
                    label: "Kỹ năng mềm",
                    inputVal: softSkillInputJR,
                    setInputVal: setSoftSkillInputJR,
                  },
                  {
                    type: "tools_and_platforms" as const,
                    label: "Công cụ và nền tảng",
                    inputVal: toolInputJR,
                    setInputVal: setToolInputJR,
                  },
                ].map(({ type, label, inputVal, setInputVal }) => {
                  const items = Array.isArray(
                    (generatedJR.competencies as Record<string, unknown>)?.[type]
                  )
                    ? ((generatedJR.competencies as Record<string, unknown>)[type] as string[])
                    : [];
                  return (
                    <div key={type} className="space-y-1.5">
                      <Label className="text-xs">{label}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((s, i) => (
                          <Badge
                            key={`${type}-${s}-${i}`}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1 text-xs">
                            <span>{s}</span>
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-black/10"
                              onClick={() => removeJRCompetency(type, i)}
                              aria-label={`Xóa ${s}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          className="h-8 text-xs"
                          placeholder={`Thêm ${label.toLowerCase()}`}
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addJRCompetency(type, inputVal);
                              setInputVal("");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            addJRCompetency(type, inputVal);
                            setInputVal("");
                          }}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Responsibilities editable */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Trách nhiệm chính</Label>
                  <div className="space-y-1.5">
                    {(Array.isArray(generatedJR.responsibilities)
                      ? (generatedJR.responsibilities as string[])
                      : []
                    ).map((r, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          className="h-8 text-xs"
                          value={r}
                          onChange={(e) => updateJRResponsibility(i, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-500 hover:text-red-600"
                          onClick={() => removeJRResponsibility(i)}
                          aria-label="Xóa trách nhiệm">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Thêm trách nhiệm mới"
                      value={responsibilityInputJR}
                      onChange={(e) => setResponsibilityInputJR(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addJRResponsibility(responsibilityInputJR);
                          setResponsibilityInputJR("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        addJRResponsibility(responsibilityInputJR);
                        setResponsibilityInputJR("");
                      }}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-[#0047AB] text-white hover:bg-[#005B9A]"
                    onClick={() => setIsEditingJR(false)}>
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
