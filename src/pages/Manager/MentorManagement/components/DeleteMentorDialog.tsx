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
  const isActive = mentor?.active !== false;
  const action = isActive ? "vô hiệu hóa" : "kích hoạt";
  const actionTitle = isActive ? "Vô hiệu hóa Mentor" : "Kích hoạt Mentor";
  const actionDescription = isActive
    ? `Bạn có chắc chắn muốn vô hiệu hóa mentor "${mentor?.name}"? Mentor sẽ không thể thực hiện các buổi phỏng vấn mới.`
    : `Bạn có chắc chắn muốn kích hoạt lại mentor "${mentor?.name}"? Mentor sẽ có thể thực hiện các buổi phỏng vấn mới.`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionTitle}</AlertDialogTitle>
          <AlertDialogDescription>{actionDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              isActive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                : "bg-green-600 hover:bg-green-700 focus:ring-green-600"
            }>
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
