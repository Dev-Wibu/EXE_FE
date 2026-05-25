/**
 * Company Info Section
 * Displays about, culture, benefits, and company stats
 */

import type { Company } from "@/services/company.manager";
import { Award, BookOpen, Briefcase, Lightbulb, Shield, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CompanyInfoSectionProps {
  company: Company;
}

export function CompanyInfoSection({ company }: CompanyInfoSectionProps) {
  const stats = company.stats;
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

        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          {/* Left: About + Benefits (spans 2 columns) */}
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
                  {company.description ||
                    "Chúng tôi là một công ty công nghệ hàng đầu, chuyên cung cấp các giải pháp số toàn diện cho doanh nghiệp."}
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

          {/* Right: Stats (1 column) */}
          <div className="space-y-3">
            {/* Stat Cards */}
            {stats && (
              <div className="space-y-3">
                <Card className="border-[#0047AB]/20 bg-gradient-to-br from-[#0047AB]/5 to-[#007BFF]/5 dark:border-[#66B2FF]/20 dark:from-[#0047AB]/10 dark:to-[#007BFF]/10">
                  <CardContent className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0047AB]/10">
                        <Users className="h-5 w-5 text-[#0047AB]" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Thông tin nhanh
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Nhân viên
                        </span>
                        <Badge variant="secondary">
                          {stats.totalEmployees?.toLocaleString() || "350"}+
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Vị trí đang tuyển
                        </span>
                        <Badge variant="secondary">{stats.openPositions || "12"}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Buổi phỏng vấn/tháng
                        </span>
                        <Badge variant="secondary">{stats.interviewsPerMonth || "45"}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Tỷ lệ tuyển dụng
                        </span>
                        <Badge variant="secondary">{stats.hiringRate || "78"}%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Info if no stats */}
            {!stats && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0047AB]/10">
                      <Users className="h-5 w-5 text-[#0047AB]" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Thông tin nhanh
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Quy mô</span>
                      <Badge variant="secondary">{company.size || "200-500"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Địa điểm</span>
                      <Badge variant="secondary">{company.location || "Hồ Chí Minh"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Thành lập</span>
                      <Badge variant="secondary">{company.foundedYear || "2018"}</Badge>
                    </div>
                    {company.industry && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Ngành nghề
                        </span>
                        <Badge variant="secondary">{company.industry}</Badge>
                      </div>
                    )}
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
