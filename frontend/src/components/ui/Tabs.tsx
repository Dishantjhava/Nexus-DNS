import React from "react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex border-b border-[#EAECF0] bg-white px-3 text-[12px] font-bold select-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-2 px-3 transition-colors cursor-pointer border-b-2 -mb-[1px] ${
              isActive
                ? "border-[#0972D3] text-[#0972D3]"
                : "border-transparent text-[#5F6B7A] hover:text-[#16191F]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
