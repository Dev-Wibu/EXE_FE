// Mock data for AI Chat Module

export interface ChatSession {
  id: number;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
}

export interface ChatMessage {
  id: number;
  sender: "ai" | "user";
  content: string;
  time: string;
}

// Mock Chat Sessions data
export const mockChatSessions: ChatSession[] = [
  {
    id: 1,
    title: "Phỏng vấn Kỹ sư Backend (Java)",
    lastMessage: "AI: Tuyệt vời! Bạn đã sẵn sàng chưa?...",
    lastMessageTime: "10:30 AM",
  },
  {
    id: 2,
    title: "Thảo luận về Design Pattern",
    lastMessage: "Bạn: Em thấy Factory Pattern khá hữu ích...",
    lastMessageTime: "Hôm qua",
  },
  {
    id: 3,
    title: "Tổng hợp kinh nghiệm ReactJS",
    lastMessage: "AI: Hãy nói về Hooks trong React...",
    lastMessageTime: "20/09/2025",
  },
];

// Mock Chat Messages for a conversation
export const mockChatMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "ai",
    content:
      "Chào bạn! Tôi là AI phỏng vấn của Inblue. Hôm nay chúng ta sẽ bắt đầu với vai trò Kỹ sư Backend (Java). Bạn đã sẵn sàng chưa?",
    time: "10:28 AM",
  },
  {
    id: 2,
    sender: "user",
    content: "Tôi sẵn sàng. Bạn có thể bắt đầu với câu hỏi về Java Collections được không?",
    time: "10:30 AM",
  },
  {
    id: 3,
    sender: "ai",
    content:
      "Chắc chắn rồi. Bạn hãy giải thích sự khác biệt cơ bản giữa `ArrayList` và `LinkedList` trong Java, và khi nào nên sử dụng loại nào?",
    time: "10:32 AM",
  },
];

// Async functions to simulate API calls

export const fetchChatSessions = async (): Promise<ChatSession[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockChatSessions;
};

export const fetchChatMessages = async (_sessionId: number): Promise<ChatMessage[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In a real app, we would filter by sessionId
  return mockChatMessages;
};

export const fetchChatSession = async (sessionId: number): Promise<ChatSession | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockChatSessions.find((session) => session.id === sessionId);
};

export const sendChatMessage = async (
  _sessionId: number,
  content: string
): Promise<ChatMessage> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    id: Date.now(),
    sender: "user",
    content,
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

export const getAIResponse = async (_sessionId: number): Promise<ChatMessage> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const responses = [
    "Câu trả lời rất tốt! Bạn có thể giải thích thêm về performance considerations không?",
    "Đúng rồi! Bây giờ, hãy nói về cách bạn xử lý thread safety trong Java.",
    "Tuyệt vời! Tiếp theo, bạn có thể mô tả cách sử dụng HashMap vs TreeMap không?",
    "Rất chi tiết! Bạn có kinh nghiệm với Spring Boot không? Hãy chia sẻ một project bạn đã làm.",
  ];
  return {
    id: Date.now(),
    sender: "ai",
    content: responses[Math.floor(Math.random() * responses.length)],
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

export const createNewChatSession = async (title: string): Promise<ChatSession> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    id: Date.now(),
    title,
    lastMessage: "AI: Chào bạn! Tôi sẵn sàng giúp đỡ bạn...",
    lastMessageTime: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};
