import { ArrowLeft, CheckCircle2, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function InterviewHeader({
  phaseName,
  questionIndex,
  totalQuestions,
  finished,
  onBack,
}: {
  phaseName: string;
  questionIndex: number;
  totalQuestions: number;
  finished: boolean;
  onBack: () => void;
}) {
  const progress = totalQuestions > 0 ? (questionIndex / totalQuestions) * 100 : 0;

  return (
    <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80">
      <div className="flex items-center gap-3 px-6 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-lg font-bold">Phỏng vấn với AI</h1>
          <div className="flex items-center gap-2">
            {phaseName && (
              <Badge variant="secondary" className="text-xs">
                {phaseName}
              </Badge>
            )}
            {!finished && totalQuestions > 0 && (
              <span className="text-muted-foreground text-xs">
                Câu {questionIndex}/{totalQuestions}
              </span>
            )}
            {finished && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Hoàn thành
              </Badge>
            )}
          </div>
        </div>
      </div>
      {!finished && totalQuestions > 0 && (
        <Progress value={progress} className="h-1 rounded-none" />
      )}
    </div>
  );
}
