"use client";

import React, { useState } from "react";

export interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = false,
  rightAction,
  children,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="w-full bg-white border border-[#E9EAEA] rounded-[2px] mb-4">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E9EAEA]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-[16px] font-bold text-[#16191F] hover:text-[#0972D3] transition-colors cursor-pointer select-none"
        >
          <span className="text-[12px]">{expanded ? "▼" : "▶"}</span>
          <span>{title}</span>
        </button>
        {rightAction && <div>{rightAction}</div>}
      </div>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  );
};
