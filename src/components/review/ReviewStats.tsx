/**
 * ReviewStats Component
 * Displays review statistics (average rating, count, distribution)
 */

import { Star, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "@/components/ui/star-rating";
import { calculateAverageRating } from "@/hooks/useMentorReview";
import { cn } from "@/lib/utils";
import type { MentorReview } from "@/services/mentor-review.manager";

interface ReviewStatsProps {
  reviews: MentorReview[];
  showDistribution?: boolean;
  compact?: boolean;
  className?: string;
}

export function ReviewStats({
  reviews,
  showDistribution = true,
  compact = false,
  className,
}: ReviewStatsProps) {
  const totalReviews = reviews.length;
  const averageRating = calculateAverageRating(reviews);

  // Calculate rating distribution
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      totalReviews > 0
        ? (reviews.filter((r) => r.rating === rating).length / totalReviews) * 100
        : 0,
  }));

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-[#FFD700] text-[#FFD700]" />
          <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-slate-500">({totalReviews} đánh giá)</span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-[#0047AB]" />
          Thống Kê Đánh Giá
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 p-4 sm:min-w-[150px] dark:bg-slate-800">
            <span className="text-4xl font-bold text-[#0047AB]">{averageRating.toFixed(1)}</span>
            <StarRating value={averageRating} readOnly size="sm" className="mt-2" />
            <span className="mt-1 text-sm text-slate-500">{totalReviews} đánh giá</span>
          </div>

          {/* Distribution */}
          {showDistribution && (
            <div className="flex-1 space-y-2">
              {distribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {rating} <Star className="inline h-3 w-3 text-[#FFD700]" />
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
