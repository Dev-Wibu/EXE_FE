import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UsePaginationReturn } from "@/hooks/usePagination";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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

  // Don't render if no data
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-muted-foreground text-sm">
        Hiển thị {startIndex + 1}-{Math.min(endIndex + 1, totalCount)} của {totalCount} kết quả
      </div>

      <div className="flex items-center gap-2">
        {showPageSizeSelector && onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={goToFirstPage}
            disabled={!hasPrevPage}
            title="Trang đầu">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            disabled={!hasPrevPage}
            title="Trang trước">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {visiblePages.map((page, index) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => setPage(page)}>
                {page}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            disabled={!hasNextPage}
            title="Trang sau">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToLastPage}
            disabled={!hasNextPage}
            title="Trang cuối">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {totalPages > 0 && (
          <span className="text-muted-foreground text-sm">
            Trang {currentPage}/{totalPages}
          </span>
        )}
      </div>
    </div>
  );
}
