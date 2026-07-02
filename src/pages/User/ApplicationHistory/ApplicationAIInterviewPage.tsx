import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentRound } from "@/hooks/useRound";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { ArrowLeft, Bot, Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function ApplicationAIInterviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const applicationId = Number(searchParams.get("applicationId"));

  // Fetch current round config for instruction + time limit
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound(
    applicationId,
    !!applicationId
  );
  const roundConfig = currentRound?.configData as
    | { instruction?: string; timeLimitMinutes?: number }
    | undefined;

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const createAttemptedRef = useRef(false);

  const createSessionMutation = $api.useMutation("post", "/api/interview-sessions/create-session");

  useEffect(() => {
    if (!applicationId || !user?.id || isCreatingSession || createAttemptedRef.current) return;
    createAttemptedRef.current = true;
    setIsCreatingSession(true);

    void (async () => {
      try {
        const body = {
          user_id: user.id,
          candidate_profile: null,
          job_requirement: {
            basic_info: {
              job_title: "Application Interview",
              industry_domain: "IT",
              seniority_level: "Senior",
            },
            competencies: {
              hard_skills: [],
              soft_skills: [],
              tools_and_platforms: [],
            },
            responsibilities: [roundConfig?.instruction ?? ""],
          },
          session_config: {
            duration_minutes: roundConfig?.timeLimitMinutes ?? 30,
            interview_mode: "STANDARD_MOCK",
            difficulty: "FRESHER_ADVANCED",
            language: "VI",
            domain: "IT",
          },
        };

        const result = await createSessionMutation.mutateAsync({ body } as never);
        const rawKey = (result as unknown as string)?.trim?.() ?? "";

        let key = "";
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawKey)) {
          key = rawKey;
        } else if (typeof result === "object" && result !== null && "sessionKey" in result) {
          key = String((result as { sessionKey: string }).sessionKey);
        } else {
          throw new Error("Invalid session key: " + rawKey.slice(0, 50));
        }

        sessionStorage.setItem(`app-session-return:${key}`, `/user/application-history`);
        navigate(`/user/ai-interview/session?sessionKey=${key}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("userAiinterview.unableToCreateInterviewSession")
        );
        navigate(-1);
      } finally {
        setIsCreatingSession(false);
      }
    })();
  }, [applicationId, user, isCreatingSession, roundConfig, createSessionMutation, navigate, t]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (!applicationId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">{t("common.invalidId")}</p>
      </div>
    );
  }

  const isLoading = roundLoading || isCreatingSession;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-50 to-white px-4 dark:from-slate-900 dark:to-slate-800">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0"
          disabled={isCreatingSession}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0047AB] shadow-lg">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("userApplicationhistory.aiInterviewRound")}
            </h1>
            <p className="text-sm text-slate-500">{roundConfig?.instruction ?? "AI Interview"}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <>
            <Spinner size="lg" tone="primary" />
            <p className="text-sm text-slate-500">
              {roundLoading
                ? t("userAiinterview.preparingYourInterview")
                : t("userApplicationhistory.redirectingToInterview")}
            </p>
          </>
        ) : (
          <>
            <Clock className="h-12 w-12 animate-pulse text-[#0047AB]" />
            <p className="text-sm text-slate-500">
              {t("userApplicationhistory.redirectingToInterview")}
            </p>
          </>
        )}
      </div>

      {roundConfig && (
        <div className="w-full max-w-md space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {roundConfig.instruction && (
            <p className="text-xs text-slate-600 dark:text-slate-400">{roundConfig.instruction}</p>
          )}
          {roundConfig.timeLimitMinutes && (
            <div className="flex items-center gap-1.5 pt-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">
                {roundConfig.timeLimitMinutes} {t("common.minute")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
