/**
 * Job Card Component
 * Individual job listing card with 3D hover effect
 */

import type { JobDescription } from "@/services/company.manager";
import { Bot, Clock, DollarSign, Eye, MapPin, Users } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: JobDescription;
}

const levelColors: Record<string, string> = {
  INTERN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  FRESHER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  JUNIOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  MIDDLE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SENIOR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const levelLabels: Record<string, string> = {
  INTERN: "Intern/Thực tập",
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  MIDDLE: "Middle",
  SENIOR: "Senior",
};

const formatSalary = (min?: number, max?: number, currency = "VND"): string => {
  if (!min && !max) return "Thương lượng";

  const format = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")} triệu`;
    }
    return num.toLocaleString("vi-VN");
  };

  if (min && max) {
    return `${format(min)} - ${format(max)} ${currency}`;
  }
  if (min) return `Từ ${format(min)} ${currency}`;
  if (max) return `Đến ${format(max)} ${currency}`;
  return "Thương lượng";
};

export function JobCard({ job }: JobCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    card.style.transition = "transform 0.1s ease-out";
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
      card.style.transition = "transform 0.3s ease-out";
    }
  };

  const isHot = job.level === "MIDDLE" || job.level === "SENIOR";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm transition-all hover:shadow-xl sm:p-6 dark:border-slate-700/50 dark:bg-slate-900">
      <div className="flex flex-col gap-4">
        {/* Top Row: Title + Badges */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {isHot && (
              <Badge className="shrink-0 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                HOT
              </Badge>
            )}
            {job.level && (
              <Badge
                className={`shrink-0 ${levelColors[job.level] || "bg-slate-100 text-slate-600"}`}>
                {levelLabels[job.level] || job.level}
              </Badge>
            )}
          </div>
          <h3 className="text-lg leading-tight font-bold text-slate-900 group-hover:text-[#0047AB] dark:text-white dark:group-hover:text-[#66B2FF]">
            {job.title}
          </h3>
        </div>

        {/* Meta Row: Salary + Location + Type */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {job.salaryMin || job.salaryMax ? (
            <span className="flex items-center gap-1 font-medium whitespace-nowrap text-[#0047AB] dark:text-[#66B2FF]">
              <DollarSign className="h-4 w-4" />
              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
            </span>
          ) : null}

          {job.location && (
            <span className="flex items-center gap-1 whitespace-nowrap text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
          )}

          {job.workType && (
            <span className="flex items-center gap-1 whitespace-nowrap text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4" />
              {job.workType}
            </span>
          )}

          {job.appliedCount !== undefined && job.appliedCount > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4" />
              {job.appliedCount} ứng viên
            </span>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {job.description}
          </p>
        )}

        {/* Skills Tags */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-500">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-[#0047AB] to-[#007BFF] text-white hover:opacity-90"
            asChild>
            <Link to={`/enterprise/job/${job.id}`}>
              <Eye className="h-4 w-4" />
              Xem chi tiết
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-[#0047AB] text-[#0047AB] hover:bg-[#0047AB]/10 dark:border-[#66B2FF] dark:text-[#66B2FF]"
            asChild>
            <Link
              to={`/user/ai-interview/setup?company=${job.companyId || ""}&job=${job.id || ""}`}>
              <Bot className="h-4 w-4" />
              Phỏng vấn ảo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
