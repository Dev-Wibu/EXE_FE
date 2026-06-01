import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { companyManager, type JobDescription } from "@/services/company.manager";
import { Briefcase, Building2, DollarSign, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
export function JobSearchSection() {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const params: {
        titleKeyword?: string;
        status?: "OPEN";
        level?: "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";
        salaryMin?: number;
        salaryMax?: number;
      } = {
        status: "OPEN",
      };
      if (keyword.trim()) {
        params.titleKeyword = keyword.trim();
      }
      if (level !== "all") {
        params.level = level.toUpperCase() as "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";
      }
      const parsedMin = parseInt(salaryMin.replace(/[^\d]/g, ""), 10);
      const parsedMax = parseInt(salaryMax.replace(/[^\d]/g, ""), 10);
      if (!isNaN(parsedMin) && parsedMin > 0) {
        params.salaryMin = parsedMin * 1000000;
      }
      if (!isNaN(parsedMax) && parsedMax > 0) {
        params.salaryMax = parsedMax * 1000000;
      }
      const result = await companyManager.searchJobs(params);
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        console.error("[JobSearchSection] Search error:", result.error);
        setJobs([]);
      }
    } catch (error) {
      console.error("[JobSearchSection] Search error:", error);
      setJobs([]);
    } finally {
      setIsSearching(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  const formatSalary = (min?: number, max?: number, currency?: string) => {
    const format = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(0)}M`;
      }
      return `${(num / 1000).toFixed(0)}K`;
    };
    if (min && max) {
      return `${format(min)} - ${format(max)} ${currency || "VND"}`;
    }
    if (min) {
      return t("common.fromVar0Var1", {
        var_0: format(min),
        var_1: currency || "VND",
      });
    }
    if (max) {
      return t("common.toVar0Var1", {
        var_0: format(max),
        var_1: currency || "VND",
      });
    }
    return t("common.agree");
  };
  const getLevelBadgeColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case "INTERN":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "FRESHER":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "JUNIOR":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "MIDDLE":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* Search Card */}
      <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/70">
        <div className="mb-6">
          <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
            {t("compHomepageRedesign.searchForCareerOpportunities")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("compHomepageRedesign.exploreVacanciesThatFitYour")}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("compHomepageRedesign.searchForPositionsSkillsOr")}
              className="h-12 w-full rounded-xl border border-slate-200/50 bg-slate-50/50 pr-4 pl-12 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:border-[#0047AB]/50 focus:ring-2 focus:ring-[#0047AB]/20 focus:outline-none dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-200"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Level Filter */}
            <div className="min-w-[140px] flex-1 sm:max-w-[200px] sm:min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("common.rank")}
              </label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder={t("general.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("general.all")}</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="fresher">Fresher</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Min Input */}
            <div className="min-w-[120px] flex-1 sm:max-w-[160px] sm:min-w-[120px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("adminCompanymanagement.minimumWage")}
              </label>
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={salaryMin}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    setSalaryMin(raw);
                  }}
                  className="h-10 w-full pr-12 pl-9 text-sm"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                  {t("general.million")}
                </span>
              </div>
            </div>

            {/* Salary Max Input */}
            <div className="min-w-[120px] flex-1 sm:max-w-[160px] sm:min-w-[120px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("adminCompanymanagement.maximumSalary")}
              </label>
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={salaryMax}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    setSalaryMax(raw);
                  }}
                  className="h-10 w-full pr-12 pl-9 text-sm"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                  {t("general.million")}
                </span>
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-10 gap-2 bg-[#0047AB] px-6 hover:bg-[#003d8f]">
              {isSearching ? (
                <>
                  <Search className="h-4 w-4 animate-spin" />
                  {t("compHomepageRedesign.lookingFor")}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {t("general.search")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="mt-8">
          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isSearching ? (
                t("adminUsermanagement.hide")
              ) : (
                <>
                  {t("common.find")}{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {jobs.length}
                  </span>{" "}
                  {t("common.location")}
                  {keyword && (
                    <span className="ml-1">
                      cho "<span className="font-medium">{keyword}</span>"
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Jobs Grid */}
          {!isSearching && jobs.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.slice(0, 9).map((job) => (
                <Link key={job.id} to={`/enterprise/job/${job.id}`} className="block">
                  <Card className="group h-full cursor-pointer border-slate-200 transition-all hover:border-[#0047AB]/50 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0047AB]/10">
                            <Briefcase className="h-6 w-6 text-[#0047AB]" />
                          </div>
                          <div>
                            <h3 className="line-clamp-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-[#0047AB] dark:text-white dark:group-hover:text-[#66B2FF]">
                              {job.title}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {job.companyName || t("common.company")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <DollarSign className="h-4 w-4 shrink-0" />
                          <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{job.location || t("common.hoChiMinh")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>{job.workType || t("compHomepageRedesign.fullTime")}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={`text-xs ${getLevelBadgeColor(job.level)}`}>
                          {job.level || t("sharedSpeechplaygroundpage.areNot")}
                        </Badge>
                        {job.skills?.slice(0, 2).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs dark:border-slate-600 dark:text-slate-400">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isSearching && jobs.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-700">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {t("compHomepageRedesign.noLocationsFound")}
              </h3>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                {t("compHomepageRedesign.tryAdjustingYourSearchKeywords")}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
