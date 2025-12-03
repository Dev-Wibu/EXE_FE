// Mock data for Overview Dashboard Page

export interface DashboardStats {
  totalQuestions: number;
  totalInterviews: number;
  todayPlan: string;
}

export interface CalendarEvent {
  date: string;
  title: string;
  color: "green" | "sky" | "purple" | "orange" | "zinc";
}

export const mockDashboardStats: DashboardStats = {
  totalQuestions: 0,
  totalInterviews: 0,
  todayPlan: "Sẵn sàng để trang bị cho hành trình mới",
};

export const mockCalendarEvents: CalendarEvent[] = [
  {
    date: "2025-07-03",
    title: "Giải đáp một số thắc mắc với AI",
    color: "green",
  },
  { date: "2025-07-06", title: "Giả lập phỏng vấn với AI", color: "green" },
  {
    date: "2025-07-08",
    title: "Ôn tập kiến thức với bộ câu hỏi",
    color: "sky",
  },
  { date: "2025-07-09", title: "Ôn tập", color: "sky" },
  { date: "2025-07-11", title: "Create mailing lists", color: "zinc" },
  { date: "2025-07-18", title: "Karthik ?project", color: "purple" },
  { date: "2025-07-22", title: "?", color: "orange" },
];

// Mock async function for React Query
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockDashboardStats;
};

export const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCalendarEvents;
};
