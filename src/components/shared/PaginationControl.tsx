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
    if (!onPageSizeChange) {
      return;
    }

    const nextPageSize = Number(value);
    if (!Number.isInteger(nextPageSize) || nextPageSize <= 0 || nextPageSize === pageSize) {
      return;
    }

    onPageSizeChange(nextPageSize);
    goToFirstPage();
  };

  const handleJumpToPage = () => {
    if (!isJumpTargetValid || parsedJumpPage === null) {
      return;
    }

    setPage(parsedJumpPage);
  };

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
          <Select value={String(pageSize)} onValueChange={handlePageSizeSelection}>
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

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Đến trang</span>
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
              aria-label="Nhập số trang"
              placeholder="Số"
              className="h-9 w-16 text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              disabled={!isJumpTargetValid || parsedJumpPage === currentPage}>
              Đi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
