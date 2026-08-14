"use client";

import React from "react";

export default function HealthChecksPage() {
  return (
    <div className="flex flex-col flex-1">
      <div className="p-6 max-w-[1200px] w-full mx-auto">
        <h1 className="text-[20px] font-bold text-[#16191F] mb-4">Health checks</h1>
        <div className="bg-white border border-[#E9EAEA] rounded-[2px] p-12 text-center flex flex-col items-center gap-2">
          <span className="text-[32px]">❤️</span>
          <h2 className="text-[16px] font-bold text-[#16191F]">Health Checks Coming Soon</h2>
          <p className="text-[13px] text-[#5F6B7A] max-w-md m-0">
            Monitor endpoint health and configure automated failover routing for your DNS records.
          </p>
        </div>
      </div>
    </div>
  );
}
