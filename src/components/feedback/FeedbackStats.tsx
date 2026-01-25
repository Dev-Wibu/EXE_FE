/**
 * FeedbackStats Component
 * Displays feedback statistics
 */

import { MessageSquare, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "@/components/ui/star-rating";
import { calculateAverageFeedbackRating } from "@/hooks/useMentorFeedback";
import { cn } from "@/lib/utils";
import type { MentorFeedback } from "@/services/mentor-feedback.manager";

interface FeedbackStatsProps {
  feedbacks: MentorFeedback[];
  showDistribution?: boolean;
  compact?: boolean;
  className?: string;
}

export function FeedbackStats({
  feedbacks,
  showDistribution = true,
  compact = false,
  className,
}: FeedbackStatsProps) {
  const totalFeedbacks = feedbacks.length;
  const averageRating = calculateAverageFeedbackRating(feedbacks);

  // Calculate rating distribution
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: feedbacks.filter((f) => f.rating === rating).length,
    percentage:
      totalFeedbacks > 0
        ? (feedbacks.filter((f) => f.rating === rating).length / totalFeedbacks) * 100
        : 0,
  }));

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-slate-500">({totalFeedbacks} phản hồi)</span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Thống Kê Phản Hồi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center rounded-lg bg-emerald-50 p-4 sm:min-w-[150px] dark:bg-emerald-900/20">
            <span className="text-4xl font-bold text-emerald-600">{averageRating.toFixed(1)}</span>
            <StarRating value={averageRating} readOnly size="sm" className="mt-2" />
            <span className="mt-1 text-sm text-slate-500">{totalFeedbacks} phản hồi</span>
          </div>

          {/* Distribution */}
          {showDistribution && (
            <div className="flex-1 space-y-2">
              {distribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {rating} ★
                  </span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="w-8 text-right text-sm text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
