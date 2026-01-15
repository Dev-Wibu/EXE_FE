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
  const actionTitle = isCurrentlyActive ? "Deactivate" : "Activate";

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionTitle} User</AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrentlyActive
              ? `Are you sure you want to deactivate user "${user?.name}"? The user will no longer be able to access the system.`
              : `Are you sure you want to activate user "${user?.name}"? The user will regain access to the system.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
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
