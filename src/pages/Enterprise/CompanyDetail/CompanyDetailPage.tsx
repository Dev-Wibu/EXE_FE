/**
 * Company Detail Page
 * Public page showing company details and job listings
 * Route: /enterprise/company/:id
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { motion } from "framer-motion";

import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import { Spinner } from "@/components/ui/spinner";
import { companyManager, type Company, type JobDescription } from "@/services/company.manager";

import { CompanyHeroSection } from "./components/CompanyHeroSection";
import { CompanyInfoSection } from "./components/CompanyInfoSection";
import { JobListingsSection } from "./components/JobListingsSection";

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("ID công ty không hợp lệ");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [companyResult, jobsResult] = await Promise.all([
          companyManager.getById(id),
          companyManager.getJobs(id),
        ]);

        if (companyResult.success && companyResult.data) {
          setCompany(companyResult.data);
        }

        if (jobsResult.success && jobsResult.data) {
          const jobList = Array.isArray(jobsResult.data)
            ? jobsResult.data
            : (jobsResult.data as { data?: JobDescription[] }).data || [];
          setJobs(jobList);
        }
      } catch (err) {
        console.error("[CompanyDetailPage] Fetch error:", err);
        setError("Không thể tải thông tin công ty");
      }

      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HomepageHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Đang tải thông tin công ty...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HomepageHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Không tìm thấy công ty
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error || "Công ty bạn đang tìm kiếm không tồn tại."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <HomepageHeader />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {/* Hero Section - Banner + Company Info */}
        <CompanyHeroSection company={company} />

        {/* Company Information - About, Culture, Benefits, Stats */}
        <CompanyInfoSection company={company} />

        {/* Job Listings Section - Search, Filter, Job Cards */}
        <JobListingsSection jobs={jobs} companyName={company.name || "Công ty"} />
      </motion.main>

      <Footer />
    </div>
  );
}
