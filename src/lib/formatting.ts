import { format, parseISO } from "date-fns";

// Backend trả về timestamp không có suffix timezone ('T06:26:00' thay vì 'T06:26:00Z')
// Nếu không có offset, 'parseISO' sẽ hiểu là giờ địa phương thay vì UTC — dẫn đến hiển thị sai 7 tiếng
const toUtc = (s: string) => (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + "Z");

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(toUtc(dateStr)), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(toUtc(dateStr)), "dd/MM/yyyy HH:mm");
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
      return "Rút tiền";
    case "unknown":
      return "Không xác định";
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
