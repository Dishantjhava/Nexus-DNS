"use client";

import React from "react";
import { useRouter } from "next/navigation";
import SplitPanel from "@cloudscape-design/components/split-panel";
import Button from "@cloudscape-design/components/button";
import { DnsRecord } from "@/lib/types";
import { useToast } from "@/context/ToastContext";

interface RecordSplitPanelProps {
  zoneId?: number;
  record: DnsRecord | null;
  onClose: () => void;
}

// Exact AWS Blue Double-Square Copy Icon matching target screenshot
const CopyIcon: React.FC<{ onClick: () => void; title: string }> = ({ onClick, title }) => (
  <button
    onClick={onClick}
    className="p-0 text-[#0972D3] hover:text-[#075BB3] transition-colors focus:outline-none cursor-pointer flex-shrink-0"
    title={title}
  >
    <svg className="w-4 h-4" viewBox="0 0 18 18" fill="none">
      <rect x="5" y="5" width="9" height="9" rx="1" stroke="#0972D3" strokeWidth="1.5" fill="none" />
      <path d="M3 11H2a1 1 0 01-1-1V3a1 1 0 011-1h7a1 1 0 011 1v1" stroke="#0972D3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </button>
);

export const RecordSplitPanel: React.FC<RecordSplitPanelProps> = ({ zoneId, record }) => {
  const router = useRouter();
  const { addToast } = useToast();

  if (!record) {
    return (
      <SplitPanel
        header="0 records selected"
        closeBehavior="collapse"
        hidePreferencesButton={true}
      >
        <div className="text-left font-sans text-[14px] text-[#16191F] pt-2 select-none">
          Select a record to see its details
        </div>
      </SplitPanel>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`Copied ${label} to clipboard`, "success");
  };

  const formattedValues = record.values.map((v: unknown) => {
    if (typeof v === "object" && v !== null) {
      if ("priority" in v && "exchange" in v) {
        return `${(v as { priority: number; exchange: string }).priority} ${(v as { priority: number; exchange: string }).exchange}`;
      } else if ("target" in v) {
        const srv = v as { priority: number; weight: number; port: number; target: string };
        return `${srv.priority} ${srv.weight} ${srv.port} ${srv.target}`;
      } else if ("tag" in v) {
        const caa = v as { flag: number; tag: string; value: string };
        return `${caa.flag} ${caa.tag} ${caa.value}`;
      }
      return JSON.stringify(v);
    }
    return String(v);
  });

  return (
    <SplitPanel
      header="Record details"
      closeBehavior="collapse"
      hidePreferencesButton={true}
    >
      <div className="flex flex-col gap-4 text-left font-sans select-none pt-1">
        {/* Edit record Button */}
        <div>
          <Button
            disabled={record.is_system}
            onClick={() => {
              if (zoneId) {
                router.push(`/hosted-zones/${zoneId}/edit-record/${record.id}`);
              }
            }}
          >
            Edit record
          </Button>
        </div>

        {/* Record name */}
        <div className="flex flex-col">
          <span className="text-[12px] text-[#414D5C] font-normal leading-4 mb-1">Record name</span>
          <div className="flex items-center gap-2">
            <CopyIcon onClick={() => copyToClipboard(record.name, "Record name")} title="Copy record name" />
            <span className="text-[13px] text-[#16191F] font-normal leading-5 break-all">{record.name}</span>
          </div>
        </div>

        {/* Record type */}
        <div className="flex flex-col">
          <span className="text-[12px] text-[#414D5C] font-normal leading-4 mb-1">Record type</span>
          <span className="text-[13px] text-[#16191F] font-normal leading-5">{record.type}</span>
        </div>

        {/* Value with left border accent */}
        <div className="flex flex-col">
          <span className="text-[12px] text-[#414D5C] font-normal leading-4 mb-1">Value</span>
          <div className="relative border-l-2 border-[#8795A5] pl-2.5 flex flex-col gap-1.5 py-0.5">
            {formattedValues.map((valStr, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CopyIcon onClick={() => copyToClipboard(valStr, "Record value")} title="Copy value" />
                <span className="text-[13px] text-[#16191F] font-normal leading-5 break-all">{valStr}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alias */}
        <div className="flex flex-col">
          <span className="text-[12px] text-[#414D5C] font-normal leading-4 mb-1">Alias</span>
          <span className="text-[13px] text-[#16191F] font-normal leading-5">No</span>
        </div>

        {/* TTL (seconds) */}
        <div className="flex flex-col">
          <span className="text-[12px] text-[#414D5C] font-normal leading-4 mb-1">TTL (seconds)</span>
          <span className="text-[13px] text-[#16191F] font-normal leading-5">{record.ttl.toLocaleString()}</span>
        </div>

        {/* Routing policy */}
        <div className="flex flex-col">
          <span className="text-[12px] text-[#414D5C] font-normal leading-4 mb-1">Routing policy</span>
          <span className="text-[13px] text-[#16191F] font-normal leading-5">Simple</span>
        </div>
      </div>
    </SplitPanel>
  );
};
