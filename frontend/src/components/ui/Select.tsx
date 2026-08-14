import React from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  infoLink?: boolean;
  onInfoClick?: () => void;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, infoLink, onInfoClick, options, helperText, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-0.5 w-full text-[12px]">
        {label && (
          <div className="flex items-center gap-1 font-bold text-[#16191F] mb-0.5">
            <label className="text-[12px]">{label}</label>
            {infoLink && (
              <button
                type="button"
                onClick={onInfoClick}
                className="text-[#0972D3] hover:underline font-normal text-[11px]"
              >
                Info
              </button>
            )}
          </div>
        )}
        <select
          ref={ref}
          className={`w-full h-[28px] px-2.5 bg-white border border-[#8D9BAA] rounded-[2px] text-[#16191F] text-[12px] focus:outline-none focus:border-[#0972D3] focus:ring-1 focus:ring-[#0972D3] disabled:bg-[#F2F3F3] disabled:text-[#5F6B7A] cursor-pointer ${
            error ? "border-[#D13212]" : ""
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {helperText && !error && <p className="text-[11px] text-[#5F6B7A] m-0 mt-0.5">{helperText}</p>}
        {error && <p className="text-[11px] text-[#D13212] m-0 mt-0.5 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
