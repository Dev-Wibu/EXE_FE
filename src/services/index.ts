/**
 * Central export for all service managers
 *
 * Usage:
 * import { authManager, userManager, mentorManager } from '@/services';
 *
 * Example:
 * const result = await authManager.login({ email: 'user@example.com', password: 'password' });
 * if (result.success) {
 *   console.log('Logged in:', result.data);
 * } else {
 *   console.error('Login failed:', result.error);
 * }
 */

export * from "./auth.manager";
export * from "./chat.manager";
export * from "./interview.manager";
export * from "./mentor.manager";
export * from "./question.manager";
export * from "./session.manager";
export * from "./user.manager";
export * from "./users-admin.manager";
