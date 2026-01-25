/**
 * FeedbackList Component
 * Displays a list of mentor feedbacks
 */

import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { cn } from "@/lib/utils";
import type { MentorFeedback } from "@/services/mentor-feedback.manager";
import { FeedbackCard } from "./FeedbackCard";

interface FeedbackListProps {
  feedbacks: MentorFeedback[];
  isLoading?: boolean;
  showMentor?: boolean;
  showUser?: boolean;
  showSession?: boolean;
  showActions?: boolean;
  onEdit?: (feedback: MentorFeedback) => void;
  onDelete?: (feedback: MentorFeedback) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function FeedbackList({
  feedbacks,
  isLoading,
  showMentor = true,
  showUser = false,
  showSession = true,
  showActions = false,
  onEdit,
  onDelete,
  emptyTitle = "Chưa có phản hồi",
  emptyDescription = "Chưa có phản hồi nào được gửi",
  className,
}: FeedbackListProps) {
  // Loading state
  if (isLoading) {
    return <LoadingCardList count={3} className={className} />;
  }

  // Empty state
  if (feedbacks.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {feedbacks.map((feedback) => (
        <FeedbackCard
          key={feedback.id}
          feedback={feedback}
          showMentor={showMentor}
          showUser={showUser}
          showSession={showSession}
          showActions={showActions}
          onEdit={onEdit ? () => onEdit(feedback) : undefined}
          onDelete={onDelete ? () => onDelete(feedback) : undefined}
        />
      ))}
    </div>
  );
}
