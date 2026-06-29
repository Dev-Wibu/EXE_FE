import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UsePaginationReturn } from "@/hooks/usePagination";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface PaginationControlProps {
  pagination: UsePaginationReturn;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  onPageSizeChange?: (size: number) => void;
}

export function PaginationControl({
  pagination,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  onPageSizeChange,
}: PaginationControlProps) {
  const { t } = useTranslation();
  const {
    currentPage,
    totalPages,
    visiblePages,
    setPage,
    prevPage,
    nextPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    totalCount,
    pageSize,
  } = pagination;

  const [jumpToPageInput, setJumpToPageInput] = useState(String(currentPage));

  useEffect(() => {
    setJumpToPageInput(String(currentPage));
  }, [currentPage]);

  const parsedJumpPage = useMemo(() => {
    const parsed = Number.parseInt(jumpToPageInput, 10);
    return Number.isInteger(parsed) ? parsed : null;
  }, [jumpToPageInput]);

  const isJumpTargetValid =
    parsedJumpPage !== null && parsedJumpPage >= 1 && parsedJumpPage <= totalPages;

  const handlePageSizeSelection = (value: string) => {
    if (!onPageSizeChange) return;
    const nextPageSize = Number(value);
    if (!Number.isInteger(nextPageSize) || nextPageSize <= 0 || nextPageSize === pageSize) return;
    onPageSizeChange(nextPageSize);
    goToFirstPage();
  };

  const handleJumpToPage = () => {
    if (!isJumpTargetValid || parsedJumpPage === null) return;
    setPage(parsedJumpPage);
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-1">
      {/* Left: info */}
      <p className="text-muted-foreground text-xs">
        {startIndex + 1}-{Math.min(endIndex + 1, totalCount)} / {totalCount}
      </p>

      {/* Right: page buttons + go-to-page + page-size */}
      <div className="flex items-center gap-1">
        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={handlePageSizeSelection}>
            <SelectTrigger className="h-7 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size} / {t("common.perPage")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Page navigation buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon"
            onClick={goToFirstPage}
            disabled={!hasPrevPage}
            title={t("compShared.frontPage")}
            className="h-7 w-7">
            <ChevronsLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            disabled={!hasPrevPage}
            title={t("compShared.previousPage")}
            className="h-7 w-7">
            <ChevronLeft className="h-3 w-3" />
          </Button>

          {visiblePages.map((page, index) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="text-muted-foreground px-0.5 text-xs">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => setPage(page)}
                className="h-7 w-7 text-xs">
                {page}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            disabled={!hasNextPage}
            title={t("compShared.nextPageTitle")}
            className="h-7 w-7">
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToLastPage}
            disabled={!hasNextPage}
            title={t("compShared.lastPage")}
            className="h-7 w-7">
            <ChevronsRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Go to page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-0.5">
            <Input
              value={jumpToPageInput}
              onChange={(event) => setJumpToPageInput(event.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleJumpToPage();
                }
              }}
              inputMode="numeric"
              aria-label={t("compShared.enterThePageNumber")}
              placeholder={t("compShared.number")}
              className="h-7 w-10 text-center text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              className="h-7 px-1.5 text-xs">
              {"Go"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
