import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = "", ...props }) => {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] text-[#16191F] select-none">
      <input
        type="checkbox"
        className={`w-4 h-4 rounded-[2px] border-[#8D9BAA] text-[#0972D3] focus:ring-[#0972D3] cursor-pointer disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};
