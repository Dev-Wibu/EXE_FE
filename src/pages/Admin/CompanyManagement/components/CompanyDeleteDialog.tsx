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

import type { Company } from "../types";

interface CompanyDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onConfirm: () => void;
}

const isCompanyActive = (company?: Company | null) =>
  (company?.status ?? "ACTIVE").toUpperCase() !== "INACTIVE";

export function CompanyDeleteDialog({
  isOpen,
  onOpenChange,
  company,
  onConfirm,
}: CompanyDeleteDialogProps) {
  const active = isCompanyActive(company);
  const actionTitle = active ? "Vô hiệu hóa" : "Kích hoạt";

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionTitle} Công Ty</AlertDialogTitle>
          <AlertDialogDescription>
            {active
              ? `Bạn có chắc chắn muốn vô hiệu hóa công ty "${company?.name}"? Công ty sẽ không còn hoạt động trong hệ thống.`
              : `Bạn có chắc chắn muốn kích hoạt công ty "${company?.name}"? Công ty sẽ hoạt động trở lại.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              active
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
