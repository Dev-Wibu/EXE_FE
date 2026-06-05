import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import { ArrowUpRight, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
interface SimilarMentorsProps {
  mentors: SchemaMentorResponse[];
  onViewProfile: (_mentor: SchemaMentorResponse) => void;
}
export function SimilarMentors({ mentors, onViewProfile }: SimilarMentorsProps) {
  const { t } = useTranslation();
  const activeMentors = mentors.filter((mentor) => mentor.active === true);
  if (activeMentors.length === 0) {
    return (
      <Card className="border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t("userMentordetail.similarMentors")}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("userMentordetail.thereIsCurrentlyNotEnough")}
        </p>
      </Card>
    );
  }
  return (
    <Card className="space-y-4 border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {t("userMentordetail.similarMentors")}
      </h2>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {activeMentors.map((mentor, index) => (
          <div
            key={mentor.id ?? `${mentor.name ?? "mentor"}-${index}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border border-white shadow-sm dark:border-slate-700">
                <AvatarImage src={mentor.avatarUrl || ""} alt={mentor.name || t("common.mentor")} />
                <AvatarFallback className="bg-slate-200 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                  {mentor.name?.charAt(0) || "M"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {mentor.name || t("common.mentor")}
                </p>
                <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                  {mentor.expertise || t("common.professionalMentor")}
                </p>
                <Badge className="rounded-full border border-amber-300/40 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/15 dark:text-amber-200">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  {typeof mentor.averageRating === "number"
                    ? mentor.averageRating.toFixed(1)
                    : "0.0"}
                </Badge>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="mt-3 h-9 w-full bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
              onClick={() => onViewProfile(mentor)}>
              <ArrowUpRight className="mr-1.5 h-4 w-4" />
              {t("userMentordetail.viewProfile")}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
