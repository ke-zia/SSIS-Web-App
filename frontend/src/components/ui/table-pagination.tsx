import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface TablePaginationProps {
  currentPage: number;
  entriesPerPage: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  entriesLabel?: string; // Optional custom label for entries
}

export function TablePagination({
  currentPage,
  entriesPerPage,
  totalEntries,
  onPageChange,
  loading = false,
  entriesLabel = "entries", // Default to "entries" but can be customized
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  // Calculate the 5-page sliding window
  const getVisiblePages = () => {
    if (totalPages <= 0) return [];
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Ensure at least one page is returned
    if (pages.length === 0 && totalPages > 0) {
      pages.push(1);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  // Don't show pagination controls if there's only one page, but still show the info
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startEntry} to {endEntry} of {totalEntries} {entriesLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="text-sm text-muted-foreground">
        Showing {startEntry} to {endEntry} of {totalEntries} {entriesLabel}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          className="h-9"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {/* Show first page and ellipsis if needed */}
          {visiblePages.length > 0 && visiblePages[0] > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(1)}
                className="h-9 w-9 p-0 min-w-[36px]"
                disabled={loading}
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-sm text-muted-foreground">...</span>
              )}
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.length > 0 ? (
            visiblePages.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-9 w-9 p-0 min-w-[36px]"
                disabled={loading}
              >
                {page}
              </Button>
            ))
          ) : (
            // Fallback: show at least current page
            <Button
              variant="default"
              size="sm"
              className="h-9 w-9 p-0 min-w-[36px]"
              disabled={true}
            >
              {currentPage}
            </Button>
          )}

          {/* Show last page and ellipsis if needed */}
          {visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-sm text-muted-foreground">...</span>
              )}
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="h-9 w-9 p-0 min-w-[36px]"
                disabled={loading}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalEntries === 0 || loading}
          className="h-9"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

