import { CheckCircle2, Plus, PlusCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { Company } from "../types";

interface CompanyListSidebarProps {
  companies: Company[];
  selectedCompanyId: number | null;
  onSelectCompany: (id: number) => void;
  onCreateCompany: () => void;
  className?: string;
}

export function CompanyListSidebar({
  companies,
  selectedCompanyId,
  onSelectCompany,
  onCreateCompany,
  className,
}: CompanyListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const lowerQuery = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(lowerQuery) ||
        c.description?.toLowerCase().includes(lowerQuery)
    );
  }, [companies, searchQuery]);

  return (
    <aside
      className={cn(
        "border-border bg-background/50 flex min-h-0 w-80 flex-col border-r p-4",
        className
      )}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
          Danh sách đối tác
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateCompany}
          className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8"
          title="Thêm đối tác">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Tìm công ty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="-mx-2 min-h-0 flex-1 px-2">
        <div className="space-y-3 pb-4">
          {filteredCompanies.map((company) => {
            const isSelected = company.id === selectedCompanyId;
            const openJobsCount = company.jobDescriptions?.length ?? 0;

            return (
              <div
                key={company.id}
                onClick={() => company.id && onSelectCompany(company.id)}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                  isSelected
                    ? "border-primary/30 bg-primary/10 ring-primary/20 shadow-sm ring-1"
                    : "bg-card/50 hover:border-primary/20 hover:bg-card border-transparent hover:shadow-sm"
                )}>
                <Avatar className="border-border/50 h-10 w-10 border bg-white">
                  <AvatarImage
                    src={company.logoUrl}
                    alt={company.name}
                    className="object-contain p-1"
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {company.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-1 flex-col">
                  <h4
                    className={cn(
                      "group-hover:text-primary truncate text-sm font-bold transition-colors",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                    {company.name}
                  </h4>
                  <p
                    className={cn(
                      "text-xs",
                      isSelected ? "text-primary font-semibold" : "text-muted-foreground"
                    )}>
                    {openJobsCount} JD đang tuyển
                  </p>
                </div>

                {isSelected && <CheckCircle2 className="text-primary h-5 w-5 shrink-0" />}
              </div>
            );
          })}

          <button
            onClick={onCreateCompany}
            className="group border-border/60 hover:bg-muted/50 hover:border-primary/50 flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed py-4 transition-colors">
            <PlusCircle className="text-muted-foreground group-hover:text-primary h-6 w-6 transition-colors" />
            <span className="text-muted-foreground group-hover:text-primary text-xs font-bold transition-colors">
              Thêm Đối tác
            </span>
          </button>
        </div>
      </ScrollArea>
    </aside>
  );
}
