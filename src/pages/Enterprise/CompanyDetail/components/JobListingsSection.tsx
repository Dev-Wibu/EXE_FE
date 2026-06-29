/**
 * Job Listings Section
 * Search, filter, and display job listings for a company
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JobDescription } from "@/services/company.manager";
import { motion } from "framer-motion";
import { Bot, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { JobCard } from "./JobCard";
interface JobListingsSectionProps {
  jobs: JobDescription[];
  companyName: string;
}
const SKILL_OPTIONS = [
  "ReactJS",
  "TypeScript",
  "Python",
  "Go Lang",
  "Node.js",
  "Java",
  "AWS",
  "Docker",
  "Kubernetes",
  "AI/ML",
];
export function JobListingsSection({ jobs, companyName }: JobListingsSectionProps) {
  const { t } = useTranslation();
  const LEVEL_OPTIONS = [
    {
      value: "ALL",
      label: t("general.all"),
    },
    {
      value: "INTERN",
      label: t("enterpriseCompanydetail.internInternship"),
    },
    {
      value: "FRESHER",
      label: "Fresher",
    },
    {
      value: "JUNIOR",
      label: "Junior",
    },
    {
      value: "MIDDLE",
      label: "Middle",
    },
  ];
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["ALL"]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.skills?.some((s) => s.toLowerCase().includes(query));

      // Level filter
      const matchesLevel =
        selectedLevels.includes("ALL") || selectedLevels.includes(job.level || "");

      // Skills filter
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((skill) =>
          job.skills?.some((s) => s.toLowerCase().includes(skill.toLowerCase()))
        );
      return matchesSearch && matchesLevel && matchesSkills;
    });
  }, [jobs, searchQuery, selectedLevels, selectedSkills]);
  const toggleLevel = (level: string) => {
    if (level === "ALL") {
      setSelectedLevels(["ALL"]);
      return;
    }
    const newLevels = selectedLevels.filter((l) => l !== "ALL");
    if (newLevels.includes(level)) {
      const filtered = newLevels.filter((l) => l !== level);
      setSelectedLevels(filtered.length === 0 ? ["ALL"] : filtered);
    } else {
      setSelectedLevels([...newLevels, level]);
    }
  };
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLevels(["ALL"]);
    setSelectedSkills([]);
  };
  const hasActiveFilters =
    searchQuery !== "" || !selectedLevels.includes("ALL") || selectedSkills.length > 0;
  return (
    <section className="w-full bg-slate-50 py-12 dark:bg-slate-950/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            margin: "-50px",
          }}
          transition={{
            duration: 0.4,
          }}
          className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {t("enterpriseCompanydetail.positionIsRecruiting")}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("enterpriseCompanydetail.jobOpportunitiesAt")} {companyName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-[#0047AB]/10 px-3 py-1 text-sm font-medium text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                {filteredJobs.length} {t("common.location")}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/select-role")}
                className="hidden gap-2 sm:flex">
                <Bot className="h-4 w-4" />
                {t("enterpriseCompanydetail.createAiInterviews")}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72">
            <div className="sticky top-24">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={t("enterpriseCompanydetail.searchLocation")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                className="mb-4 w-full justify-between lg:hidden"
                onClick={() => setShowFilters(!showFilters)}>
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t("common.filter")}
                </span>
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 items-center justify-center p-0 text-xs">
                    {selectedLevels.filter((l) => l !== "ALL").length + selectedSkills.length}
                  </Badge>
                )}
              </Button>

              {/* Filter Panel */}
              <div
                className={`space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${showFilters ? "block" : "hidden lg:block"}`}>
                {/* Level Filter */}
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Filter className="h-4 w-4 text-[#0047AB]" />
                    {t("common.rank")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {LEVEL_OPTIONS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => toggleLevel(level.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selectedLevels.includes(level.value) ? "bg-[#0047AB] text-white dark:bg-[#66B2FF] dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills Filter */}
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {t("common.skill")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selectedSkills.includes(skill) ? "bg-[#0047AB] text-white dark:bg-[#66B2FF] dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-slate-500 hover:text-red-500">
                    <X className="mr-1 h-3 w-3" />
                    {t("common.clearFilter")}
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Job List */}
          <div className="min-w-0 flex-1">
            {filteredJobs.length === 0 ? (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {t("enterpriseCompanydetail.noSuitableLocationFound")}
                </h3>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                  {t("enterpriseCompanydetail.tryAdjustingYourSearchFilters")}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t("common.clearFilter")}
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                  <JobCard key={job.id || index} job={job} />
                ))}

                {/* Load More */}
                {filteredJobs.length >= 3 && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      className="gap-2 border-[#0047AB]/30 text-[#0047AB] hover:bg-[#0047AB]/10 dark:border-[#66B2FF]/30 dark:text-[#66B2FF]">
                      {t("enterpriseCompanydetail.loadMoreLocations")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
