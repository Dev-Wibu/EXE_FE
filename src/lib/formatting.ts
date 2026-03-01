import { format, parseISO } from "date-fns";

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return "—";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
}

export function formatShortCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount)) + " đ";
}

export function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case "deposit":
      return "Nạp tiền";
    case "payment":
      return "Thanh toán";
    case "refund":
      return "Hoàn tiền";
    default:
      return type;
  }
}

export function getTransactionStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Hoàn thành";
    case "pending":
      return "Đang xử lý";
    case "failed":
      return "Thất bại";
    default:
      return status;
  }
}
