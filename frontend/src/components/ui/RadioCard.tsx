import React from "react";

export interface RadioCardOption {
  value: string;
  title: string;
  description: string;
}

export interface RadioCardGroupProps {
  name: string;
  options: RadioCardOption[];
  selectedValue: string;
  onChange: (val: string) => void;
}

export const RadioCardGroup: React.FC<RadioCardGroupProps> = ({
  name,
  options,
  selectedValue,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {options.map((opt) => {
        const isSelected = opt.value === selectedValue;
        return (
          <label
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-start gap-2.5 p-3 bg-white border rounded-[2px] cursor-pointer transition-colors ${
              isSelected
                ? "border-[#0972D3] ring-1 ring-[#0972D3]"
                : "border-[#8D9BAA] hover:border-[#0972D3]"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 text-[#0972D3] focus:ring-[#0972D3]"
            />
            <div className="flex flex-col">
              <span className="font-bold text-[12px] text-[#16191F]">{opt.title}</span>
              <span className="text-[11px] text-[#5F6B7A] mt-0.5">{opt.description}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
};
