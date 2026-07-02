import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentRound } from "@/hooks/useRound";
import { cn } from "@/lib/utils";
import type { ApplicationDetail } from "@/services/application-detail.manager";
import { applicationDetailManager } from "@/services/application-detail.manager";
import { useAuthStore } from "@/stores/authStore";
import { ArrowLeft, Send, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function ApplicationMentorReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const applicationId = Number(searchParams.get("applicationId"));
  const roundIdParam = searchParams.get("roundId");
  const roundId = roundIdParam ? Number(roundIdParam) : undefined;

  // Fetch current round config
  const { data: currentRound } = useCurrentRound(applicationId, !!applicationId);
  const roundConfig = currentRound?.configData as
    | {
        mentorInterview?: {
          userId?: number;
          mentorId?: number;
          mentorName?: string;
          mentorAvatar?: string;
          mentorExpertise?: string;
          duration?: number;
          totalPrice?: number;
        };
      }
    | undefined;

  // Fetch existing detail if already submitted
  const [existingDetail, setExistingDetail] = useState<ApplicationDetail | null>(null);

  useEffect(() => {
    if (!applicationId || !roundId) return;
    applicationDetailManager.getByApplicationId(applicationId).then((res) => {
      if (res.success && res.data) {
        const detail = res.data.find((d) => d.roundId === roundId);
        if (detail) setExistingDetail(detail);
      }
    });
  }, [applicationId, roundId]);

  // Form state — STAR model
  const [rating, setRating] = useState<number>(0);
  const [situationNote, setSituationNote] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [resultNote, setResultNote] = useState("");
  const [strength, setStrength] = useState("");
  const [weakness, setWeakness] = useState("");
  const [improve, setImprove] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mentorInfo = roundConfig?.mentorInterview;

  const canSubmit =
    rating > 0 &&
    (situationNote.trim().length > 0 ||
      taskNote.trim().length > 0 ||
      actionNote.trim().length > 0 ||
      resultNote.trim().length > 0);

  const handleSubmit = useCallback(async () => {
    if (!applicationId || !roundId || !user?.id || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = {
        sessionId: 0,
        mentorId: mentorInfo?.mentorId ?? 0,
        userId: user.id,
        rating,
        situationNote: situationNote.trim() || undefined,
        taskNote: taskNote.trim() || undefined,
        actionNote: actionNote.trim() || undefined,
        resultNote: resultNote.trim() || undefined,
        strength: strength.trim() || undefined,
        weakness: weakness.trim() || undefined,
        improve: improve.trim() || undefined,
      };

      const response = await fetch("/api/application-details/mentor-review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, roundId, ...payload }),
      });

      if (response.ok) {
        toast.success(t("userApplicationhistory.reviewSubmittedSuccessfully"));
        navigate(-1);
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData?.message ?? t("common.anErrorHasOccurred"));
      }
    } catch {
      toast.error(t("common.anErrorHasOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    applicationId,
    roundId,
    user,
    mentorInfo,
    rating,
    situationNote,
    taskNote,
    actionNote,
    resultNote,
    strength,
    weakness,
    improve,
    canSubmit,
    navigate,
    t,
  ]);

  if (!applicationId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">{t("common.invalidId")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("userApplicationhistory.mentorReviewRound")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("userApplicationhistory.mentorReviewRoundDesc")}
            </p>
          </div>
        </div>

        {/* Mentor Info Card */}
        {mentorInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("userApplicationhistory.mentorInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {mentorInfo.mentorAvatar ? (
                  <img
                    src={mentorInfo.mentorAvatar}
                    alt={mentorInfo.mentorName}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-[#0047AB]/20"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0047AB]/10 text-lg font-bold text-[#0047AB]">
                    {mentorInfo.mentorName?.charAt(0) ?? "M"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {mentorInfo.mentorName ?? t("userApplicationhistory.mentor")}
                  </p>
                  {mentorInfo.mentorExpertise && (
                    <p className="text-sm text-slate-500">{mentorInfo.mentorExpertise}</p>
                  )}
                  {mentorInfo.duration && (
                    <p className="text-xs text-slate-400">
                      {mentorInfo.duration} {t("common.minute")} •{" "}
                      {mentorInfo.totalPrice ? `${mentorInfo.totalPrice.toLocaleString()} VND` : ""}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already submitted notice */}
        {existingDetail?.mentorReview && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-green-500 text-green-500" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                {t("userApplicationhistory.reviewAlreadySubmitted")}
              </p>
            </div>
          </div>
        )}

        {/* STAR Rating Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {t("userApplicationhistory.ratingAndFeedback")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("userApplicationhistory.overallRating")} <span className="text-red-500">*</span>
              </Label>
              <StarRating
                value={rating}
                onChange={setRating}
                size="lg"
                className={cn(
                  "pointer-events-none opacity-50",
                  rating > 0 && "pointer-events-auto opacity-100"
                )}
              />
              {rating > 0 && (
                <p className="text-xs text-slate-500">
                  {t(`userApplicationhistory.rating${rating}Star` as const, { count: rating })}
                </p>
              )}
            </div>

            {/* STAR Fields */}
            <div className="space-y-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {t("userApplicationhistory.starModel")}
              </p>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("userApplicationhistory.situation")}
                </Label>
                <p className="text-xs text-slate-500">
                  {t("userApplicationhistory.situationHint")}
                </p>
                <Textarea
                  value={situationNote}
                  onChange={(e) => setSituationNote(e.target.value)}
                  placeholder={t("userApplicationhistory.describeTheSituation")}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("userApplicationhistory.task")}</Label>
                <p className="text-xs text-slate-500">{t("userApplicationhistory.taskHint")}</p>
                <Textarea
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder={t("userApplicationhistory.describeTheTask")}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("userApplicationhistory.action")}</Label>
                <p className="text-xs text-slate-500">{t("userApplicationhistory.actionHint")}</p>
                <Textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={t("userApplicationhistory.describeTheAction")}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("userApplicationhistory.result")}</Label>
                <p className="text-xs text-slate-500">{t("userApplicationhistory.resultHint")}</p>
                <Textarea
                  value={resultNote}
                  onChange={(e) => setResultNote(e.target.value)}
                  placeholder={t("userApplicationhistory.describeTheResult")}
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>

            {/* Additional Feedback */}
            <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-700">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {t("userApplicationhistory.additionalFeedback")}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("userApplicationhistory.strength")}
                  </Label>
                  <Textarea
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder={t("userApplicationhistory.whatDidTheMentorDoWell")}
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("userApplicationhistory.weakness")}
                  </Label>
                  <Textarea
                    value={weakness}
                    onChange={(e) => setWeakness(e.target.value)}
                    placeholder={t("userApplicationhistory.whatCouldBeImproved")}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("userApplicationhistory.improvementSuggestion")}
                </Label>
                <Textarea
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  placeholder={t("userApplicationhistory.suggestionsForImprovement")}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
            {t("general.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting || !!existingDetail?.mentorReview}
            className="gap-2 bg-[#0047AB] text-white hover:bg-[#003d91] disabled:bg-slate-300">
            {isSubmitting ? (
              <>
                <Spinner size="sm" tone="white" />
                {t("compUi.submitting")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("common.submit")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
