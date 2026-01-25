/**
 * MentorFeedbackForm Component
 * Form for creating/editing mentor feedback
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
import type { MentorFeedback } from "@/services/mentor-feedback.manager";

const feedbackSchema = z.object({
  rating: z.number().min(1, "Vui lòng chọn số sao").max(5),
  comment: z.string().min(10, "Nhận xét phải có ít nhất 10 ký tự"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface MentorFeedbackFormProps {
  sessionId: number;
  mentorId: number;
  userId: number;
  existingFeedback?: MentorFeedback;
  onSubmit: (
    data: FeedbackFormData & { sessionId: number; mentorId: number; userId: number }
  ) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function MentorFeedbackForm({
  sessionId,
  mentorId,
  userId,
  existingFeedback,
  onSubmit,
  onCancel,
  isLoading = false,
}: MentorFeedbackFormProps) {
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: existingFeedback?.rating || 0,
      comment: existingFeedback?.comment || "",
    },
  });

  const handleSubmit = (data: FeedbackFormData) => {
    onSubmit({
      ...data,
      sessionId,
      mentorId,
      userId,
    });
  };

  const isEdit = !!existingFeedback;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đánh giá học viên *</FormLabel>
              <FormControl>
                <StarRating value={field.value} onChange={field.onChange} size="lg" />
              </FormControl>
              <FormDescription>
                Đánh giá hiệu suất của học viên trong buổi phỏng vấn (1-5 sao)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Comment */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nhận xét chi tiết *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Chia sẻ nhận xét của bạn về buổi phỏng vấn: điểm mạnh, điểm cần cải thiện, đề xuất..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Nhận xét chi tiết giúp học viên cải thiện kỹ năng phỏng vấn
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Cập nhật phản hồi" : "Gửi phản hồi"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
