import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import { ArrowLeft, Briefcase, Sparkles, Star, Users } from "lucide-react";

interface MentorDetailHeroProps {
  mentor: SchemaMentorResponse;
  ratingText: string;
  onBack: () => void;
}

export function MentorDetailHero({ mentor, ratingText, onBack }: MentorDetailHeroProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:p-5 dark:border-slate-700/70 dark:bg-slate-900/55">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách Mentor
        </Button>

        <Badge className="rounded-full border border-cyan-300/40 bg-cyan-50 px-4 py-1 text-[11px] font-semibold tracking-[0.12em] text-cyan-700 uppercase dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-200">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Hồ sơ mentor chuyên sâu
        </Badge>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg dark:border-slate-800">
          <AvatarImage src={mentor.avatarUrl || ""} alt={mentor.name || "Mentor"} />
          <AvatarFallback className="bg-slate-100 text-3xl font-black text-slate-500 dark:bg-slate-800 dark:text-cyan-100">
            {mentor.name?.charAt(0) || "M"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-white">
              {mentor.name || "Mentor"}
            </h1>
            <p className="mt-1 text-sm font-semibold tracking-wider text-blue-700 uppercase dark:text-cyan-200">
              {mentor.expertise || "Chuyên môn chưa cập nhật"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Briefcase className="mr-1 h-3.5 w-3.5" />
              {mentor.currentCompany || "Freelance Mentor"}
            </Badge>
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Users className="mr-1 h-3.5 w-3.5" />
              {mentor.totalSession || 0} phiên
            </Badge>
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              {mentor.yearsOfExperience || 0} năm kinh nghiệm
            </Badge>
            <Badge className="rounded-full border border-amber-300/40 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/15 dark:text-amber-200">
              <Star className="mr-1 h-3.5 w-3.5 fill-current" />
              {ratingText}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
