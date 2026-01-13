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

import type { QuestionCategory } from "../types";

interface DeleteQuestionCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: QuestionCategory | null;
  onConfirm: () => void;
}

export function DeleteQuestionCategoryDialog({
  isOpen,
  onOpenChange,
  category,
  onConfirm,
}: DeleteQuestionCategoryDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Question Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete category &quot;{category?.categoryName}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
