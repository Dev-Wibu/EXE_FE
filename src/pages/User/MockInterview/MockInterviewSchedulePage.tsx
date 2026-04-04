/**
 * MockInterviewSchedulePage.tsx
 * Redesigned "Schedule a New Interview" page
 * Steps: Select Mentor → Choose Date/Time (joinTime) → Review & Create
 *
 * BE requirement: User chooses a date/time for meeting start (joinTime). exp defaults to 0.
 */

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
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { cn, formatToVietnamISOString } from "@/lib/utils";

import { useMentors } from "@/hooks/useMentor";
import { useCreateSession } from "@/hooks/useSession";
import { useAuthStore } from "@/stores/authStore";

// Step definitions
const STEPS = [
  { id: 1, label: "Chọn Mentor", icon: Users },
  { id: 2, label: "Chọn thời gian", icon: CalendarIcon },
  { id: 3, label: "Xác nhận", icon: Check },
] as const;

// Time options for the select dropdown
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

// All 60 minutes for full flexibility; 5-minute intervals are highlighted
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
  is5Min: i % 5 === 0,
}));

// Minimum time offset in milliseconds (1 minute)
const MIN_FUTURE_OFFSET_MS = 60 * 1000;

export function MockInterviewSchedulePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: mentors = [], isLoading } = useMentors();
  const createSession = useCreateSession();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Mentor selection
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 2: Date/Time selection - preset current time
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState(() =>
    String(new Date().getHours()).padStart(2, "0")
  );
  const [selectedMinute, setSelectedMinute] = useState(() =>
    String(new Date().getMinutes()).padStart(2, "0")
  );
  const [recordingMode, setRecordingMode] = useState<string>("cloud");

  // helper to quickly fill current time (+small offset to satisfy validation)
  const handleSetNow = () => {
    const now = new Date(Date.now() + MIN_FUTURE_OFFSET_MS * 2);
    setSelectedDate(now);
    setSelectedHour(String(now.getHours()).padStart(2, "0"));
    setSelectedMinute(String(now.getMinutes()).padStart(2, "0"));
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

  // Calculate joinTime in Vietnam timezone (+07:00)
  const calculateJoinTime = (): string | undefined => {
    if (!selectedDate) return undefined;
    const joinDate = new Date(selectedDate);
    joinDate.setHours(Number(selectedHour), Number(selectedMinute), 0, 0);
    return formatToVietnamISOString(joinDate);
  };

  // Format selected date/time for display
  const formatSelectedDateTime = (): string => {
    if (!selectedDate) return "Chưa chọn";
    const d = new Date(selectedDate);
    d.setHours(Number(selectedHour), Number(selectedMinute), 0, 0);
    return d.toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Validation
  const isDateTimeValid = (): boolean => {
    if (!selectedDate) return false;
    const joinDate = new Date(selectedDate);
    joinDate.setHours(Number(selectedHour), Number(selectedMinute), 0, 0);
    return joinDate.getTime() > Date.now() + MIN_FUTURE_OFFSET_MS;
  };

  const canProceedStep1 = selectedMentorId !== null;
  const canProceedStep2 = isDateTimeValid();

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
    setIsCreating(true);
    try {
      const joinTime = calculateJoinTime();
      await createSession.mutateAsync({
        userId: user.id,
        mentorId: selectedMentorId,
        joinTime,
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
          mentorName: selectedMentor?.name || "Mentor",
          joinTime: formatSelectedDateTime(),
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
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Đặt lịch phỏng vấn mới
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chọn mentor, thời gian và tạo phiên phỏng vấn
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
              placeholder="Tìm kiếm theo tên, chuyên môn..."
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
                  {searchQuery ? "Không tìm thấy mentor phù hợp" : "Chưa có mentor nào"}
                </p>
                <p className="mt-1 text-sm text-slate-400">Hãy thử tìm kiếm với từ khóa khác</p>
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
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-500">
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
                            <CardTitle className="text-base">{mentor.name || "Mentor"}</CardTitle>
                            <CardDescription>
                              {mentor.currentCompany || "Chuyên gia phỏng vấn"}
                            </CardDescription>
                          </div>
                        </div>
                        {isSelected && <Badge className="bg-[#0047AB] text-white">✓ Đã chọn</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {renderStars(mentor.averageRating ?? mentor.rate)}
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
                            <span>{mentor.totalSession} buổi phỏng vấn</span>
                          )}
                          {mentor.yearsOfExperience != null && (
                            <span>{mentor.yearsOfExperience} năm KN</span>
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
            <Button
              size="lg"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedStep1}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              Tiếp theo
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
                Chọn thời gian bắt đầu cuộc họp
              </CardTitle>
              <CardDescription>
                Chọn ngày và giờ bắt đầu cuộc phỏng vấn. Đây là thời gian cuộc họp sẽ bắt đầu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Picker */}
              <div className="space-y-2">
                <div className="ju flex items-center">
                  <Label>Ngày bắt đầu</Label>
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
                        ? selectedDate.toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <Button variant="outline" size="sm" onClick={handleSetNow}>
                    Bây giờ
                  </Button>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label>Giờ bắt đầu</Label>
                <div className="flex items-center gap-2">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Giờ" />
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
                      <SelectValue placeholder="Phút" />
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
                    <span>Thông tin thời gian</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                    <p>Bắt đầu lúc: {formatSelectedDateTime()}</p>
                  </div>
                </div>
              )}

              {/* Warning if date is in the past */}
              {selectedDate && !isDateTimeValid() && (
                <p className="text-sm text-red-500">
                  ⚠ Thời gian bắt đầu phải lớn hơn thời gian hiện tại ít nhất 1 phút.
                </p>
              )}

              {/* Recording mode */}
              <div className="space-y-2">
                <Label>Chế độ ghi hình</Label>
                <Select value={recordingMode} onValueChange={setRecordingMode}>
                  <SelectTrigger className="w-full sm:w-[320px]">
                    <SelectValue placeholder="Chọn chế độ ghi hình" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud">Cloud (đám mây)</SelectItem>
                    <SelectItem value="local">Local (máy tính)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <Button
              size="lg"
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedStep2}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              Tiếp theo
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
                Xác nhận thông tin phiên phỏng vấn
              </CardTitle>
              <CardDescription>
                Kiểm tra lại thông tin trước khi tạo phiên phỏng vấn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mentor Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase">
                  Mentor đã chọn
                </h3>
                {selectedMentor && (
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-500">
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
                      <p className="font-semibold">{selectedMentor.name || "Mentor"}</p>
                      <p className="text-sm text-slate-500">
                        {selectedMentor.currentCompany || "Chuyên gia phỏng vấn"}
                      </p>
                      {renderStars(selectedMentor.averageRating ?? selectedMentor.rate)}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Time Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase">
                  Thời gian phiên
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Bắt đầu lúc</p>
                      <p className="text-sm font-medium">{formatSelectedDateTime()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Room Config Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase">
                  Cấu hình phòng
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số người tham gia tối đa</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chia sẻ màn hình</span>
                    <span className="font-medium text-green-600">Bật</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ghi hình</span>
                    <span className="font-medium text-green-600">
                      {recordingMode === "cloud" ? "Cloud (đám mây)" : "Local (máy tính)"}
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
              Quay lại
            </Button>
            <Button
              size="lg"
              onClick={handleCreateSession}
              disabled={isCreating}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              <Video className="h-5 w-5" />
              {isCreating ? "Đang tạo..." : "Tạo phiên phỏng vấn"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
