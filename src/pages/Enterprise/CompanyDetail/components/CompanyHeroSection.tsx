/**
 * Company Hero Section
 * Displays company banner, logo, name, and quick info
 */

import type { Company } from "@/services/company.manager";
import { motion } from "framer-motion";
import { Building2, Globe, MapPin, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CompanyHeroSectionProps {
  company: Company;
}

export function CompanyHeroSection({ company }: CompanyHeroSectionProps) {
  const bannerUrl =
    company.bannerUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80";

  const logoUrl = company.logoUrl;
  const companyInitials =
    company.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TN";

  return (
    <section className="relative w-full pt-16">
      {/* Banner Image */}
      <div className="h-64 w-full overflow-hidden md:h-80">
        <motion.img
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          src={bannerUrl}
          alt={`${company.name} banner`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
      </div>

      {/* Company Info Card */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative -mt-16 sm:-mt-20">
          <div className="rounded-2xl border border-slate-200/50 bg-white/95 p-5 shadow-xl backdrop-blur-xl sm:p-6 dark:border-slate-700/50 dark:bg-slate-900/95">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              {/* Left: Logo + Info */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                {/* Logo */}
                <div className="relative -mt-16 sm:-mt-12">
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#0047AB] to-[#007BFF] shadow-lg sm:h-32 sm:w-32 dark:border-slate-800 dark:from-[#0047AB] dark:to-[#003366]">
                    {logoUrl ? (
                      <Avatar className="h-full w-full rounded-xl">
                        <AvatarImage src={logoUrl} alt={company.name} className="object-cover" />
                        <AvatarFallback className="rounded-xl bg-transparent text-2xl font-bold text-white sm:text-3xl">
                          {companyInitials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Building2 className="h-14 w-14 text-white/90 sm:h-16 sm:w-16" />
                    )}
                  </div>
                  {/* Verified Badge */}
                  {company.status === "ACTIVE" && (
                    <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 shadow-md">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {company.industry && (
                      <Badge
                        variant="secondary"
                        className="bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                        {company.industry}
                      </Badge>
                    )}
                    {company.status === "ACTIVE" && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Đối tác tin cậy
                      </Badge>
                    )}
                  </div>

                  <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                    {company.name}
                  </h1>

                  {company.description && (
                    <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:line-clamp-none dark:text-slate-400">
                      {company.description}
                    </p>
                  )}

                  {/* Quick Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    {company.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </span>
                    )}
                    {company.size && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Quy mô: {company.size}
                      </span>
                    )}
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-[#0047AB] dark:hover:text-[#66B2FF]"
                        onClick={(e) => e.stopPropagation()}>
                        <Globe className="h-4 w-4" />
                        <span className="hidden sm:inline">Website</span>
                      </a>
                    )}
                    {company.foundedYear && (
                      <span className="hidden text-slate-400 sm:inline">
                        Thành lập {company.foundedYear}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="border-[#0047AB]/30 text-[#0047AB] hover:bg-[#0047AB]/10 sm:flex-none dark:border-[#66B2FF]/30 dark:text-[#66B2FF]"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: company.name,
                        text: company.description,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}>
                  Chia sẻ
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
