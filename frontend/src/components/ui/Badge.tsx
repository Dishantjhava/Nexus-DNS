import React from "react";

export interface BadgeProps {
  type: "PUBLIC" | "PRIVATE";
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
  if (type === "PUBLIC") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[12px] text-[12px] font-bold bg-white text-[#0972D3] border border-[#0972D3]">
        Public
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[12px] text-[12px] font-bold bg-[#F2F3F3] text-[#5F6B7A] border border-[#8D9BAA]">
      Private
    </span>
  );
};
