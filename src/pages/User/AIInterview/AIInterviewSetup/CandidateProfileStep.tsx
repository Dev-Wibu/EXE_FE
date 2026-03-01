import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { AIInterviewSetupHook } from "./useAIInterviewSetup";

export function CandidateProfileStep({ hook }: { hook: AIInterviewSetupHook }) {
  const {
    profileMode,
    setProfileMode,
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
    isUploading,
    uploadedProfile,
    setUploadedProfile,
    fileInputRef,
    handleUploadCV,
    populateFormFromProfile,
    existingProfile,
    profileLoading,
    hasExistingProfile,
  } = hook;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Hồ sơ ứng viên</CardTitle>
        </div>
        <CardDescription>
          Chọn hồ sơ có sẵn, tải CV lên hoặc nhập thông tin thủ công
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile mode selector */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Existing profile option */}
          <button
            onClick={() => setProfileMode("existing")}
            disabled={!hasExistingProfile && !profileLoading}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
              profileMode === "existing"
                ? "border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-950/40"
                : "border-border bg-card hover:border-border/80",
              !hasExistingProfile && !profileLoading && "cursor-not-allowed opacity-50"
            )}>
            {profileMode === "existing" && (
              <CheckCircle2
                className="absolute top-2 right-2 h-4 w-4 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                strokeWidth={0}
              />
            )}
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-foreground text-sm font-semibold">Hồ sơ có sẵn</span>
            <span className="text-muted-foreground text-xs">
              {profileLoading
                ? "Đang tải..."
                : hasExistingProfile
                  ? "Sử dụng hồ sơ đã lưu"
                  : "Chưa có hồ sơ"}
            </span>
          </button>

          {/* Upload CV option */}
          <button
            onClick={() => {
              setProfileMode("upload");
              if (!uploadedProfile) fileInputRef.current?.click();
            }}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
              profileMode === "upload"
                ? "border-emerald-500 bg-emerald-50 shadow-sm dark:bg-emerald-950/40"
                : "border-border bg-card hover:border-border/80"
            )}>
            {profileMode === "upload" && (
              <CheckCircle2
                className="absolute top-2 right-2 h-4 w-4 text-emerald-600 dark:text-emerald-400"
                fill="currentColor"
                strokeWidth={0}
              />
            )}
            <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span className="text-foreground text-sm font-semibold">Tải CV lên</span>
            <span className="text-muted-foreground text-xs">Tạo hồ sơ từ CV</span>
          </button>

          {/* Manual entry option */}
          <button
            onClick={() => setProfileMode("manual")}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
              profileMode === "manual"
                ? "border-violet-500 bg-violet-50 shadow-sm dark:bg-violet-950/40"
                : "border-border bg-card hover:border-border/80"
            )}>
            {profileMode === "manual" && (
              <CheckCircle2
                className="absolute top-2 right-2 h-4 w-4 text-violet-600 dark:text-violet-400"
                fill="currentColor"
                strokeWidth={0}
              />
            )}
            <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <span className="text-foreground text-sm font-semibold">Nhập thủ công</span>
            <span className="text-muted-foreground text-xs">Tự điền thông tin</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadCV(file);
          }}
        />

        {/* Existing profile display */}
        {profileMode === "existing" && hasExistingProfile && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Hồ sơ hiện tại của bạn
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  populateFormFromProfile(existingProfile as unknown as Record<string, unknown>)
                }
                className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                Chỉnh sửa
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Vị trí mục tiêu: </span>
                <span className="text-foreground font-medium">
                  {((existingProfile as Record<string, unknown>).targetRole as string) ||
                    "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Cấp độ: </span>
                <span className="text-foreground font-medium">
                  {((existingProfile as Record<string, unknown>).targetLevel as string) ||
                    "Chưa cập nhật"}
                </span>
              </div>
            </div>
            {Boolean((existingProfile as Record<string, unknown>).introduction) && (
              <p className="text-muted-foreground text-sm">
                {String((existingProfile as Record<string, unknown>).introduction)}
              </p>
            )}
            {Array.isArray((existingProfile as Record<string, unknown>).technicalSkills) &&
              ((existingProfile as Record<string, unknown>).technicalSkills as string[]).length >
                0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Kỹ năng kỹ thuật:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {((existingProfile as Record<string, unknown>).technicalSkills as string[]).map(
                      (skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            {Array.isArray((existingProfile as Record<string, unknown>).softSkills) &&
              ((existingProfile as Record<string, unknown>).softSkills as string[]).length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Kỹ năng mềm:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {((existingProfile as Record<string, unknown>).softSkills as string[]).map(
                      (skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            {Array.isArray((existingProfile as Record<string, unknown>).tools) &&
              ((existingProfile as Record<string, unknown>).tools as string[]).length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Công cụ:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {((existingProfile as Record<string, unknown>).tools as string[]).map(
                      (tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">
                          {tool}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {profileMode === "existing" && !hasExistingProfile && !profileLoading && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/30">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Bạn chưa có hồ sơ ứng viên. Vui lòng tải CV lên hoặc nhập thủ công.
            </p>
          </div>
        )}

        {/* Upload CV result or uploading state */}
        {profileMode === "upload" && (
          <div className="space-y-3">
            {isUploading && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Đang tải và phân tích CV...
                </p>
              </div>
            )}
            {!isUploading && !uploadedProfile && (
              <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-8 dark:border-emerald-700 dark:bg-emerald-950/20">
                <Upload className="h-10 w-10 text-emerald-400" />
                <p className="text-muted-foreground text-sm">
                  Kéo thả hoặc bấm để chọn file CV (.pdf, .doc, .docx)
                </p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Chọn file
                </Button>
              </div>
            )}
            {uploadedProfile !== null && (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Hồ sơ đã được tạo từ CV
                  </h4>
                </div>
                <p className="text-muted-foreground text-sm">
                  Vị trí: {(uploadedProfile.targetRole as string) || "Không có"} • Cấp độ:{" "}
                  {(uploadedProfile.targetLevel as string) || "Không có"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedProfile(null);
                    fileInputRef.current?.click();
                  }}>
                  Tải lại CV
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Manual entry form */}
        {profileMode === "manual" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="targetRole">
                  Vị trí mục tiêu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="targetRole"
                  placeholder="VD: Lập trình viên Backend"
                  value={candidateForm.targetRole}
                  onChange={(e) => updateCandidateForm("targetRole", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetLevel">Cấp độ</Label>
                <Input
                  id="targetLevel"
                  placeholder="VD: Intern, Fresher, Junior, Middle"
                  value={candidateForm.targetLevel}
                  onChange={(e) => updateCandidateForm("targetLevel", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="introduction">
                Giới thiệu bản thân <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="introduction"
                placeholder="Mô tả ngắn về bản thân, kinh nghiệm..."
                value={candidateForm.introduction}
                onChange={(e) => updateCandidateForm("introduction", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kỹ năng kỹ thuật</Label>
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
                      aria-label={`Xóa ${skill}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập kỹ năng kỹ thuật và nhấn Thêm"
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
                  Thêm
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Kỹ năng mềm</Label>
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
                      aria-label={`Xóa ${skill}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập kỹ năng mềm và nhấn Thêm"
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
                  Thêm
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Công cụ</Label>
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
                      aria-label={`Xóa ${tool}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập công cụ và nhấn Thêm"
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
                  Thêm
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
