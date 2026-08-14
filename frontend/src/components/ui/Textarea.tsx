import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  infoLink?: boolean;
  onInfoClick?: () => void;
  helperText?: string;
  error?: string;
  charCount?: { current: number; max: number };
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, infoLink, onInfoClick, helperText, error, charCount, className = "", ...props }, ref) => {
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
        <textarea
          ref={ref}
          className={`w-full min-h-[70px] p-2 bg-white border border-[#8D9BAA] rounded-[2px] text-[#16191F] text-[12px] placeholder:text-[#5F6B7A] placeholder:italic focus:outline-none focus:border-[#0972D3] focus:ring-1 focus:ring-[#0972D3] disabled:bg-[#F2F3F3] disabled:text-[#5F6B7A] ${
            error ? "border-[#D13212] focus:border-[#D13212] focus:ring-[#D13212]" : ""
          } ${className}`}
          {...props}
        />
        <div className="flex justify-between items-center text-[11px] text-[#5F6B7A] m-0">
          <div>{helperText && !error && <span>{helperText}</span>}</div>
          {charCount && (
            <span>
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
        {error && <p className="text-[11px] text-[#D13212] m-0 font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
