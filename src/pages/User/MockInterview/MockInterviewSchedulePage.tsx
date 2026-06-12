/**
 * MockInterviewSchedulePage.tsx
 * Redesigned "Schedule a New Interview" page
 * Steps: Select Mentor → Choose Date/Time (joinTime) → Review & Create
 *
 * BE requirement: User chooses a date/time for meeting start (joinTime). exp defaults to 0.
 */

import { DateTimePicker } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingCardList } from "@/components/ui/loading-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMentors } from "@/hooks/useMentor";
import { useCreateSession } from "@/hooks/useSession";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
  Clock,
  Search,
  Star,
  User,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Minimum time offset in milliseconds (1 minute)
const MIN_FUTURE_OFFSET_MS = 60 * 1000;
type MockInterviewScheduleLocationState = {
  preselectedMentorId?: number;
};
export function MockInterviewSchedulePage() {
  const { t } = useTranslation();

  // Step definitions
  const STEPS = [
    {
      id: 1,
      label: t("userMockinterview.selectMentor"),
      icon: Users,
    },
    {
      id: 2,
      label: t("userMockinterview.chooseTime"),
      icon: CalendarIcon,
    },
    {
      id: 3,
      label: t("common.confirm"),
      icon: Check,
    },
  ] as const;

  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { data: mentors = [], isLoading } = useMentors();
  const createSession = useCreateSession();
  const preselectedMentorId = useMemo(() => {
    const state = location.state as MockInterviewScheduleLocationState | null;
    const rawIdFromState = state?.preselectedMentorId;
    const rawIdFromQuery = Number(new URLSearchParams(location.search).get("mentorId"));
    const rawId =
      typeof rawIdFromState === "number" && Number.isFinite(rawIdFromState)
        ? rawIdFromState
        : rawIdFromQuery;
    if (typeof rawId !== "number") {
      return null;
    }
    return Number.isFinite(rawId) && rawId > 0 ? rawId : null;
  }, [location.search, location.state]);

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Mentor selection
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(preselectedMentorId);
  useEffect(() => {
    if (preselectedMentorId !== null) {
      setSelectedMentorId(preselectedMentorId);
    }
  }, [preselectedMentorId]);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 2: Date/Time selection - preset current time
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [recordingMode, setRecordingMode] = useState<string>("cloud");

  // helper to quickly fill current time (+small offset to satisfy validation)
  const handleSetNow = () => {
    setSelectedDateTime(new Date(Date.now() + MIN_FUTURE_OFFSET_MS * 2));
  };

  // Step 3: Creating
  const [isCreating, setIsCreating] = useState(false);

  // Filtered mentors
  const filteredMentors = useMemo(() => {
    const activeMentors = mentors.filter((m) => m.active !== false);
    if (!searchQuery) return activeMentors;
    const q = searchQuery.toLowerCase();
    return activeMentors.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.expertise?.toLowerCase().includes(q) ||
        m.currentCompany?.toLowerCase().includes(q)
    );
  }, [mentors, searchQuery]);

  // Selected mentor data
  const selectedMentor = mentors.find((m) => m.id === selectedMentorId);
  const mentorPricePerMinute =
    typeof selectedMentor?.pricePerMinute === "number" ? selectedMentor.pricePerMinute : 0;
  const hasValidMentorPrice = mentorPricePerMinute > 0;
  const totalPrice = useMemo(() => {
    if (durationMinutes <= 0 || mentorPricePerMinute <= 0) {
      return 0;
    }
    return durationMinutes * mentorPricePerMinute;
  }, [durationMinutes, mentorPricePerMinute]);

  // Calculate joinTime in UTC ISO format to send to BE
  const calculateJoinTime = (): string | undefined => {
    if (!selectedDateTime) return undefined;
    return selectedDateTime.toISOString();
  };

  // Format selected date/time for display
  const formatSelectedDateTime = (): string => {
    if (!selectedDateTime) return t("common.notSelectedYet");
    return formatDateTime(selectedDateTime, t("common.notSelectedYet"));
  };

  // Validation
  const isDateTimeValid = (): boolean => {
    if (!selectedDateTime) return false;
    return selectedDateTime.getTime() > Date.now() + MIN_FUTURE_OFFSET_MS;
  };
  const canProceedStep1 = selectedMentorId !== null && hasValidMentorPrice;
  const canProceedStep2 = isDateTimeValid() && durationMinutes > 0 && hasValidMentorPrice;

  // Render stars
  const renderStars = (rating?: number) => {
    const r = rating ?? 0;
    const fullStars = Math.floor(r);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        {r > 0 && <span className="ml-1 text-xs text-slate-500">({r})</span>}
      </div>
    );
  };

  // Handle session creation
  const handleCreateSession = async () => {
    if (!selectedMentorId || !user?.id) return;
    if (!hasValidMentorPrice) {
      toast.error(t("userMockinterview.mentorHasNotConfiguredA"));
      return;
    }
    const normalizedUserId = Math.round(Number(user.id));
    const normalizedMentorId = Math.round(Number(selectedMentorId));
    const normalizedDuration = Math.max(1, Math.round(durationMinutes));
    const normalizedTotalPrice = Math.round(totalPrice);
    if (!Number.isFinite(normalizedTotalPrice) || normalizedTotalPrice <= 0) {
      toast.error(t("userMockinterview.unableToScheduleAnAppointment"));
      return;
    }
    if (
      !Number.isFinite(normalizedUserId) ||
      !Number.isFinite(normalizedMentorId) ||
      !Number.isFinite(normalizedDuration) ||
      !Number.isFinite(normalizedTotalPrice)
    ) {
      return;
    }
    setIsCreating(true);
    try {
      const joinTime = calculateJoinTime();
      await createSession.mutateAsync({
        userId: normalizedUserId,
        mentorId: normalizedMentorId,
        joinTime,
        duration: normalizedDuration,
        totalPrice: normalizedTotalPrice,
        dailyCoCreationRequest: {
          name: "",
          privacy: "public",
          properties: {
            max_participants: 2,
            start_video_off: true,
            start_audio_off: true,
            enable_screenshare: true,
            exp: 0,
            enable_recording: recordingMode,
          },
        },
      });
      // Navigate to confirmation page instead of room (session is DRAFT, needs approval)
      navigate("/user/mock-interview/booking-success", {
        state: {
          mentorName: selectedMentor?.name || t("common.mentor"),
          joinTime: formatSelectedDateTime(),
          duration: durationMinutes,
          totalPrice,
        },
      });
    } catch {
      // Error toast handled by useCreateSession hook
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/user?tab=mockInterview")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("general.back")}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("userMockinterview.scheduleANewInterview")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("userMockinterview.chooseAMentorTimeAnd")}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive && "bg-[#0047AB] text-white",
                  isCompleted && "bg-green-100 text-green-700",
                  !isActive && !isCompleted && "bg-slate-100 text-slate-400"
                )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.id}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8", isCompleted ? "bg-green-400" : "bg-slate-200")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Mentor */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("userMockinterview.searchByNameExpertise")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Mentor List */}
          {isLoading ? (
            <LoadingCardList count={4} />
          ) : filteredMentors.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <User className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="font-medium text-slate-600">
                  {searchQuery
                    ? t("common.noSuitableMentorFound")
                    : t("userMockinterview.thereAreNoMentorsYet")}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {t("common.trySearchingWithOtherKeywords")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredMentors.map((mentor) => {
                const isSelected = selectedMentorId === mentor.id;
                return (
                  <Card
                    key={mentor.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected &&
                        "border-[#0047AB] bg-blue-50/50 ring-2 ring-[#0047AB]/20 dark:bg-blue-950/20"
                    )}
                    onClick={() => setSelectedMentorId(mentor.id ?? null)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-blue-500">
                            {mentor.avatarUrl ? (
                              <img
                                src={mentor.avatarUrl}
                                alt={mentor.name}
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {mentor.name || t("common.mentor")}
                            </CardTitle>
                            <CardDescription>
                              {mentor.currentCompany || t("common.interviewExpert")}
                            </CardDescription>
                          </div>
                        </div>
                        {isSelected && (
                          <Badge className="bg-[#0047AB] text-white">
                            {t("userMockinterview.selected")}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {renderStars(mentor.averageRating)}
                        {mentor.expertise && (
                          <div className="flex flex-wrap gap-1">
                            {mentor.expertise.split(",").map((skill) => (
                              <Badge key={skill.trim()} variant="secondary" className="text-xs">
                                {skill.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {mentor.totalSession != null && (
                            <span>
                              {mentor.totalSession} {t("userMockinterview.interview")}
                            </span>
                          )}
                          {mentor.yearsOfExperience != null && (
                            <span>
                              {mentor.yearsOfExperience} {t("userMockinterview.yearKn")}
                            </span>
                          )}
                          {typeof mentor.pricePerMinute === "number" &&
                            mentor.pricePerMinute > 0 && (
                              <span className="font-medium text-emerald-700">
                                {formatCurrency(mentor.pricePerMinute)} / {t("common.perMinute")}
                              </span>
                            )}
                          {(!mentor.pricePerMinute || mentor.pricePerMinute <= 0) && (
                            <span className="font-medium text-amber-700">
                              {t("userMockinterview.unitPriceHasNotBeen")}
                            </span>
                          )}
                        </div>
                        {mentor.bio && (
                          <p className="line-clamp-2 text-xs text-slate-500">{mentor.bio}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Next Button */}
          <div className="flex justify-end pt-4">
            {selectedMentorId !== null && !hasValidMentorPrice && (
              <p className="mr-auto text-sm text-amber-700">
                {t("userMockinterview.theSelectedMentorDoesNot")}
              </p>
            )}
            <Button
              size="lg"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedStep1}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              {t("common.next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Date/Time */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#0047AB]" />
                {t("userMockinterview.chooseTheMeetingStartTime")}
              </CardTitle>
              <CardDescription>
                {t("userMockinterview.selectTheInterviewStartDate")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date/Time Picker */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>{t("userMockinterview.startTime")}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleSetNow}
                    className="h-7 text-xs">
                    {t("userMockinterview.now")}
                  </Button>
                </div>
                <DateTimePicker
                  value={selectedDateTime}
                  onChange={setSelectedDateTime}
                  minDate={new Date()}
                  themeVariant="user"
                  className="w-full sm:w-[320px]"
                />
              </div>

              {/* Time Preview */}
              {selectedDateTime && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <Clock className="h-4 w-4" />
                    <span>{t("userMockinterview.timeInformation")}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                    <p>
                      {t("general.startsAt")} {formatSelectedDateTime()}
                    </p>
                  </div>
                </div>
              )}

              {/* Warning if date is in the past */}
              {selectedDateTime && !isDateTimeValid() && (
                <p className="text-sm text-red-500">{t("userMockinterview.theStartTimeMustBe")}</p>
              )}

              {/* Recording mode */}
              <div className="space-y-2">
                <Label>{t("userMockinterview.recordingMode")}</Label>
                <Select value={recordingMode} onValueChange={setRecordingMode}>
                  <SelectTrigger className="w-full sm:w-[320px]">
                    <SelectValue placeholder={t("common.selectRecordingMode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud">{t("common.cloudCloud")}</SelectItem>
                    <SelectItem value="local">{t("common.localComputer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration and Total Price */}
              <div
                className={cn("grid gap-4", totalPrice > 0 ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">{t("userMockinterview.durationMinutes")}</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={15}
                    step={15}
                    value={durationMinutes}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setDurationMinutes(Number.isFinite(next) ? Math.max(0, next) : 0);
                    }}
                  />
                </div>
                {totalPrice > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="totalPrice">{t("userMockinterview.estimatedTotalPrice")}</Label>
                    <Input id="totalPrice" value={formatCurrency(totalPrice)} readOnly disabled />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("general.back")}
            </Button>
            <Button
              size="lg"
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedStep2}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              {t("common.next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Create */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                {t("userMockinterview.confirmInterviewSessionInformation")}
              </CardTitle>
              <CardDescription>
                {t("userMockinterview.doubleCheckTheInformationBefore")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mentor Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase">
                  {t("userMockinterview.mentorSelected")}
                </h3>
                {selectedMentor && (
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-blue-500">
                      {selectedMentor.avatarUrl ? (
                        <img
                          src={selectedMentor.avatarUrl}
                          alt={selectedMentor.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedMentor.name || t("common.mentor")}</p>
                      <p className="text-sm text-slate-500">
                        {selectedMentor.currentCompany || t("common.interviewExpert")}
                      </p>
                      {renderStars(selectedMentor.averageRating)}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Time Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase">
                  {t("userMockinterview.sessionTime")}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">{t("userMockinterview.startAt")}</p>
                      <p className="text-sm font-medium">{formatSelectedDateTime()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">{t("common.duration")}</p>
                      <p className="text-sm font-medium">
                        {durationMinutes} {t("common.minute")}
                      </p>
                    </div>
                  </div>
                  {totalPrice > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border p-3 sm:col-span-2">
                      <Video className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">
                          {t("userMockinterview.estimatedTotalPrice")}
                        </p>
                        <p className="text-sm font-medium text-emerald-700">
                          {formatCurrency(totalPrice)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Room Config Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase">
                  {t("userMockinterview.roomConfiguration")}
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {t("userMockinterview.maximumNumberOfParticipants")}
                    </span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("userMockinterview.screenSharing")}</span>
                    <span className="font-medium text-green-600">{t("common.enabled")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("common.videoRecording")}</span>
                    <span className="font-medium text-green-600">
                      {recordingMode === "cloud"
                        ? t("common.cloudCloud")
                        : t("common.localComputer")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("general.back")}
            </Button>
            <Button
              size="lg"
              onClick={handleCreateSession}
              disabled={isCreating}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              <Video className="h-5 w-5" />
              {isCreating ? t("common.creating") : t("userMockinterview.createAnInterviewSession")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
