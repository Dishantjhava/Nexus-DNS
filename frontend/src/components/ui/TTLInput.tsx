import React from "react";

export interface TTLInputProps {
  value: number;
  onChange: (val: number) => void;
  error?: string;
}

export const TTLInput: React.FC<TTLInputProps> = ({ value, onChange, error }) => {
  return (
    <div className="flex flex-col gap-0.5 w-full text-[12px]">
      <div className="flex items-center gap-1 font-bold text-[#16191F] mb-0.5">
        <label className="text-[12px]">TTL (seconds)</label>
        <span className="text-[#0972D3] font-normal text-[11px]">Info</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={2147483647}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className={`w-full max-w-[180px] h-[28px] px-2.5 bg-white border border-[#8D9BAA] rounded-[2px] text-[#16191F] text-[12px] focus:outline-none focus:border-[#0972D3] focus:ring-1 focus:ring-[#0972D3] ${
            error ? "border-[#D13212]" : ""
          }`}
        />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(60)}
            className="px-2.5 py-0.5 text-[11px] font-bold border border-[#0972D3] text-[#0972D3] rounded-full hover:bg-[#F2F8FD] transition-colors cursor-pointer"
          >
            1m
          </button>
          <button
            type="button"
            onClick={() => onChange(3600)}
            className="px-2.5 py-0.5 text-[11px] font-bold border border-[#0972D3] text-[#0972D3] rounded-full hover:bg-[#F2F8FD] transition-colors cursor-pointer"
          >
            1h
          </button>
          <button
            type="button"
            onClick={() => onChange(86400)}
            className="px-2.5 py-0.5 text-[11px] font-bold border border-[#0972D3] text-[#0972D3] rounded-full hover:bg-[#F2F8FD] transition-colors cursor-pointer"
          >
            1d
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#5F6B7A] m-0 mt-0.5">Recommended values: 60 to 172800 (two days)</p>
      {error && <p className="text-[11px] text-[#D13212] m-0 mt-0.5 font-medium">{error}</p>}
    </div>
  );
};
