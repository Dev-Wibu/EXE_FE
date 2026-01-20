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

import type { User } from "../types";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: () => void;
}

export function DeleteUserDialog({ isOpen, onOpenChange, user, onConfirm }: DeleteUserDialogProps) {
  const isCurrentlyActive = user?.isActive !== false;
  const actionTitle = isCurrentlyActive ? "Vô hiệu hóa" : "Kích hoạt";

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionTitle} Người Dùng</AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrentlyActive
              ? `Bạn có chắc chắn muốn vô hiệu hóa người dùng "${user?.name}"? Người dùng sẽ không thể truy cập hệ thống nữa.`
              : `Bạn có chắc chắn muốn kích hoạt người dùng "${user?.name}"? Người dùng sẽ có thể truy cập hệ thống trở lại.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              isCurrentlyActive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                : "bg-green-600 hover:bg-green-700 focus:ring-green-600"
            }>
            {actionTitle}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
