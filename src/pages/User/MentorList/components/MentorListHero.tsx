import { Badge } from "@/components/ui/badge";
import { Briefcase, Filter, Sparkles, Users } from "lucide-react";

interface MentorListHeroProps {
  totalMentors: number;
  totalCompanies: number;
  totalExpertise: number;
}

export function MentorListHero({
  totalMentors,
  totalCompanies,
  totalExpertise,
}: MentorListHeroProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge className="rounded-full border border-blue-200 bg-blue-100 px-4 py-1 text-[11px] font-bold tracking-[0.14em] text-blue-700 uppercase dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Mạng lưới mentor tuyển chọn
        </Badge>

        <Badge
          variant="secondary"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Users className="mr-1 h-3.5 w-3.5" />
          {totalMentors} Mentor
        </Badge>

        <Badge
          variant="secondary"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Briefcase className="mr-1 h-3.5 w-3.5" />
          {totalCompanies} công ty
        </Badge>

        <Badge
          variant="secondary"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Filter className="mr-1 h-3.5 w-3.5" />
          {totalExpertise} nhóm chuyên môn
        </Badge>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl md:leading-[1.05] dark:text-white">
          Tìm Mentor phù hợp để bứt tốc sự nghiệp
        </h1>
        <p className="max-w-3xl text-sm font-medium text-slate-600 md:text-base dark:text-slate-400">
          Khám phá hồ sơ chuyên sâu, so sánh phong cách cố vấn và chọn mentor phù hợp với mục tiêu
          phỏng vấn của bạn.
        </p>
      </div>
    </header>
  );
}
