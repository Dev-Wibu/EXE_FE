import { CreditCard, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/formatting";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export type PaymentMethod = "payos" | "wallet";

const parsePaymentMethod = (value: string): PaymentMethod | null => {
  if (value === "wallet" || value === "payos") {
    return value;
  }

  return null;
};

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  title: string;
  description?: string;
  amount: number;
  walletBalance?: number;
  defaultMethod?: PaymentMethod;
  isSubmitting?: boolean;
  onConfirm: (_method: PaymentMethod) => void | Promise<void>;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  title,
  description,
  amount,
  walletBalance,
  defaultMethod,
  isSubmitting = false,
  onConfirm,
}: PaymentMethodDialogProps) {
  const hasWalletBalance = typeof walletBalance === "number" && Number.isFinite(walletBalance);
  const normalizedWalletBalance = hasWalletBalance ? Math.max(walletBalance || 0, 0) : 0;
  const isWalletAvailable = hasWalletBalance && normalizedWalletBalance >= amount;

  const resolvedDefaultMethod = useMemo<PaymentMethod>(() => {
    if (defaultMethod === "wallet" && isWalletAvailable) {
      return "wallet";
    }

    if (defaultMethod === "payos") {
      return "payos";
    }

    return isWalletAvailable ? "wallet" : "payos";
  }, [defaultMethod, isWalletAvailable]);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(resolvedDefaultMethod);
  const effectiveSelectedMethod =
    selectedMethod === "wallet" && !isWalletAvailable ? "payos" : selectedMethod;

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedMethod(resolvedDefaultMethod);
    }

    onOpenChange(nextOpen);
  };

  const handleMethodChange = (value: string) => {
    const parsedValue = parsePaymentMethod(value);
    if (!parsedValue) {
      return;
    }

    setSelectedMethod(parsedValue === "wallet" && !isWalletAvailable ? "payos" : parsedValue);
  };

  const handleConfirm = () => {
    const methodToConfirm = effectiveSelectedMethod;
    setSelectedMethod(resolvedDefaultMethod);
    void onConfirm(methodToConfirm);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || "Chọn một phương thức thanh toán phù hợp trước khi tiếp tục."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Số tiền cần thanh toán</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(amount)}
            </p>
          </div>

          <RadioGroup
            value={effectiveSelectedMethod}
            onValueChange={handleMethodChange}
            className="gap-3">
            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-700">
              <RadioGroupItem value="wallet" disabled={!isWalletAvailable || isSubmitting} />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  <Wallet className="h-4 w-4" />
                  Thanh toán bằng ví
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Số dư hiện tại: {formatCurrency(normalizedWalletBalance)}
                </p>
                {!isWalletAvailable && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Số dư ví không đủ cho giao dịch này.
                  </p>
                )}
              </div>
            </Label>

            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-700">
              <RadioGroupItem value="payos" disabled={isSubmitting} />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  <CreditCard className="h-4 w-4" />
                  Thanh toán qua PayOS
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chuyển sang cổng thanh toán bảo mật để hoàn tất giao dịch.
                </p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
            disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
