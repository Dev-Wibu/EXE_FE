import { Briefcase, Building2, DollarSign, MapPin, Search } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { companyManager, type JobDescription } from "@/services/company.manager";

export function JobSearchSection() {
  const cardRef = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [salaryRange, setSalaryRange] = useState<string>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    }
  };

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

      switch (salaryRange) {
        case "1":
          params.salaryMax = 10000000;
          break;
        case "2":
          params.salaryMin = 10000000;
          params.salaryMax = 20000000;
          break;
        case "3":
          params.salaryMin = 20000000;
          params.salaryMax = 40000000;
          break;
        case "4":
          params.salaryMin = 40000000;
          break;
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
      return `Từ ${format(min)} ${currency || "VND"}`;
    }
    if (max) {
      return `Đến ${format(max)} ${currency || "VND"}`;
    }
    return "Thỏa thuận";
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
      <div
        ref={cardRef}
        className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-xl transition-all duration-200 ease-out dark:border-slate-700/50 dark:bg-slate-900/70"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: "preserve-3d" }}>
        <div className="mb-6">
          <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
            Tìm kiếm cơ hội nghề nghiệp
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Khám phá các vị trí tuyển dụng phù hợp với lộ trình phát triển của bạn
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí, kỹ năng hoặc công ty..."
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
                Cấp bậc
              </label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="fresher">Fresher</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Filter */}
            <div className="min-w-[140px] flex-1 sm:max-w-[200px] sm:min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Mức lương
              </label>
              <Select value={salaryRange} onValueChange={setSalaryRange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="1">Dưới 10 triệu</SelectItem>
                  <SelectItem value="2">10 - 20 triệu</SelectItem>
                  <SelectItem value="3">20 - 40 triệu</SelectItem>
                  <SelectItem value="4">Trên 40 triệu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-10 gap-2 bg-[#0047AB] px-6 hover:bg-[#003d8f]">
              {isSearching ? (
                <>
                  <Search className="h-4 w-4 animate-spin" />
                  Đang tìm...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Tìm kiếm
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
                "Đang tìm kiếm..."
              ) : (
                <>
                  Tìm thấy{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {jobs.length}
                  </span>{" "}
                  vị trí
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
                              {job.companyName || "Công ty"}
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
                          <span>{job.location || "Hồ Chí Minh"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>{job.workType || "Toàn thời gian"}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={`text-xs ${getLevelBadgeColor(job.level)}`}>
                          {job.level || "Không xác định"}
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
                Không tìm thấy vị trí nào
              </h3>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ bớt bộ lọc
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
