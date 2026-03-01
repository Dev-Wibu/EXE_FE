import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Loader2,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CandidateProfileStep } from "./CandidateProfileStep";
import { ConfigStep } from "./ConfigStep";
import { JobRequirementsStep } from "./JobRequirementsStep";
import { StepIndicator } from "./StepIndicator";
import { useAIInterviewSetup } from "./useAIInterviewSetup";

export function AIInterviewSetupPage() {
  const hook = useAIInterviewSetup();

  const {
    currentStep,
    handleNext,
    handleBack,
    canProceed,
    isCreatingSession,
    selectedMode,
    selectedDifficulty,
    selectedLanguage,
    selectedDomain,
    selectedDuration,
    isStep1Complete,
    isStep2Complete,
    isStep3Complete,
    getSelectedLabel,
    profileMode,
  } = hook;

  return (
    <div className="bg-background min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-foreground text-2xl font-bold">Thiết lập phỏng vấn mới</h1>
          <p className="text-muted-foreground text-sm">
            Hoàn thành 3 bước để bắt đầu buổi phỏng vấn AI
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={currentStep} />
      </div>

      <div className="flex gap-6">
        {/* Left Column - Step Content */}
        <div className="flex flex-1 flex-col gap-6">
          {currentStep === 1 && <ConfigStep hook={hook} />}
          {currentStep === 2 && <CandidateProfileStep hook={hook} />}
          {currentStep === 3 && <JobRequirementsStep hook={hook} />}
        </div>

        {/* Right Column - Summary */}
        <div className="w-96 shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tóm tắt thiết lập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step 1 summary */}
              <div className="space-y-2">
                <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  {isStep1Complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Settings className="text-muted-foreground h-4 w-4" />
                  )}
                  Bước 1: Cấu hình
                </div>
                <div className="space-y-1.5 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Chế độ</span>
                    <Badge
                      variant={selectedMode ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("interview_modes", selectedMode)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Độ khó</span>
                    <Badge
                      variant={selectedDifficulty ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("difficulties", selectedDifficulty)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Ngôn ngữ</span>
                    <Badge
                      variant={selectedLanguage ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("languages", selectedLanguage)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Lĩnh vực</span>
                    <Badge
                      variant={selectedDomain ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("domains", selectedDomain)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Thời lượng</span>
                    <Badge variant="default" className="max-w-40 truncate text-xs">
                      {selectedDuration} phút
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-border border-t" />

              {/* Step 2 summary */}
              <div className="space-y-2">
                <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  {isStep2Complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <User className="text-muted-foreground h-4 w-4" />
                  )}
                  Bước 2: Hồ sơ ứng viên
                </div>
                <div className="pl-6">
                  {isStep2Complete ? (
                    <Badge variant="default" className="text-xs">
                      {profileMode === "existing"
                        ? "Hồ sơ có sẵn"
                        : profileMode === "upload"
                          ? "Từ CV đã tải lên"
                          : "Nhập thủ công"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Chưa hoàn thành</span>
                  )}
                </div>
              </div>

              <div className="border-border border-t" />

              {/* Step 3 summary */}
              <div className="space-y-2">
                <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  {isStep3Complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Briefcase className="text-muted-foreground h-4 w-4" />
                  )}
                  Bước 3: Yêu cầu công việc
                </div>
                <div className="pl-6">
                  {isStep3Complete ? (
                    <Badge variant="default" className="text-xs">
                      Đã tạo yêu cầu
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Chưa hoàn thành</span>
                  )}
                </div>
              </div>

              <div className="border-border border-t" />

              {/* Navigation buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" className="flex-1" onClick={handleBack}>
                    Quay lại
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed || isCreatingSession}
                  className="flex-1 bg-[#0047AB] text-white hover:bg-[#005B9A] disabled:bg-slate-300"
                  size="lg">
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : currentStep === 3 ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Bắt đầu phỏng vấn
                    </>
                  ) : (
                    "Tiếp theo"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
