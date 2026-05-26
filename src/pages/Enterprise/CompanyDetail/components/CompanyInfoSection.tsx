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
  const benefits = company.benefits || [];

  const benefitIcons: Record<string, React.ReactNode> = {
    "Bảo hiểm sức khỏe cao cấp": <Shield className="h-5 w-5 text-[#0047AB]" />,
    "Môi trường làm việc hiện đại": <Lightbulb className="h-5 w-5 text-[#0047AB]" />,
    "Lộ trình thăng tiến rõ ràng": <TrendingUp className="h-5 w-5 text-[#0047AB]" />,
    "Đào tạo và phát triển kỹ năng": <BookOpen className="h-5 w-5 text-[#0047AB]" />,
    "Công việc linh hoạt (Hybrid)": <Briefcase className="h-5 w-5 text-[#0047AB]" />,
    "Team building hàng quý": <Award className="h-5 w-5 text-[#0047AB]" />,
  };

  const benefitIcon = <Award className="h-5 w-5 text-[#0047AB]" />;

  return (
    <section className="w-full bg-white py-12 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Giới thiệu về {company.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Tìm hiểu thêm về công ty và văn hóa làm việc
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
                    Về công ty
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
                      Phúc lợi
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
