import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Banknote,
  CheckCircle2,
  GaugeCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
interface MentorHighlightsProps {
  highlights: string[];
  slaEstimate: string;
  ratingText: string;
  totalSessions: number;
  priceText: string;
  verificationTags: string[];
  expertiseTags: string[];
}
export function MentorHighlights({
  highlights,
  slaEstimate,
  ratingText,
  totalSessions,
  priceText,
  verificationTags,
  expertiseTags,
}: MentorHighlightsProps) {
  const { t } = useTranslation();
  return (
    <Card className="space-y-4 border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t("userMentordetail.outstandingStrengths")}
        </h2>
        <Badge className="rounded-full border border-emerald-300/40 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          <GaugeCircle className="mr-1 h-3.5 w-3.5" />
          {slaEstimate}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="flex items-center text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            <Banknote className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
            {t("userMentordetail.consultingPrice")}
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{priceText}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="flex items-center text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            <Star className="mr-1.5 h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
            {t("common.evaluate")}
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{ratingText}/5.0</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="flex items-center text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            <Users className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-cyan-300" />
            {t("userMentordetail.sessionHasAccompanied")}
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            {totalSessions} {t("common.session1")}
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {highlights.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-cyan-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {expertiseTags.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            <Tag className="mr-1.5 h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
            {t("userMentordetail.professionalGroup")}
          </p>
          <div className="flex flex-wrap gap-2">
            {expertiseTags.map((tag) => (
              <Badge
                key={tag}
                className="rounded-full border border-indigo-300/40 bg-indigo-50 px-2.5 py-0.5 text-[11px] text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="flex items-center text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-cyan-600 dark:text-cyan-200" />
          {t("userMentordetail.verificationStatus")}
        </p>
        <div className="flex flex-wrap gap-2">
          {verificationTags.map((tag) => (
            <Badge
              key={tag}
              className="rounded-full border border-cyan-300/40 bg-cyan-50 px-2.5 py-0.5 text-[11px] text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
        <p className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-300">
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
          {t("userMentordetail.slaInformationIsAnEstimate")}
        </p>
      </div>
    </Card>
  );
}
