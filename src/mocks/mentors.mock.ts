// Mock data for Mock Interview with Mentor Module

export interface Mentor {
  id: number;
  name: string;
  position: string;
  company: string;
  location: string;
  language: string;
  rating: number;
  totalSessions: number;
  skills: string[];
  moreSkills: number;
  avatar: string | null;
}

export interface InterviewType {
  id: number;
  name: string;
  duration: number;
  price: number;
  description: string;
  icon: string;
}

export interface MockInterview {
  id: number;
  title: string;
  date: string;
  time: string;
  mentorName: string;
  status: "completed" | "upcoming" | "cancelled";
}

export interface BookingInfo {
  mentorId: number;
  interviewTypeId: number;
  date: string;
  time: string;
  duration: number;
  price: number;
  serviceFee: number;
  total: number;
}

export interface MockPaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  payerName: string;
  timestamp: string;
}

// Mock Mentors data
export const mockMentors: Mentor[] = [
  {
    id: 1,
    name: "NGUYỄN VĂN A",
    position: "Tech lead",
    company: "FPT Software",
    location: "Quận 9",
    language: "Tiếng Việt",
    rating: 4.5,
    totalSessions: 100,
    skills: ["Java", "ReactJs", "Spring"],
    moreSkills: 3,
    avatar: null,
  },
  {
    id: 2,
    name: "NGUYỄN VĂN B",
    position: "Tech lead",
    company: "FPT Software",
    location: "Quận 10",
    language: "Tiếng Việt",
    rating: 3.9,
    totalSessions: 120,
    skills: ["C#", ".NET", "Hacker"],
    moreSkills: 2,
    avatar: null,
  },
  {
    id: 3,
    name: "TRẦN THỊ C",
    position: "Senior Developer",
    company: "VNG Corporation",
    location: "Quận 7",
    language: "Tiếng Việt",
    rating: 4.8,
    totalSessions: 85,
    skills: ["Python", "Django", "AWS"],
    moreSkills: 4,
    avatar: null,
  },
];

// Mock Interview Types
export const mockInterviewTypes: InterviewType[] = [
  {
    id: 1,
    name: "Sơ loại",
    duration: 45,
    price: 200000,
    description: "Giúp bạn nắm được khung sườn cơ bản...",
    icon: "🕓",
  },
  {
    id: 2,
    name: "Kiến thức",
    duration: 90,
    price: 500000,
    description: "Kiểm tra kiến thức chuyên môn và kinh nghiệm...",
    icon: "⏱️",
  },
  {
    id: 3,
    name: "Tình huống",
    duration: 45,
    price: 400000,
    description: "Đánh giá khả năng xử lý tình huống và tư duy...",
    icon: "⌚",
  },
  {
    id: 4,
    name: "Trọn gói",
    duration: 120,
    price: 900000,
    description: "Bao gồm sơ loại, kiến thức và tình huống...",
    icon: "⏳",
  },
];

// Mock Interview History
export const mockMockInterviews: MockInterview[] = [
  {
    id: 1,
    title: "Phỏng vấn Backend",
    date: "20/09/2025",
    time: "14:00",
    mentorName: "Nguyễn Văn A",
    status: "completed",
  },
  {
    id: 2,
    title: "Phỏng vấn Backend",
    date: "20/10/2025",
    time: "14:00",
    mentorName: "Nguyễn Văn B",
    status: "upcoming",
  },
];

// Mock Booking Info (for confirmation page)
export const mockBookingInfo: BookingInfo = {
  mentorId: 1,
  interviewTypeId: 2,
  date: "12/09/2025",
  time: "14:00",
  duration: 90,
  price: 400000,
  serviceFee: 40000,
  total: 440000,
};

// Mock unavailable dates (for calendar)
export const mockUnavailableDates: number[] = [5, 18];

// Async functions to simulate API calls

export const fetchMentors = async (): Promise<Mentor[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockMentors;
};

export const fetchMentor = async (id: number): Promise<Mentor | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockMentors.find((mentor) => mentor.id === id);
};

export const fetchInterviewTypes = async (): Promise<InterviewType[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockInterviewTypes;
};

export const fetchMockInterviews = async (): Promise<MockInterview[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockMockInterviews;
};

export const fetchBookingInfo = async (): Promise<BookingInfo> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockBookingInfo;
};

export const simulateMockPayment = async (
  amount: number,
  method: string
): Promise<MockPaymentResult> => {
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
