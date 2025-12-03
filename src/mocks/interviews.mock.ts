// Mock data for AI Interview Module

export interface AIInterview {
  id: number;
  title: string;
  date: string;
  duration: number;
  interviewer: string;
  tags: string[];
  score: number;
  status: "completed" | "pending" | "in_progress";
}

export interface InterviewResult {
  id: number;
  title: string;
  overallScore: number;
  conclusion: string;
  strengths: string[];
  improvements: string[];
}

export interface PaymentInfo {
  interviewFee: number;
  serviceFee: number;
  total: number;
  walletBalance: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
  balance?: number;
  selected?: boolean;
}

export interface TransactionResult {
  success: boolean;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  payerName: string;
  timestamp: string;
}

// Mock AI Interviews data
export const mockAIInterviews: AIInterview[] = [
  {
    id: 1,
    title: "Phỏng vấn Backend Developer",
    date: "25/10/2025",
    duration: 45,
    interviewer: "AI Assistant",
    tags: ["Java", "Spring Boot", "Database"],
    score: 8.5,
    status: "completed",
  },
  {
    id: 2,
    title: "Phỏng vấn Frontend Developer",
    date: "23/10/2025",
    duration: 60,
    interviewer: "AI Assistant",
    tags: ["React", "TypeScript", "CSS"],
    score: 7.8,
    status: "completed",
  },
  {
    id: 3,
    title: "Phỏng vấn System Design",
    date: "20/10/2025",
    duration: 90,
    interviewer: "AI Assistant",
    tags: ["Microservices", "Scalability", "Architecture"],
    score: 9.2,
    status: "completed",
  },
];

// Mock Interview Result
export const mockInterviewResult: InterviewResult = {
  id: 1,
  title: "Phỏng vấn Kỹ sư Backend (Junior - Java)",
  overallScore: 8.5,
  conclusion:
    "Rất Tốt. Bạn thể hiện kiến thức vững chắc về Java Core và OOP. Cần cải thiện khả năng trả lời tình huống về Thread Safety và hiệu suất.",
  strengths: [
    "Hiểu rõ nguyên tắc OOP và SOLID.",
    "Trả lời chi tiết về Java Collections (ArrayList vs LinkedList).",
    "Phong thái chuyên nghiệp, ngôn ngữ rõ ràng.",
  ],
  improvements: [
    "Phần giải thích về Thread Safety còn chung chung.",
    "Thiếu ví dụ thực tế khi trả lời câu hỏi về Spring Transaction.",
    "Sử dụng thuật ngữ tiếng Anh chưa hoàn toàn chính xác.",
  ],
};

// Mock Payment Info
export const mockPaymentInfo: PaymentInfo = {
  interviewFee: 200000,
  serviceFee: 20000,
  total: 220000,
  walletBalance: 1500000,
};

// Mock Payment Methods
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "wallet",
    name: "Ví INTELITE",
    icon: "wallet",
    description: "Thanh toán nhanh chóng từ ví của bạn",
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
];

// Mock Interview Info for Payment Page
export const mockInterviewInfo = {
  date: "Thứ Sáu",
  fullDate: "28/10/2025",
  time: "14:00 - 14:30",
  duration: "60 phút",
  format: "Phỏng vấn Online",
  type: "Video",
  interviewType: "Phỏng vấn với AI",
  position: "Backend Developer",
};

// Async functions to simulate API calls

export const fetchAIInterviews = async (): Promise<AIInterview[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockAIInterviews;
};

export const fetchInterviewResult = async (_id: number): Promise<InterviewResult> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In a real app, we would filter by id
  return mockInterviewResult;
};

export const fetchPaymentInfo = async (): Promise<PaymentInfo> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockPaymentInfo;
};

export const simulatePayment = async (
  amount: number,
  method: string
): Promise<TransactionResult> => {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate payment processing
  return {
    success: true,
    transactionId: Math.random().toString(36).substring(2, 14).toUpperCase(),
    amount,
    paymentMethod: method === "wallet" ? "Ví INTELITE" : method === "bank" ? "Ngân hàng" : "MoMo",
    payerName: "Thu Hà",
    timestamp: new Date().toLocaleString("vi-VN"),
  };
};
