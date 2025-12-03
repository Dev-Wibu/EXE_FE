// Mock data for Question Bank Module

export interface QuestionSet {
  id: number;
  title: string;
  tags: string[];
  level: "Fresher" | "Junior/Mid" | "Mid-level" | "Senior";
  levelColor: "blue" | "green" | "yellow" | "red";
  description: string;
  questionCount: number;
  industry: string;
}

export interface Question {
  id: number;
  text: string;
  answer?: string;
}

export interface QuestionSetDetail extends QuestionSet {
  questions: Question[];
}

// Mock Question Sets
export const mockQuestionSets: QuestionSet[] = [
  {
    id: 1,
    title: "Java Backend Interview Questions",
    tags: ["Java", "Spring Boot"],
    level: "Junior/Mid",
    levelColor: "green",
    description:
      "Bộ câu hỏi tổng hợp kiến thức về Java Core, OOP, Collection, Threading và Spring Framework.",
    questionCount: 50,
    industry: "Phát triển Phần mềm",
  },
  {
    id: 2,
    title: "ReactJS Fundamentals & Hooks",
    tags: ["ReactJS", "Redux"],
    level: "Mid-level",
    levelColor: "yellow",
    description:
      "Tập trung vào kiến thức React Hooks, State Management và tối ưu hiệu suất ứng dụng Frontend.",
    questionCount: 40,
    industry: "Phát triển Phần mềm",
  },
  {
    id: 3,
    title: "SQL & Database Concepts",
    tags: ["SQL", "Database"],
    level: "Fresher",
    levelColor: "blue",
    description: "Các câu hỏi cơ bản về truy vấn SQL, Normalization, và Transaction Management.",
    questionCount: 35,
    industry: "Dữ liệu & AI",
  },
];

// Mock Questions for Question Set Detail
export const mockQuestions: Question[] = [
  { id: 1, text: "Giải thích sự khác biệt giữa `equals()` và `==` trong Java." },
  { id: 2, text: "Khi nào nên sử dụng `ArrayList` thay vì `LinkedList`?" },
  { id: 3, text: "Sự khác biệt giữa `final`, `finally` và `finalize` trong Java là gì?" },
  {
    id: 4,
    text: "Giải thích về Design Pattern phổ biến nhất trong Spring Framework, ví dụ: Dependency Injection.",
  },
  { id: 5, text: "Trình bày về cơ chế quản lý giao dịch (Transaction Management) trong Spring." },
  {
    id: 6,
    text: "Làm thế nào để xử lý đồng thời (Concurrency) và Thread Safety trong ứng dụng Backend?",
  },
  {
    id: 7,
    text: "Nêu tên và giải thích ngắn gọn về các thành phần chính (Components) của Spring Boot.",
  },
];

// Mock Question Set Detail
export const mockQuestionSetDetail: QuestionSetDetail = {
  id: 1,
  title: "Java Backend Interview Questions",
  tags: ["Java", "Spring Boot"],
  level: "Junior/Mid",
  levelColor: "green",
  description:
    "Bộ câu hỏi này bao gồm 50 câu hỏi tập trung vào kiến thức **Java Core**, **OOP**, **Collection**, **Threading** và **Spring Framework** cho vị trí Junior/Mid-level.",
  questionCount: 50,
  industry: "Phát triển Phần mềm",
  questions: mockQuestions,
};

// Industry options for filter
export const mockIndustries = [
  "Tất cả Ngành",
  "Phát triển Phần mềm",
  "Dữ liệu & AI",
  "DevOps",
  "UI/UX Design",
  "Product Management",
];

// Level options for filter
export const mockLevels = ["Tất cả Cấp độ", "Fresher", "Junior/Mid", "Mid-level", "Senior"];

// Async functions to simulate API calls

export const fetchQuestionSets = async (): Promise<QuestionSet[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockQuestionSets;
};

export const fetchQuestionSetDetail = async (id: number): Promise<QuestionSetDetail | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In a real app, we would fetch by id and return the matching question set
  const questionSet = mockQuestionSets.find((qs) => qs.id === id);
  if (!questionSet) {
    return null;
  }
  return {
    ...questionSet,
    description: `Bộ câu hỏi này bao gồm ${questionSet.questionCount} câu hỏi tập trung vào kiến thức chuyên môn cho vị trí ${questionSet.level}. ${questionSet.description}`,
    questions: mockQuestions,
  };
};

export const searchQuestionSets = async (
  query: string,
  industry: string,
  level: string
): Promise<QuestionSet[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockQuestionSets];

  // Filter by search query
  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(
      (qs) =>
        qs.title.toLowerCase().includes(lowerQuery) ||
        qs.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter by industry
  if (industry && industry !== "Tất cả Ngành") {
    filtered = filtered.filter((qs) => qs.industry === industry);
  }

  // Filter by level
  if (level && level !== "Tất cả Cấp độ") {
    filtered = filtered.filter((qs) => qs.level === level);
  }

  return filtered;
};
