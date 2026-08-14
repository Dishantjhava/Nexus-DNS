"use client";

import React from "react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1">
      <div className="p-6 max-w-[1200px] w-full mx-auto">
        <h1 className="text-[20px] font-bold text-[#16191F] mb-4">Dashboard</h1>
        <div className="bg-white border border-[#E9EAEA] rounded-[2px] p-12 text-center flex flex-col items-center gap-2">
          <span className="text-[32px]">📊</span>
          <h2 className="text-[16px] font-bold text-[#16191F]">Dashboard Coming Soon</h2>
          <p className="text-[13px] text-[#5F6B7A] max-w-md m-0">
            Route 53 traffic analytics, domain health overview, and global DNS metrics will be available in a future release.
          </p>
        </div>
      </div>
    </div>
  );
}
