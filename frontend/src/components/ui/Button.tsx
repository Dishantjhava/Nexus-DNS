import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "link" | "destructive";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "outline",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold text-[12px] leading-none transition-colors rounded-[2px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none";

  let variantStyles = "";
  if (variant === "primary") {
    // AWS Orange Primary
    variantStyles = "bg-[#EC7211] hover:bg-[#EB5F07] text-white border border-[#EC7211] disabled:bg-[#F2F3F3] disabled:text-[#879596] disabled:border-[#D5DBDB]";
  } else if (variant === "outline") {
    // AWS Standard Outline
    variantStyles = "bg-white hover:bg-[#F2F3F3] text-[#16191F] border border-[#8D9BAA] disabled:bg-white disabled:text-[#879596] disabled:border-[#D5DBDB]";
  } else if (variant === "link") {
    // AWS Blue Link
    variantStyles = "bg-transparent text-[#0972D3] hover:text-[#033160] hover:underline p-0 font-normal border-none shadow-none";
  } else if (variant === "destructive") {
    // AWS Red Destructive
    variantStyles = "bg-[#D13212] hover:bg-[#B32B0F] text-white border border-[#D13212] disabled:bg-[#F2F3F3] disabled:text-[#879596]";
  }

  let sizeStyles = "";
  if (variant !== "link") {
    sizeStyles = size === "sm" ? "px-2.5 py-0.5 text-[11px] h-[24px]" : "px-3 py-1 text-[12px] h-[28px]";
  }

  return (
    <button
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
