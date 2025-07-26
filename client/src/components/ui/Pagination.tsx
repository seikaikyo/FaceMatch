import React from 'react';
import clsx from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showSizeChanger?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showSizeChanger = false,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const generatePages = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pages = generatePages();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {showSizeChanger && onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">每頁顯示</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">筆</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {/* 上一頁 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(
            'px-3 py-2 text-sm font-medium rounded-md',
            {
              'text-gray-500 cursor-not-allowed': currentPage === 1,
              'text-gray-700 hover:bg-gray-100': currentPage > 1,
            }
          )}
        >
          上一頁
        </button>

        {/* 第一頁 */}
        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              1
            </button>
            {pages[0] > 2 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}

        {/* 頁數按鈕 */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={clsx(
              'px-3 py-2 text-sm font-medium rounded-md',
              {
                'bg-primary-500 text-white': page === currentPage,
                'text-gray-700 hover:bg-gray-100': page !== currentPage,
              }
            )}
          >
            {page}
          </button>
        ))}

        {/* 最後一頁 */}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* 下一頁 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={clsx(
            'px-3 py-2 text-sm font-medium rounded-md',
            {
              'text-gray-500 cursor-not-allowed': currentPage === totalPages,
              'text-gray-700 hover:bg-gray-100': currentPage < totalPages,
            }
          )}
        >
          下一頁
        </button>
      </div>
    </div>
  );
};