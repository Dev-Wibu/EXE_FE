// Mock data for user profile
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: "user" | "mentor";
  createdAt: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: number;
  type: "deposit" | "payment" | "refund";
  amount: number;
  date: string;
  description: string;
  status: "completed" | "pending" | "failed";
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export interface UserSettings {
  language: "vi" | "en";
  notifications: NotificationSettings;
}

// Mock user profile data
export const mockUserProfile: UserProfile = {
  id: "1",
  fullName: "Thu Hà",
  email: "thuha@example.com",
  phone: "0912345678",
  avatar: null,
  role: "user",
  createdAt: "2024-06-15T00:00:00Z",
};

// Mock wallet data
export const mockWallet: Wallet = {
  balance: 1500000,
  currency: "VNĐ",
  transactions: [
    {
      id: 1,
      type: "deposit",
      amount: 500000,
      date: "2024-11-20",
      description: "Nạp tiền vào ví",
      status: "completed",
    },
    {
      id: 2,
      type: "payment",
      amount: -220000,
      date: "2024-11-25",
      description: "Thanh toán phỏng vấn AI - Backend Developer",
      status: "completed",
    },
    {
      id: 3,
      type: "deposit",
      amount: 1000000,
      date: "2024-11-28",
      description: "Nạp tiền vào ví",
      status: "completed",
    },
    {
      id: 4,
      type: "payment",
      amount: -440000,
      date: "2024-12-01",
      description: "Thanh toán phỏng vấn với Mentor - Technical Interview",
      status: "completed",
    },
    {
      id: 5,
      type: "deposit",
      amount: 660000,
      date: "2024-12-03",
      description: "Nạp tiền vào ví",
      status: "pending",
    },
  ],
};

// Mock user settings data
export const mockUserSettings: UserSettings = {
  language: "vi",
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
  },
};

// Async functions to fetch data (simulating API calls)
export const fetchUserProfile = async (): Promise<UserProfile> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockUserProfile;
};

export const fetchWallet = async (): Promise<Wallet> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockWallet;
};

export const fetchUserSettings = async (): Promise<UserSettings> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockUserSettings;
};

export const updateUserProfile = async (
  data: Partial<UserProfile>
): Promise<{ success: boolean; user: UserProfile }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const updatedUser = { ...mockUserProfile, ...data };
  return { success: true, user: updatedUser };
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  void currentPassword;
  void newPassword;
  return { success: true, message: "Đổi mật khẩu thành công" };
};

export const updateUserSettings = async (
  settings: Partial<UserSettings>
): Promise<{ success: boolean; settings: UserSettings }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const updatedSettings = { ...mockUserSettings, ...settings };
  return { success: true, settings: updatedSettings };
};

export const depositToWallet = async (
  amount: number
): Promise<{ success: boolean; transaction: Transaction }> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const newTransaction: Transaction = {
    id: Date.now(),
    type: "deposit",
    amount: amount,
    date: new Date().toISOString().split("T")[0],
    description: "Nạp tiền vào ví",
    status: "completed",
  };
  return { success: true, transaction: newTransaction };
};
