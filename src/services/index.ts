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
export * from "./candidate-profile.manager";
export * from "./chat.manager";
// interview.manager dead code — tất cả trang AI Interview đã dùng $api trực tiếp
// export * from "./interview.manager";
export * from "./mentor-feedback.manager";
export * from "./mentor-review.manager";
export * from "./mentor.manager";
export * from "./notification.manager";
export * from "./post.manager";
export * from "./practice-set-item.manager";
export * from "./practice-set.manager";
export * from "./question-category.manager";
export * from "./question-major.manager";
export * from "./question.manager";
export * from "./quiz-set.manager";
export * from "./session.manager";
export * from "./user.manager";
export * from "./users-admin.manager";
