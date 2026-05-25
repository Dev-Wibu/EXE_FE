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

export * from "./application.service";
export * from "./application.manager";
export * from "./auth.manager";
export * from "./candidate-profile.manager";
export * from "./chat.manager";
export * from "./company.manager";
export * from "./dashboard-admin.manager";
export * from "./interview-analysis.manager";
export * from "./interview-session.manager";
export * from "./job-description.manager";
export * from "./membership-plan.manager";
export * from "./mentor-feedback.manager";
export * from "./mentor-review.manager";
export * from "./mentor.manager";
export * from "./notification.manager";
export * from "./payment.manager";
export * from "./post.manager";
export * from "./practice-set-item.manager";
export * from "./practice-set.manager";
export * from "./question-category.manager";
export * from "./question-major.manager";
export * from "./question.manager";
export * from "./quiz-set.manager";
export * from "./round.manager";
export * from "./session.manager";
export * from "./transaction.manager";
export * from "./user.manager";
export * from "./users-admin.manager";
