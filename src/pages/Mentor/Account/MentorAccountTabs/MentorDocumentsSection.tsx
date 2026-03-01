import { Award, ExternalLink, FileText } from "lucide-react";

import { Label } from "@/components/ui/label";

import type { MentorProfileData } from "./types";

interface MentorDocumentsSectionProps {
  mentorProfile: MentorProfileData;
}

export function MentorDocumentsSection({ mentorProfile }: MentorDocumentsSectionProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
      <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
        Giấy tờ đã nộp
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Identity Document */}
        <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <FileText className="h-5 w-5 text-rose-500" />
          </div>
          <div className="flex-1">
            <Label className="text-sm text-gray-500 dark:text-slate-400">CCCD/CMND</Label>
            {mentorProfile.identityImg ? (
              <a
                href={mentorProfile.identityImg}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Xem file
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
            )}
          </div>
        </div>

        {/* Degree Document */}
        <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Award className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <Label className="text-sm text-gray-500 dark:text-slate-400">Bằng cấp/Chứng chỉ</Label>
            {mentorProfile.degreeImg ? (
              <a
                href={mentorProfile.degreeImg}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Xem file
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
            )}
          </div>
        </div>

        {/* Other File */}
        <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
            <FileText className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <Label className="text-sm text-gray-500 dark:text-slate-400">Tài liệu khác</Label>
            {mentorProfile.otherFile ? (
              <a
                href={mentorProfile.otherFile}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Xem file
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
