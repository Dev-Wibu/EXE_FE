import { Button } from "@/components/ui/button";
import { Edit, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuestionBank } from "../types";

interface QuestionBankGridProps {
  questions: QuestionBank[];
  onEdit: (_question: QuestionBank) => void;
  onDelete: (_question: QuestionBank) => void;
}

export function QuestionBankGrid({ questions, onEdit, onDelete }: QuestionBankGridProps) {
  const { t } = useTranslation();

  if (questions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="text-muted-foreground/50 h-12 w-12" />
        <p className="text-muted-foreground text-lg font-medium">
          {t("common.noData", t("adminQuestionbankmanagement.noDataFound"))}
        </p>
      </div>
    );
  }

  const stripMarkdown = (text: string) => {
    if (!text) return "";
    return text.replace(/```\w*\n/g, "").replace(/```/g, "").trim();
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {questions.map((q) => (
        <div
          key={q.id}
          className="group relative flex h-[240px] flex-col overflow-hidden rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-950/50 dark:hover:border-slate-700 dark:hover:bg-slate-900/80">
          
          {/* Minimalist Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                #{q.id}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                {q.questionCategory?.categoryName || "Chưa phân loại"}
              </span>
            </div>
            
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${
              q.questionLevel === "EASY"
                ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                : q.questionLevel === "MEDIUM"
                  ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                  : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              <span className="text-[10px] font-bold tracking-widest uppercase">
                {q.questionLevel}
              </span>
            </div>
          </div>

          {/* Body */}
          <p className="flex-1 line-clamp-4 text-[15px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {stripMarkdown(q.questionText || "")}
          </p>

          {/* Hover-only Actions */}
          <div className="mt-5 flex items-center justify-end gap-1.5 border-t border-transparent pt-0 transition-all duration-300 group-hover:border-slate-100 group-hover:pt-4 dark:group-hover:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(q)}
              className="h-8 translate-y-2 rounded-lg opacity-0 transition-all duration-300 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              title={t("general.edit")}>
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              <span className="text-xs">{t("general.edit")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(q)}
              className="h-8 translate-y-2 rounded-lg border-rose-200 text-rose-600 opacity-0 transition-all duration-300 delay-75 hover:bg-rose-50 hover:text-rose-700 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
              title={t("general.delete")}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              <span className="text-xs">{t("general.delete")}</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
