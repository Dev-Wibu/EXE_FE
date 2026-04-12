import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import { CalendarCheck2, ExternalLink, Linkedin, Mail, MessageSquare } from "lucide-react";

interface MentorActionPanelProps {
  mentor: SchemaMentorResponse;
  onBookNow: () => void;
  onStartChat: () => void;
}

export function MentorActionPanel({ mentor, onBookNow, onStartChat }: MentorActionPanelProps) {
  return (
    <Card className="h-fit border-slate-200 bg-white/90 p-5 shadow-sm xl:sticky xl:top-6 dark:border-slate-700/70 dark:bg-slate-900/70">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hành động nhanh</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Chọn cách tương tác phù hợp để bắt đầu lộ trình luyện phỏng vấn cùng mentor.
      </p>

      <div className="mt-5 space-y-3">
        <Button
          type="button"
          className="h-11 w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white hover:from-cyan-600 hover:to-blue-700"
          onClick={onBookNow}>
          <CalendarCheck2 className="mr-2 h-4 w-4" />
          Đặt lịch ngay
        </Button>

        <Button
          type="button"
          className="h-11 w-full bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white hover:from-indigo-700 hover:to-violet-700"
          onClick={onStartChat}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Bắt đầu hội thoại
        </Button>
      </div>

      <div className="my-5 border-t border-slate-200 dark:border-slate-700" />

      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        {mentor.email && (
          <a
            href={`mailto:${mentor.email}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500">
            <span className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-200" />
              Email liên hệ
            </span>
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </a>
        )}

        {mentor.linkedInUrl && (
          <a
            href={mentor.linkedInUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500">
            <span className="flex items-center">
              <Linkedin className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-200" />
              Hồ sơ LinkedIn
            </span>
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </a>
        )}
      </div>
    </Card>
  );
}
