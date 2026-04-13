/**
 * FeedbackCard Component
 * Displays a single mentor feedback
 */

import { Calendar, Edit, MessageSquare, Trash2, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { TimeAgo } from "@/components/ui/time-ago";
import { cn } from "@/lib/utils";
import type { MentorFeedback } from "@/services/mentor-feedback.manager";

interface FeedbackCardProps {
  feedback: MentorFeedback;
  showMentor?: boolean;
  showUser?: boolean;
  showSession?: boolean;
  showActions?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function FeedbackCard({
  feedback,
  showMentor = true,
  showUser = false,
  showSession = true,
  showActions = false,
  onClick,
  onEdit,
  onDelete,
  className,
}: FeedbackCardProps) {
  const fallbackUserName = feedback.session?.userId
    ? `Học viên #${feedback.session.userId}`
    : "Học viên";
  const fallbackMentorName = feedback.session?.userId2
    ? `Mentor #${feedback.session.userId2}`
    : "Mentor";
  const displayName = showMentor
    ? feedback.mentor?.name || fallbackMentorName
    : showUser
      ? feedback.user?.name || fallbackUserName
      : "Ẩn danh";
  const occurredAt = feedback.session?.endTime1 || feedback.session?.startTime1;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden",
        onClick && "cursor-pointer transition-shadow hover:shadow-md",
        className
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={showMentor ? feedback.mentor?.avatarUrl : feedback.user?.avatarUrl}
                alt={displayName}
              />
              <AvatarFallback
                className={cn(
                  showMentor
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-[#0047AB]/10 text-[#0047AB]"
                )}>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {/* Name */}
              <p className="font-medium text-slate-900 dark:text-slate-100">{displayName}</p>

              {/* Meta info */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                {showSession && feedback.session?.roomName && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {feedback.session.roomName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col items-end gap-1">
            <StarRating value={feedback.rating || 0} readOnly size="sm" />
            {occurredAt && <TimeAgo date={occurredAt} className="text-xs" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Comment */}
        {feedback.comment ? (
          <div className="flex items-start gap-2">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {feedback.comment}
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500 italic">
            <MessageSquare className="h-4 w-4" />
            Không có nhận xét
          </p>
        )}

        {/* Actions */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}>
                <Edit className="mr-1 h-4 w-4" />
                Chỉnh sửa
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="mr-1 h-4 w-4" />
                Xóa
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
