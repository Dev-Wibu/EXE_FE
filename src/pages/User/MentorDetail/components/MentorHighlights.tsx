import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, GaugeCircle, Sparkles } from "lucide-react";

interface MentorHighlightsProps {
  highlights: string[];
  slaEstimate: string;
}

export function MentorHighlights({ highlights, slaEstimate }: MentorHighlightsProps) {
  return (
    <Card className="space-y-4 border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Điểm mạnh nổi bật</h2>
        <Badge className="rounded-full border border-emerald-300/40 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          <GaugeCircle className="mr-1 h-3.5 w-3.5" />
          {slaEstimate}
        </Badge>
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

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
        <p className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-300">
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
          Thông tin SLA là ước lượng dựa trên dữ liệu hoạt động gần nhất.
        </p>
      </div>
    </Card>
  );
}
