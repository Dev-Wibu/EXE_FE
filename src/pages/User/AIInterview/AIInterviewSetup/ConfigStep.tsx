import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfigSection, LoadingSkeleton } from "./ConfigOptionCard";
import { buildDurationOptions } from "./constants";
import type { AIInterviewSetupHook } from "./useAIInterviewSetup";
export function ConfigStep({ hook }: { hook: AIInterviewSetupHook }) {
  const { t } = useTranslation();
  const durationOptions = buildDurationOptions(t);
  const {
    configOptions,
    configLoading,
    configError,
    selectedMode,
    setSelectedMode,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedLanguage,
    setSelectedLanguage,
    selectedDomain,
    setSelectedDomain,
    selectedDuration,
    setSelectedDuration,
  } = hook;
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <CardTitle className="text-lg">{t("userAiinterview.configureTheInterview")}</CardTitle>
        </div>
        <CardDescription>{t("userAiinterview.chooseTheModeDifficultyLevel")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {configLoading && <LoadingSkeleton />}

        {configError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="font-medium text-red-700 dark:text-red-300">
              {t("userAiinterview.unableToLoadInterviewConfiguration")}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("userAiinterview.pleaseTryAgainLater")}
            </p>
          </div>
        )}

        {configOptions && !configLoading && !configError && (
          <>
            {configOptions.interview_modes && (
              <ConfigSection
                categoryKey="interview_modes"
                items={configOptions.interview_modes}
                selectedKey={selectedMode}
                onSelect={setSelectedMode}
              />
            )}
            {configOptions.difficulties && (
              <ConfigSection
                categoryKey="difficulties"
                items={configOptions.difficulties}
                selectedKey={selectedDifficulty}
                onSelect={setSelectedDifficulty}
              />
            )}
            {configOptions.languages && (
              <ConfigSection
                categoryKey="languages"
                items={configOptions.languages}
                selectedKey={selectedLanguage}
                onSelect={setSelectedLanguage}
              />
            )}
            {configOptions.domains && (
              <ConfigSection
                categoryKey="domains"
                items={configOptions.domains}
                selectedKey={selectedDomain}
                onSelect={setSelectedDomain}
              />
            )}

            {/* Duration config */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <Clock className="h-5 w-5" />
                </div>
                <h4 className="text-foreground text-sm font-semibold">
                  {t("userAiinterview.interviewDuration")}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`relative flex w-full flex-col items-center gap-1 rounded-lg border-2 p-4 transition-all ${selectedDuration === opt.value ? "border-rose-500 bg-rose-50 shadow-sm dark:bg-rose-950/40" : "border-border bg-card hover:border-border/80 hover:bg-accent/50"}`}>
                    {selectedDuration === opt.value && (
                      <CheckCircle2
                        className="absolute top-2 right-2 h-4 w-4 text-rose-600 dark:text-rose-400"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    )}
                    <span
                      className={`text-lg font-bold ${selectedDuration === opt.value ? "text-rose-700 dark:text-rose-300" : "text-foreground"}`}>
                      {opt.value}
                    </span>
                    <span className="text-muted-foreground text-xs">{t("common.minute")}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
