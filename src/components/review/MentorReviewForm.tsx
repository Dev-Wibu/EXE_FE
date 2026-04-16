/**
 * MentorReviewForm Component
 * Form for creating/editing mentor reviews with STAR method
 */

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Spinner } from "@/components/ui/spinner";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import type { MentorReview } from "@/services/mentor-review.manager";

const reviewSchema = z
  .object({
    rating: z.number().min(0).max(5),
    situationNote: z.string().optional(),
    taskNote: z.string().optional(),
    actionNote: z.string().optional(),
    resultNote: z.string().optional(),
    strength: z.string().optional(),
    weakness: z.string().optional(),
    improve: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasRating = (value.rating || 0) > 0;
    const hasAnyNote = [
      value.situationNote,
      value.taskNote,
      value.actionNote,
      value.resultNote,
      value.strength,
      value.weakness,
      value.improve,
    ].some((note) => Boolean(note?.trim()));

    if (!hasRating && !hasAnyNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập ít nhất một nội dung đánh giá",
        path: ["rating"],
      });
    }
  });

type ReviewFormData = z.infer<typeof reviewSchema>;

interface MentorReviewFormProps {
  sessionId: number;
  mentorId: number;
  userId: number;
  existingReview?: MentorReview;
  onSubmit: (_data: {
    sessionId: number;
    mentorId: number;
    userId: number;
    rating?: number;
    situationNote?: string;
    taskNote?: string;
    actionNote?: string;
    resultNote?: string;
    strength?: string;
    weakness?: string;
    improve?: string;
  }) => void;
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

  const normalizeOptionalText = (value?: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  };

  const handleSubmit = (data: ReviewFormData) => {
    const normalizedRating = data.rating > 0 ? data.rating : undefined;

    onSubmit({
      sessionId,
      mentorId,
      userId,
      rating: normalizedRating,
      situationNote: normalizeOptionalText(data.situationNote),
      taskNote: normalizeOptionalText(data.taskNote),
      actionNote: normalizeOptionalText(data.actionNote),
      resultNote: normalizeOptionalText(data.resultNote),
      strength: normalizeOptionalText(data.strength),
      weakness: normalizeOptionalText(data.weakness),
      improve: normalizeOptionalText(data.improve),
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
              <FormLabel>Đánh giá tổng thể (tùy chọn)</FormLabel>
              <FormControl>
                <StarRating value={field.value} onChange={field.onChange} size="lg" />
              </FormControl>
              <FormDescription>
                Có thể chọn số sao hoặc điền ghi chú chi tiết, cần ít nhất một thông tin
              </FormDescription>
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
            Mô tả chi tiết đánh giá học viên của bạn theo phương pháp STAR
          </p>

          <FormField
            control={form.control}
            name="situationNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tình huống (Situation)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Mô tả bối cảnh của phiên phỏng vấn..."
                    className="min-h-20"
                    {...field}
                    value={field.value ?? ""}
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
                    placeholder="Nhiệm vụ học viên cần hoàn thành..."
                    className="min-h-20"
                    {...field}
                    value={field.value ?? ""}
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
                    placeholder="Các hành động học viên đã thực hiện trong phiên..."
                    className="min-h-20"
                    {...field}
                    value={field.value ?? ""}
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
                    placeholder="Kết quả học viên đạt được sau phiên phỏng vấn..."
                    className="min-h-20"
                    {...field}
                    value={field.value ?? ""}
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
                <FormLabel>Điểm mạnh của học viên</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Những điểm mạnh bạn nhận thấy ở học viên..."
                    className="min-h-[60px]"
                    {...field}
                    value={field.value ?? ""}
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
                    placeholder="Những điểm học viên có thể cải thiện..."
                    className="min-h-[60px]"
                    {...field}
                    value={field.value ?? ""}
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
                    placeholder="Đề xuất cụ thể của bạn để học viên cải thiện..."
                    className="min-h-[60px]"
                    {...field}
                    value={field.value ?? ""}
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
            {isLoading && <Spinner size="sm" tone="white" className="mr-2" />}
            {isEdit ? "Cập nhật đánh giá" : "Gửi đánh giá"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
