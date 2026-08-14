import React from "react";

export interface SuccessBannerProps {
  message: string;
  subtext?: string;
  onDismiss?: () => void;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({ message, subtext, onDismiss }) => {
  return (
    <div className="w-full bg-[#1D8102] text-white p-4 rounded-[2px] mb-4 flex items-start justify-between shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-[18px] leading-none mt-0.5">✓</span>
        <div>
          <p className="font-bold text-[14px] m-0">{message}</p>
          {subtext && <p className="text-[13px] opacity-90 mt-1 m-0">{subtext}</p>}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-white opacity-80 hover:opacity-100 text-[14px] font-bold p-1"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      )}
    </div>
  );
};
