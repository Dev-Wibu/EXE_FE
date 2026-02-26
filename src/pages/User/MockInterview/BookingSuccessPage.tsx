/**
 * BookingSuccessPage
 * Shown after user successfully submits a session booking request (DRAFT).
 * Receives mentor name and joinTime via React Router location state.
 */

import { ArrowRight, Calendar, CheckCircle, Clock, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingState {
  mentorName?: string;
  joinTime?: string;
}

export function BookingSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as BookingState) || {};

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <CheckCircle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Yêu cầu đã được gửi!</CardTitle>
          <CardDescription className="text-base">
            Phiên phỏng vấn của bạn đang chờ Staff/Admin xét duyệt. Bạn sẽ có thể vào phòng sau khi
            được duyệt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking details */}
          {(state.mentorName || state.joinTime) && (
            <div className="mx-auto max-w-xs space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm dark:border-amber-900 dark:bg-amber-950/20">
              {state.mentorName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" />
                  <span className="text-slate-600 dark:text-slate-400">Mentor:</span>
                  <span className="font-medium">{state.mentorName}</span>
                </div>
              )}
              {state.joinTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="text-slate-600 dark:text-slate-400">Thời gian:</span>
                  <span className="font-medium">{state.joinTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Status info */}
          <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span>Trạng thái: Đang chờ xét duyệt</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate("/dashboard/mock-interview/history")}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              <ArrowRight className="h-4 w-4" />
              Xem lịch sử phỏng vấn
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard/mock-interview")}>
              Về trang chính
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
