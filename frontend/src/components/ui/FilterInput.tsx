import React from "react";

export interface FilterInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const FilterInput: React.FC<FilterInputProps> = ({
  value,
  onChange,
  placeholder = "Filter records by property or value",
}) => {
  return (
    <div className="relative flex items-center w-full max-w-lg">
      <span className="absolute left-2.5 text-[#5F6B7A] pointer-events-none text-[12px]">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[28px] pl-8 pr-7 bg-white border border-[#8D9BAA] rounded-[2px] text-[12px] text-[#16191F] placeholder:text-[#5F6B7A] placeholder:italic focus:outline-none focus:border-[#0972D3] focus:ring-1 focus:ring-[#0972D3]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 text-[#5F6B7A] hover:text-[#16191F] text-[12px] font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
};
