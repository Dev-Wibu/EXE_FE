/**
 * Mock data for users admin management
 * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
 */

import type { User } from "@/interfaces";

export const mockUsers: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    role: "USER",
    isActive: true,
    university: "FPT University",
    major: "Software Engineering",
  },
  {
    id: 2,
    name: "Bob Wilson",
    email: "bob.wilson@example.com",
    role: "USER",
    isActive: true,
    university: "HCMC University of Technology",
    major: "Computer Science",
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    isActive: true,
  },
  {
    id: 4,
    name: "Staff Member",
    email: "staff@example.com",
    role: "STAFF",
    isActive: true,
  },
];

/**
 * Fetch all users (mock)
 */
export const fetchUsers = async (): Promise<User[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...mockUsers];
};

/**
 * Fetch user by ID (mock)
 */
export const fetchUser = async (id: number): Promise<User | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockUsers.find((user) => user.id === id);
};
