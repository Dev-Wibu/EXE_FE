import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { QuestionSet } from "../types";

interface DeleteQuestionSetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionSet: QuestionSet | null;
  onConfirm: () => void;
}

export function DeleteQuestionSetDialog({
  isOpen,
  onOpenChange,
  questionSet,
  onConfirm,
}: DeleteQuestionSetDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa Bộ Câu Hỏi</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa bộ câu hỏi &quot;{questionSet?.practiceSetName}&quot;? Hành
            động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
