/**
 * MentorReviewForm Component
 * Form for creating/editing mentor reviews with STAR method
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import type { MentorReview } from "@/services/mentor-review.manager";

const reviewSchema = z.object({
  rating: z.number().min(1, "Vui lòng chọn số sao").max(5),
  situationNote: z.string().optional(),
  taskNote: z.string().optional(),
  actionNote: z.string().optional(),
  resultNote: z.string().optional(),
  strength: z.string().optional(),
  weakness: z.string().optional(),
  improve: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface MentorReviewFormProps {
  sessionId: number;
  mentorId: number;
  userId: number;
  existingReview?: MentorReview;
  onSubmit: (
    data: ReviewFormData & { sessionId: number; mentorId: number; userId: number }
  ) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function MentorReviewForm({
  sessionId,
  mentorId,
  userId,
  existingReview,
  onSubmit,
  onCancel,
  isLoading = false,
}: MentorReviewFormProps) {
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      situationNote: existingReview?.situationNote || "",
      taskNote: existingReview?.taskNote || "",
      actionNote: existingReview?.actionNote || "",
      resultNote: existingReview?.resultNote || "",
      strength: existingReview?.strength || "",
      weakness: existingReview?.weakness || "",
      improve: existingReview?.improve || "",
    },
  });

  const handleSubmit = (data: ReviewFormData) => {
    onSubmit({
      ...data,
      sessionId,
      mentorId,
      userId,
    });
  };

  const isEdit = !!existingReview;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đánh giá tổng thể *</FormLabel>
              <FormControl>
                <StarRating value={field.value} onChange={field.onChange} size="lg" />
              </FormControl>
              <FormDescription>Chọn số sao để đánh giá mentor (1-5 sao)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* STAR Method Section */}
        <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Phương pháp STAR (Tùy chọn)
          </h3>
          <p className="text-sm text-slate-500">
            Mô tả chi tiết trải nghiệm phỏng vấn của bạn theo phương pháp STAR
          </p>

          <FormField
            control={form.control}
            name="situationNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tình huống (Situation)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Mô tả tình huống phỏng vấn..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taskNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nhiệm vụ (Task)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nhiệm vụ bạn được yêu cầu thực hiện..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actionNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hành động (Action)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Cách bạn thực hiện và hành động của mentor..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="resultNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kết quả (Result)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Kết quả và bài học rút ra..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Notes Section */}
        <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Nhận xét thêm (Tùy chọn)
          </h3>

          <FormField
            control={form.control}
            name="strength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Điểm mạnh của Mentor</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Những điểm mạnh bạn nhận thấy ở mentor..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weakness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Điểm cần cải thiện</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Những điểm mentor có thể cải thiện..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="improve"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Đề xuất cải thiện</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Đề xuất của bạn để cải thiện trải nghiệm..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Cập nhật đánh giá" : "Gửi đánh giá"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
