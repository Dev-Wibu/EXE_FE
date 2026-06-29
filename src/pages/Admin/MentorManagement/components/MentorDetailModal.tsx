import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatting";
import { Briefcase, Building2, Code, Hash, Mail, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Mentor } from "../types";

interface MentorDetailModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MentorDetailModal({ mentor, isOpen, onOpenChange }: MentorDetailModalProps) {
  const { t } = useTranslation();

  if (!mentor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">
            {t("common.userDetail") || "Mentor Detail"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <Avatar className="h-24 w-24 border-4 border-slate-100 shadow-sm dark:border-slate-800">
            <AvatarImage src={mentor.avatarUrl} alt={mentor.name} className="object-cover" />
            <AvatarFallback className="bg-orange-100 text-3xl text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              {mentor.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{mentor.name}</h3>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Badge variant="default" className="bg-orange-500 text-white hover:bg-orange-500">
                MENTOR
              </Badge>
              <Badge variant={mentor.active !== false ? "default" : "destructive"}>
                {mentor.active !== false ? t("common.active") : t("common.inactive")}
              </Badge>
            </div>
            {mentor.currentCompany && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                at {mentor.currentCompany}
              </p>
            )}
          </div>

          <div className="w-full space-y-4">
            {/* Basic Info */}
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Hash className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                    {t("common.id")}
                  </span>
                  <span className="font-medium">{mentor.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Mail className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                    {t("common.email")}
                  </span>
                  <span className="truncate font-medium">{mentor.email}</span>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Briefcase className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                    {t("common.experience")}
                  </span>
                  <span className="font-medium">
                    {mentor.yearsOfExperience || 0} {t("common.year")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Building2 className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                    {t("common.company")}
                  </span>
                  <span className="font-medium">{mentor.currentCompany || "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Code className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                    {t("common.expertise")}
                  </span>
                  <span className="font-medium">{mentor.expertise || "-"}</span>
                </div>
              </div>
            </div>

            {/* Platform Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                <MessageCircle className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                    {t("adminMentormanagement.numberOfSessions")}
                  </span>
                  <span className="font-medium">{mentor.totalSession || 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                <div className="flex h-5 w-5 items-center justify-center font-serif text-lg font-bold text-slate-400">
                  $
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                    {t("adminMentormanagement.priceMin")}
                  </span>
                  <span className="font-medium">
                    {typeof mentor.pricePerMinute === "number" && mentor.pricePerMinute > 0
                      ? formatCurrency(mentor.pricePerMinute)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {mentor.bio && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <span className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                  {t("adminMentormanagement.bio") || "Bio"}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{mentor.bio}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
