import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Linkedin,
  Mail,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

interface MentorGridCardProps {
  mentor: SchemaMentorResponse;
  onStartChat: (_mentor: SchemaMentorResponse) => void;
  onViewProfile: (_mentor: SchemaMentorResponse) => void;
}

export function MentorGridCard({ mentor, onStartChat, onViewProfile }: MentorGridCardProps) {
  const averageRating = typeof mentor.averageRating === "number" ? mentor.averageRating : 0;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_45px_-24px_rgba(30,64,175,0.35)] dark:border-slate-800 dark:bg-slate-900/85">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-br from-blue-100/70 to-cyan-100/20 dark:from-blue-950/40 dark:to-slate-900" />
      <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-cyan-300/40 blur-2xl dark:bg-cyan-700/30" />

      <div className="relative flex h-full flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 rounded-2xl border-4 border-white shadow-md dark:border-slate-800">
                <AvatarImage src={mentor.avatarUrl || ""} alt={mentor.name || "Mentor"} />
                <AvatarFallback className="bg-slate-100 text-xl font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {mentor.name?.charAt(0) || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -right-2 -bottom-2 flex items-center gap-1 rounded-full border border-amber-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-600 shadow-sm dark:border-amber-900/50 dark:bg-slate-900 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {averageRating.toFixed(1)}
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <button
                type="button"
                className="max-w-full truncate text-left text-xl font-black tracking-tight text-slate-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                onClick={() => onViewProfile(mentor)}>
                {mentor.name || "Mentor chưa cập nhật tên"}
              </button>
              <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-indigo-500 uppercase">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {mentor.expertise || "Mentor chuyên nghiệp"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {mentor.linkedInUrl && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                onClick={() => window.open(mentor.linkedInUrl, "_blank")}>
                <Linkedin className="h-4 w-4" />
              </Button>
            )}

            {mentor.email && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                onClick={() => {
                  window.location.href = `mailto:${mentor.email}`;
                }}>
                <Mail className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Briefcase className="mr-1 h-3.5 w-3.5" />
            {mentor.currentCompany || "Freelance Mentor"}
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Users className="mr-1 h-3.5 w-3.5" />
            {mentor.totalSession || 0} phiên
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {mentor.yearsOfExperience || 0} năm
          </Badge>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {mentor.bio ||
            "Mentor sẵn sàng đồng hành để bạn luyện tập phỏng vấn thực tế, tối ưu câu trả lời và tăng tự tin khi ứng tuyển."}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button
            className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-3 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-cyan-700 sm:text-sm"
            onClick={() => onStartChat(mentor)}>
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Bắt đầu hội thoại
          </Button>

          <Button
            type="button"
            className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 sm:text-sm"
            onClick={() => onViewProfile(mentor)}>
            <ArrowUpRight className="mr-1.5 h-4 w-4" />
            Xem hồ sơ chi tiết
          </Button>
        </div>
      </div>
    </Card>
  );
}
