import { useTranslation } from "react-i18next";
/**
 * Company Info Section
 * Displays about, culture, benefits, and company stats
 */

import type { Company } from "@/services/company.manager";
import { Award, BookOpen, Briefcase, Lightbulb, Shield, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface CompanyInfoSectionProps {
  company: Company;
}

export function CompanyInfoSection({ company }: CompanyInfoSectionProps) {
  const { t } = useTranslation();
  const benefits = company.benefits || [];

  const benefitIcons: Record<string, React.ReactNode> = {
    [t("enterpriseCompanydetail.premiumHealthInsurance")]: (
      <Shield className="h-5 w-5 text-[#0047AB]" />
    ),
    [t("enterpriseCompanydetail.modernWorkingEnvironment")]: (
      <Lightbulb className="h-5 w-5 text-[#0047AB]" />
    ),
    [t("enterpriseCompanydetail.clearPromotionPath")]: (
      <TrendingUp className="h-5 w-5 text-[#0047AB]" />
    ),
    [t("enterpriseCompanydetail.trainingAndSkillsDevelopment")]: (
      <BookOpen className="h-5 w-5 text-[#0047AB]" />
    ),
    [t("enterpriseCompanydetail.flexibleWorkHybrid")]: (
      <Briefcase className="h-5 w-5 text-[#0047AB]" />
    ),
    [t("enterpriseCompanydetail.teamBuildingQuarterly")]: (
      <Award className="h-5 w-5 text-[#0047AB]" />
    ),
  };

  const benefitIcon = <Award className="h-5 w-5 text-[#0047AB]" />;

  return (
    <section className="w-full bg-white py-12 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t("enterpriseCompanydetail.about")} {company.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
            {t("enterpriseCompanydetail.learnMoreAboutTheCompany")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: About + Benefits (Full width) */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0047AB]/10">
                    <BookOpen className="h-5 w-5 text-[#0047AB]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t("enterpriseCompanydetail.aboutTheCompany")}
                  </h3>
                </div>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  {company.description}
                </p>
              </CardContent>
            </Card>

            {/* Benefits */}
            {benefits.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t("common.welfare")}
                    </h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                        <div className="mt-0.5">{benefitIcons[benefit] || benefitIcon}</div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
