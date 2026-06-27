import { BadgeCheck, Users, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EnhancedStatsSection() {
  const { t } = useTranslation();

  const statsData = [
    {
      value: "15,000+",
      label: t("compHomepageRedesign.studentsParticipated"),
      icon: Users,
    },
    {
      value: "450+",
      label: t("compHomepageRedesign.interviewScript"),
      icon: BadgeCheck,
    },
    {
      value: "98%",
      label: t("compHomepageRedesign.positiveResponseRate"),
      icon: Zap,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/70 p-8 shadow-xl backdrop-blur-xl md:flex-row dark:border-slate-700/50 dark:bg-slate-900/70">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#0047AB]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#007BFF]/5 blur-3xl" />
        </div>

        <div className="flex flex-col items-center justify-around gap-8 md:flex-row">
          {statsData.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0047AB]/10 dark:bg-[#0047AB]/20">
                <stat.icon className="h-7 w-7 text-[#0047AB] dark:text-[#66B2FF]" />
              </div>
              <div className="mb-1 text-4xl font-bold text-[#0047AB] dark:text-[#66B2FF]">
                {stat.value}
              </div>
              <div className="text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
