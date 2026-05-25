import { ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { companyManager, type Company } from "@/services/company.manager";

// Icon mapping for industries
const industryIcons: Record<string, React.ReactNode> = {
  smart_toy: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="8.5" cy="15" r="1.5" />
      <circle cx="15.5" cy="15" r="1.5" />
      <path d="M12 3v4M7 7h10" />
    </svg>
  ),
  shopping_cart: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  security: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  cloud_done: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      <path d="M8.5 14.5l2 2 4-4" />
    </svg>
  ),
  account_balance: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  memory: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 18L18 6M6 6l12 12" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  ),
  default: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
};

function getIconForDescription(description?: string): React.ReactNode {
  if (!description) return industryIcons.default;
  const desc = description.toLowerCase();

  if (desc.includes("ai") || desc.includes("machine learning") || desc.includes("generative")) {
    return industryIcons.smart_toy;
  }
  if (desc.includes("cybersecurity") || desc.includes("security")) {
    return industryIcons.security;
  }
  if (desc.includes("cloud") || desc.includes("saas")) {
    return industryIcons.cloud_done;
  }
  if (desc.includes("fintech") || desc.includes("finance")) {
    return industryIcons.account_balance;
  }
  if (desc.includes("data") || desc.includes("science")) {
    return industryIcons.memory;
  }

  return industryIcons.default;
}

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

export function CompanyGridSection() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);

      try {
        const result = await companyManager.getAll();

        if (result.success && result.data) {
          const data = result.data;
          if (Array.isArray(data)) {
            setCompanies(data);
          } else if (data && "content" in data) {
            setCompanies((data as { content: Company[] }).content);
          }
        }
      } catch (err) {
        console.error("[CompanyGridSection] Fetch error:", err);
      }

      setIsLoading(false);
    };

    fetchCompanies();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* Section Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
            Hệ sinh thái công ty giả lập
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tham gia ứng tuyển vào các môi trường giả lập chuyên nghiệp
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          className="group gap-1 text-[#0047AB] hover:text-[#0047AB] dark:text-[#66B2FF] dark:hover:text-[#66B2FF]">
          <Link to="/enterprise/companies">
            Xem tất cả {companies.length} đối tác
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#0047AB]" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && companies.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <p className="text-slate-600 dark:text-slate-400">
            Chưa có công ty nào. Vui lòng quay lại sau.
          </p>
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
                className="group cursor-pointer rounded-xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0047AB]/10 dark:border-slate-700/50 dark:bg-slate-900/70">
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
                      <div className={colorScheme.text}>
                        {getIconForDescription(company.description)}
                      </div>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${colorScheme.bg} ${colorScheme.text}`}>
                    {company.jobDescriptions?.length || 0} vị trí
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-[#0047AB] dark:text-white dark:group-hover:text-[#66B2FF]">
                  {company.name}
                </h3>

                <div className="mb-5 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>{company.description}</span>
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
    </section>
  );
}
