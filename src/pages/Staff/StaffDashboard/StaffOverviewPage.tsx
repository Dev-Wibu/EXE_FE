import { useTranslation } from "react-i18next";

export function StaffOverviewPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          {t("staffOverview.welcomeTitle")}
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          {t("staffOverview.welcomeDescription")}
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("staffOverview.quickActions")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title={t("staffStaffdashboard.browseMentors")}
              description={t("staffOverview.processMentorApplications")}
              color="bg-green-50 dark:bg-green-900/20"
              textColor="text-green-700 dark:text-green-400"
            />
            <QuickActionCard
              title={t("common.interviewSession")}
              description={t("staffOverview.monitorInterviewSessions")}
              color="bg-blue-50 dark:bg-blue-900/20"
              textColor="text-blue-700 dark:text-blue-400"
            />
            <QuickActionCard
              title={t("staffStaffdashboard.mentorSReview")}
              description={t("staffOverview.moderateMentorReviews")}
              color="bg-yellow-50 dark:bg-yellow-900/20"
              textColor="text-yellow-700 dark:text-yellow-400"
            />
            <QuickActionCard
              title={t("common.article")}
              description={t("staffOverview.manageCommunityPosts")}
              color="bg-purple-50 dark:bg-purple-900/20"
              textColor="text-purple-700 dark:text-purple-400"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("staffOverview.activitySummary")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t("staffOverview.activitySummaryPlaceholder")}
          </p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  color: string;
  textColor: string;
}

function QuickActionCard({ title, description, color, textColor }: QuickActionCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${color} border-transparent`}>
      <h3 className={`mb-1 font-medium ${textColor}`}>{title}</h3>
      <p className="text-xs text-gray-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
