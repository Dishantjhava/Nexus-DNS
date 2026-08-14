import React from "react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-[#16191F]">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="w-6 h-6 flex items-center justify-center border border-[#8D9BAA] bg-white rounded-[2px] hover:bg-[#F2F3F3] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[12px]"
        aria-label="Previous page"
      >
        ⟨
      </button>
      <span className="font-bold px-1">{page}</span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="w-6 h-6 flex items-center justify-center border border-[#8D9BAA] bg-white rounded-[2px] hover:bg-[#F2F3F3] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[12px]"
        aria-label="Next page"
      >
        ⟩
      </button>
    </div>
  );
};
