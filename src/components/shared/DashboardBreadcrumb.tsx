import { Fragment } from "react";
import { Link } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { DashboardBreadcrumbItem } from "@/lib/dashboard-breadcrumb";
import { cn } from "@/lib/utils";

interface DashboardBreadcrumbProps {
  items: DashboardBreadcrumbItem[];
  className?: string;
}

export function DashboardBreadcrumb({ items, className }: DashboardBreadcrumbProps) {
  if (!items.length) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="gap-1 text-sm sm:gap-1.5">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {item.href && !isCurrent ? (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "max-w-44 truncate px-1.5 text-slate-600 hover:text-slate-900",
                        "dark:text-slate-300 dark:hover:text-white"
                      )}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="max-w-52 truncate px-1.5 text-slate-900 dark:text-white">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isCurrent && <BreadcrumbSeparator className="text-slate-400 dark:text-slate-500" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
