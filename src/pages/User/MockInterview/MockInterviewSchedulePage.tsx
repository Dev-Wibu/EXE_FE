/**
 * MockInterviewSchedulePage.tsx
 * Redesigned "Schedule a New Interview" page
 * Steps: Select Mentor → Choose Date/Time (joinTime) → Review & Create
 *
 * BE requirement: User chooses a date/time for meeting start (joinTime). exp defaults to 0.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingCardList } from "@/components/ui/loading-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { formatCurrency, formatDateTime, formatTime, toVietnamDateKey } from "@/lib/formatting";
import i18n from "@/lib/i18n";
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

// Time options for the select dropdown
const HOUR_OPTIONS = Array.from(
  {
    length: 24,
  },
  (_, i) => ({
    value: String(i).padStart(2, "0"),
    label: String(i).padStart(2, "0"),
  })
);

// All 60 minutes for full flexibility; 5-minute intervals are highlighted
const MINUTE_OPTIONS = Array.from(
  {
    length: 60,
  },
  (_, i) => ({
    value: String(i).padStart(2, "0"),
    label: String(i).padStart(2, "0"),
    is5Min: i % 5 === 0,
  })
);

// Minimum time offset in milliseconds (1 minute)
const MIN_FUTURE_OFFSET_MS = 60 * 1000;
const VIETNAM_UTC_OFFSET_HOURS = 7;
const parseVietnamDateKey = (dateKey: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  return new Date(year, month - 1, day);
};
const getVietnamTimeParts = (value: Date) => {
  const [hour = "00", minute = "00"] = formatTime(value, "00:00").split(":");
  return {
    hour,
    minute,
  };
};
const buildJoinDateFromVietnamSelection = (
  selectedDate: Date,
  selectedHour: string,
  selectedMinute: string
) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();

  // Convert a Vietnam local date/time selection into a stable UTC instant.
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      Number(selectedHour) - VIETNAM_UTC_OFFSET_HOURS,
      Number(selectedMinute),
      0,
      0
    )
  );
};
const formatVietnamDateLabel = (selectedDate: Date) => {
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  const dateInVietnam = buildJoinDateFromVietnamSelection(selectedDate, "00", "00");
  return dateInVietnam.toLocaleDateString(locale, {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState(() => getVietnamTimeParts(new Date()).hour);
  const [selectedMinute, setSelectedMinute] = useState(
    () => getVietnamTimeParts(new Date()).minute
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [recordingMode, setRecordingMode] = useState<string>("cloud");

  // helper to quickly fill current time (+small offset to satisfy validation)
  const handleSetNow = () => {
    const now = new Date(Date.now() + MIN_FUTURE_OFFSET_MS * 2);
    const vietnamDateKey = toVietnamDateKey(now);
    const { hour, minute } = getVietnamTimeParts(now);
    if (vietnamDateKey) {
      setSelectedDate(parseVietnamDateKey(vietnamDateKey));
    }
    setSelectedHour(hour);
    setSelectedMinute(minute);
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
    if (!selectedDate) return undefined;
    const joinDate = buildJoinDateFromVietnamSelection(selectedDate, selectedHour, selectedMinute);
    return joinDate.toISOString();
  };

  // Format selected date/time for display
  const formatSelectedDateTime = (): string => {
    if (!selectedDate) return t("common.notSelectedYet");
    const joinDate = buildJoinDateFromVietnamSelection(selectedDate, selectedHour, selectedMinute);
    return formatDateTime(joinDate, t("common.notSelectedYet"));
  };

  // Validation
  const isDateTimeValid = (): boolean => {
    if (!selectedDate) return false;
    const joinDate = buildJoinDateFromVietnamSelection(selectedDate, selectedHour, selectedMinute);
    return joinDate.getTime() > Date.now() + MIN_FUTURE_OFFSET_MS;
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
              {/* Date Picker */}
              <div className="space-y-2">
                <div className="ju flex items-center">
                  <Label>{t("common.startDate")}</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal sm:w-[320px]",
                        !selectedDate && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? formatVietnamDateLabel(selectedDate)
                        : t("userMockinterview.selectDate")}
                    </Button>
                  </PopoverTrigger>
                  <Button variant="outline" size="sm" onClick={handleSetNow}>
                    {t("userMockinterview.now")}
                  </Button>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const todayKey = toVietnamDateKey(new Date());
                        if (!todayKey) {
                          return false;
                        }
                        const today = parseVietnamDateKey(todayKey);
                        today.setHours(0, 0, 0, 0);
                        const selected = new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate()
                        );
                        return selected < today;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label>{t("userMockinterview.startTime")}</Label>
                <div className="flex items-center gap-2">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder={t("userMockinterview.hour")} />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-lg font-bold">:</span>
                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder={t("general.minutes1")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {MINUTE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className={opt.is5Min ? "font-medium" : "text-slate-500"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Time Preview */}
              {selectedDate && (
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
              {selectedDate && !isDateTimeValid() && (
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
