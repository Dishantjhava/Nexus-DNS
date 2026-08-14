import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  infoLink?: boolean;
  onInfoClick?: () => void;
  helperText?: string;
  error?: string;
  suffixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, infoLink, onInfoClick, helperText, error, suffixText, className = "", ...props }, ref) => {
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
        <div className="relative flex items-center w-full">
          <input
            ref={ref}
            className={`w-full h-[28px] px-2.5 bg-white border border-[#8D9BAA] rounded-[2px] text-[#16191F] text-[12px] placeholder:text-[#5F6B7A] placeholder:italic focus:outline-none focus:border-[#0972D3] focus:ring-1 focus:ring-[#0972D3] disabled:bg-[#F2F3F3] disabled:text-[#5F6B7A] ${
              error ? "border-[#D13212] focus:border-[#D13212] focus:ring-[#D13212]" : ""
            } ${suffixText ? "pr-24" : ""} ${className}`}
            {...props}
          />
          {suffixText && (
            <span className="absolute right-2.5 text-[#5F6B7A] text-[12px] pointer-events-none select-none font-medium">
              {suffixText}
            </span>
          )}
        </div>
        {helperText && !error && <p className="text-[11px] text-[#5F6B7A] m-0 mt-0.5">{helperText}</p>}
        {error && <p className="text-[11px] text-[#D13212] m-0 mt-0.5 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
