import { Award, ExternalLink, FileText } from "lucide-react";
import { useState } from "react";

import { MediaLightboxDialog, type MediaViewerItem } from "@/components/shared";
import { Label } from "@/components/ui/label";
import { inferFileKind, openUrlInNewTab } from "@/lib/media-file-utils";

import type { MentorProfileData } from "./types";

interface MentorDocumentsSectionProps {
  mentorProfile: MentorProfileData;
}

export function MentorDocumentsSection({ mentorProfile }: MentorDocumentsSectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaViewerItem[]>([]);

  const handleOpenDocument = (label: string, url: string) => {
    const kind = inferFileKind({ fileName: url });
    if (kind === "other") {
      openUrlInNewTab(url);
      return;
    }

    setViewerItems([
      {
        id: `mentor-doc-${label}`,
        name: label,
        src: url,
        kind,
        requireAuth: true,
      },
    ]);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          Giấy tờ đã nộp
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {/* Identity Document */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <FileText className="h-5 w-5 text-rose-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">CCCD/CMND</Label>
              {mentorProfile.identityImg ? (
                <button
                  type="button"
                  onClick={() => handleOpenDocument("CCCD/CMND", mentorProfile.identityImg || "")}
                  className="flex items-center gap-2 bg-transparent p-0 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Xem file
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
              )}
            </div>
          </div>

          {/* Degree Document */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                Bằng cấp/Chứng chỉ
              </Label>
              {mentorProfile.degreeImg ? (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenDocument("Bằng cấp/Chứng chỉ", mentorProfile.degreeImg || "")
                  }
                  className="flex items-center gap-2 bg-transparent p-0 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Xem file
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
              )}
            </div>
          </div>

          {/* Other File */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <FileText className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">Tài liệu khác</Label>
              {mentorProfile.otherFile ? (
                <button
                  type="button"
                  onClick={() => handleOpenDocument("Tài liệu khác", mentorProfile.otherFile || "")}
                  className="flex items-center gap-2 bg-transparent p-0 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Xem file
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <MediaLightboxDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        items={viewerItems}
        initialIndex={0}
      />
    </>
  );
}
