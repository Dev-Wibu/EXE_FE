// Mock data for authentication
// Updated: Removed phone, added university/major per BE requirement (2026-01-20)
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "MENTOR" | "ADMIN" | "STAFF";
  avatar?: string | null;
  bio?: string;
}

export interface MentorRegistration {
  id?: string;
  fullName?: string;
  email?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
}

export const mockUser: User = {
  id: "1",
  email: "binhan@gmail.com",
  fullName: "Bình Hân",
  role: "USER",
  avatar: null,
};

export const mockAdmin: User = {
  id: "2",
  email: "thuson@gmail.com",
  fullName: "Thư Sơn",
  role: "ADMIN",
  avatar: null,
};

export const mockStaff: User = {
  id: "4",
  email: "staff@example.com",
  fullName: "Staff Demo",
  role: "STAFF",
  avatar: null,
};

export const mockMentor: User = {
  id: "3",
  email: "b@fpt.com",
  fullName: "Mentor B",
  role: "MENTOR",
  avatar: null,
};

export const mockMentorRegistration: MentorRegistration = {
  status: "pending",
  submittedAt: "2025-10-20T10:00:00Z",
  reviewedAt: null,
};

// Mock login function
// NOTE: These demo credentials are intentionally hard-coded for development/testing purposes only.
// They are only used when VITE_MANAGER_MODE=mock. In production (api mode), real authentication is used.
export const mockLogin = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  // Demo user account
  if (email === "binhan@gmail.com" && password === "123") {
    return { success: true, user: mockUser };
  }

  // Demo admin account
  if (email === "thuson@gmail.com" && password === "12345") {
    return { success: true, user: mockAdmin };
  }

  // Demo mentor account
  if (email === "b@fpt.com" && password === "12345") {
    return { success: true, user: mockMentor };
  }

  // Demo staff account
  if (email === "staff@example.com" && password === "staff123") {
    return { success: true, user: mockStaff };
  }

  return { success: false, error: "Email hoặc mật khẩu không đúng" };
};

// Mock signup function
// Updated: New registration format with university/major (2026-01-20)
export const mockSignup = async (data: {
  fullName: string;
  email: string;
  password: string;
  university: string;
  major: string;
}): Promise<{ success: boolean; user?: User; error?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  // Use data to create new user
  void data.university; // University is stored in backend
  void data.major; // Major is stored in backend

  const newUser: User = {
    id: Date.now().toString(),
    email: data.email,
    fullName: data.fullName,
    role: "USER",
    avatar: null,
  };

  return { success: true, user: newUser };
};

// Mock mentor registration function
// Updated to match backend MentorInfo schema (2026-01-24)
export const mockMentorRegister = async (data: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  yearsOfExperience?: string;
  company?: string;
  position?: string;
  expertise?: string;
  bio?: string;
  linkedInUrl?: string;
  cvFile?: File;
  certificateFile?: File;
  idCardFile?: File;
}): Promise<{ success: boolean; registration?: MentorRegistration; error?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  // Use the data parameter to satisfy TypeScript
  void data;

  const registration: MentorRegistration = {
    id: Date.now().toString(),
    fullName: data.fullName,
    email: data.email,
    status: "pending",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
  };

  return { success: true, registration };
};
