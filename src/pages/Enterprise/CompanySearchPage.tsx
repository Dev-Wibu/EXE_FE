import { Building2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { companyManager, type Company } from "@/services/company.manager";

function getColorScheme(index: number) {
  const schemes = [
    { bg: "bg-[#0047AB]/10", border: "border-[#0047AB]/20", text: "text-[#0047AB]" },
    { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500" },
    { bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-500" },
    { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500" },
    { bg: "bg-[#007BFF]/10", border: "border-[#007BFF]/20", text: "text-[#007BFF]" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  ];
  return schemes[index % schemes.length];
}

export function CompanySearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search when query param changes
  useEffect(() => {
    if (query) {
      setSearchInput(query);
      searchCompanies(query);
    } else {
      // Load all companies when no query
      searchCompanies("");
    }
  }, [query]);

  const searchCompanies = async (searchTerm: string) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await companyManager.getAll();

      if (result.success && result.data) {
        let companyList: Company[] = [];
        const data = result.data;
        if (Array.isArray(data)) {
          companyList = data;
        } else if (data && "content" in data) {
          companyList = (data as { content: Company[] }).content;
        }

        // Filter by search term if provided
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          companyList = companyList.filter(
            (company) =>
              company.name?.toLowerCase().includes(term) ||
              company.description?.toLowerCase().includes(term) ||
              company.industry?.toLowerCase().includes(term)
          );
        }

        setCompanies(companyList);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error("[CompanySearchPage] Search error:", err);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchInput });
  };

  const handleClear = () => {
    setSearchInput("");
    setSearchParams({});
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <HomepageHeader />

      {/* Main Content - Add top padding to account for fixed header */}
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-8 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên công ty, ngành nghề..."
                className="h-12 pr-4 pl-12"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit" className="ml-2 h-12 bg-[#0047AB] px-6">
                Tìm kiếm
              </Button>
            </div>
          </form>

          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isLoading ? (
                "Đang tìm kiếm..."
              ) : (
                <>
                  Tìm thấy{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {companies.length}
                  </span>{" "}
                  công ty
                  {query && (
                    <span className="ml-2">
                      cho "<span className="font-medium">{query}</span>"
                    </span>
                  )}
                </>
              )}
            </p>
            {!isLoading && hasSearched && query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-sm text-slate-500 hover:text-[#0047AB]">
                Xóa tìm kiếm
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0047AB] border-t-transparent" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && hasSearched && companies.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-700">
                  <Building2 className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Không tìm thấy công ty nào
              </h3>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Thử tìm kiếm với từ khóa khác hoặc xem tất cả công ty
              </p>
              <Button
                variant="outline"
                onClick={handleClear}
                className="border-[#0047AB] text-[#0047AB] hover:bg-[#0047AB]/10 dark:border-[#66B2FF] dark:text-[#66B2FF]">
                Xem tất cả công ty
              </Button>
            </div>
          )}

          {/* Company Grid */}
          {!isLoading && companies.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company, index) => {
                const colorScheme = getColorScheme(index);
                return (
                  <Link
                    key={company.id}
                    to={`/enterprise/company/${company.id}`}
                    className="group cursor-pointer rounded-xl border border-slate-200/50 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0047AB]/10 dark:border-slate-700/50 dark:bg-slate-800">
                    <div className="mb-4 flex items-start justify-between">
                      {/* Logo */}
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl border ${colorScheme.bg} ${colorScheme.border}`}>
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="h-10 w-10 rounded-lg object-contain"
                          />
                        ) : (
                          <Building2 className={`h-8 w-8 ${colorScheme.text}`} />
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${colorScheme.bg} ${colorScheme.text}`}>
                        {company.jobDescriptions?.length || 0} vị trí
                      </span>
                    </div>

                    <h3 className="mb-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-[#0047AB] dark:text-white dark:group-hover:text-[#66B2FF]">
                      {company.name || "Công ty"}
                    </h3>

                    <div className="mb-5 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>{company.description || company.industry || "Công nghệ"}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-4 dark:border-slate-700/50">
                      <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full border-2 border-white bg-[#DCEEFF] dark:border-slate-800 dark:bg-[#0047AB]/30" />
                        <div className="h-6 w-6 rounded-full border-2 border-white bg-[#A5C8F2] dark:border-slate-800 dark:bg-[#66B2FF]/30" />
                        <div className="h-6 w-6 rounded-full border-2 border-white bg-[#66B2FF] dark:border-slate-800 dark:bg-[#007BFF]/30" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Nhiều người đã tham gia
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
