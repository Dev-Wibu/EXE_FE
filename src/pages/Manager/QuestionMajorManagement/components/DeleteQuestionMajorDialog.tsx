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

import type { Major } from "../types";

interface DeleteQuestionMajorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  major: Major | null;
  onConfirm: () => void;
}

export function DeleteQuestionMajorDialog({
  isOpen,
  onOpenChange,
  major,
  onConfirm,
}: DeleteQuestionMajorDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa Chuyên Ngành</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa chuyên ngành &quot;{major?.majorName}&quot;? Hành động này
            không thể hoàn tác.
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
