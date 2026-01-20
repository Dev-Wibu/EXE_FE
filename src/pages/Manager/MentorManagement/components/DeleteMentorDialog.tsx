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

import type { Mentor } from "../types";

interface DeleteMentorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: Mentor | null;
  onConfirm: () => void;
}

export function DeleteMentorDialog({
  isOpen,
  onOpenChange,
  mentor,
  onConfirm,
}: DeleteMentorDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa Mentor</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa mentor &quot;{mentor?.name}&quot;? Hành động này không thể hoàn
            tác và sẽ vô hiệu hóa tài khoản mentor.
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
