// Mock data for payment simulation
export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
  balance?: number;
  selected?: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  payerName: string;
  timestamp: string;
}

// Mock payment methods
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "wallet",
    name: "Ví INTELITE",
    icon: "wallet",
    balance: 1500000,
    selected: true,
  },
  {
    id: "bank",
    name: "Chuyển khoản ngân hàng",
    icon: "bank",
    description: "Chuyển khoản qua VietQR hoặc số tài khoản",
  },
  {
    id: "card",
    name: "Thẻ tín dụng/Ghi nợ",
    icon: "credit-card",
    description: "Visa, Mastercard, JCB",
  },
  {
    id: "momo",
    name: "Ví MoMo",
    icon: "momo",
    description: "Thanh toán qua ví điện tử MoMo",
  },
];

// Simulate payment processing
export const simulatePayment = async (amount: number, method: string): Promise<PaymentResult> => {
  // Simulate payment processing time (2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate transaction ID
  const transactionId = Math.random().toString(36).substring(2, 14).toUpperCase();

  // Get payment method name
  const paymentMethodInfo = mockPaymentMethods.find((m) => m.id === method);
  const paymentMethodName = paymentMethodInfo?.name || method;

  return {
    success: true,
    transactionId: transactionId,
    amount: amount,
    paymentMethod: paymentMethodName,
    payerName: "Thu Hà",
    timestamp: new Date().toISOString(),
  };
};

// Format currency to Vietnamese format
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
};

// Format short currency (without VNĐ)
export const formatShortCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount)) + " đ";
};

// Get transaction type label in Vietnamese
export const getTransactionTypeLabel = (type: string): string => {
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
};

// Get transaction status label in Vietnamese
export const getTransactionStatusLabel = (status: string): string => {
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
};
