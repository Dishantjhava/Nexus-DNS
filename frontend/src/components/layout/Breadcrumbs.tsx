"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useSplitPanel } from "@/context/SplitPanelContext";
import { useBreadcrumbs, BreadcrumbItem } from "@/context/BreadcrumbContext";
import { useTheme } from "@/context/ThemeContext";

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  onToggleSidebar?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items: propItems, onToggleSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { showFeatureNotAvailable } = useToast();
  const { splitPanelOpen, setSplitPanelOpen } = useSplitPanel();
  const { customBreadcrumbs } = useBreadcrumbs();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getInferredItems = (): BreadcrumbItem[] => {
    const list: BreadcrumbItem[] = [{ label: "Route 53", href: "/hosted-zones" }];
    
    if (pathname.startsWith("/hosted-zones")) {
      list.push({ label: "Hosted zones", href: "/hosted-zones" });
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length === 2 && parts[1] === "create") {
        list.push({ label: "Create hosted zone" });
      } else if (parts.length >= 2 && parts[1] !== "create") {
        if (parts.length === 3 && parts[2] === "create-record") {
          list.push({ label: parts[1], href: `/hosted-zones/${parts[1]}` });
          list.push({ label: "Create record" });
        } else if (parts.length === 3 && parts[2] === "test-record") {
          list.push({ label: parts[1], href: `/hosted-zones/${parts[1]}` });
          list.push({ label: "Test record" });
        } else if (parts.length === 3 && parts[2] === "configure-query-logging") {
          list.push({ label: parts[1], href: `/hosted-zones/${parts[1]}` });
          list.push({ label: "Configure query logging" });
        } else if (parts.length === 4 && parts[2] === "edit-record") {
          list.push({ label: parts[1], href: `/hosted-zones/${parts[1]}` });
          list.push({ label: "Edit record" });
        } else {
          list.push({ label: parts[1] });
        }
      }
    } else if (pathname === "/dashboard") {
      list.push({ label: "Dashboard" });
    } else if (pathname === "/health-checks") {
      list.push({ label: "Health checks" });
    } else if (pathname === "/profiles") {
      list.push({ label: "Profiles" });
    }

    return list;
  };

  const items = propItems || customBreadcrumbs || getInferredItems();

  return (
    <div className={`w-full h-[38px] px-3 flex items-center justify-between select-none z-30 sticky top-[48px] border-b ${
      isDark ? "bg-[#0F1B2A] border-[#233246]" : "bg-white border-[#EAECF0]"
    }`}>
      {/* Left: Blue Hamburger Button + Underlined Breadcrumb Links */}
      <div className="flex items-center gap-3 text-[14px]">
        <button
          onClick={onToggleSidebar}
          className="w-6 h-6 rounded-full bg-[#0972D3] hover:bg-[#075BB3] text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-none flex-shrink-0"
          title="Toggle Navigation"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
            <path d="M2 3.5h12a.75.75 0 010 1.5H2a.75.75 0 010-1.5zm0 4h12a.75.75 0 010 1.5H2a.75.75 0 010-1.5zm0 4h12a.75.75 0 010 1.5H2a.75.75 0 010-1.5z"/>
          </svg>
        </button>

        <nav className="flex items-center gap-1.5 font-sans">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <span className={`text-[12px] font-normal mx-0.5 ${isDark ? "text-[#9BA7B6]" : "text-[#5F6B7A]"}`}>❯</span>}
                {isLast || !item.href ? (
                  <span className={`font-semibold text-[14px] ${isDark ? "text-[#E9EDF0]" : "text-[#16191F]"}`}>{item.label}</span>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href!);
                    }}
                    className={`underline font-medium text-[14px] transition-colors ${
                      isDark ? "text-[#539FE5] hover:text-[#79C0FF]" : "text-[#0972D3] hover:text-[#075BB3]"
                    }`}
                  >
                    {item.label}
                  </a>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Split Panel Toggle, Info, Divider, Preferences */}
      <div className={`flex items-center gap-3 ${isDark ? "text-[#E9EDF0]" : "text-[#16191F]"}`}>
        <button
          onClick={() => setSplitPanelOpen(!splitPanelOpen)}
          className={`p-1 transition-colors cursor-pointer ${
            splitPanelOpen
              ? (isDark ? "text-[#539FE5]" : "text-[#0972D3]")
              : (isDark ? "text-[#E9EDF0] hover:text-[#539FE5]" : "text-[#16191F] hover:text-[#0972D3]")
          }`}
          title="Toggle split panel"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1.5" y="1.5" width="13" height="13" rx="1" />
            <path d="M10.5 1.5v13" />
          </svg>
        </button>

        <button
          onClick={() => showFeatureNotAvailable("Info panel")}
          className={`p-1 transition-colors cursor-pointer ${
            isDark ? "text-[#E9EDF0] hover:text-[#539FE5]" : "text-[#16191F] hover:text-[#0972D3]"
          }`}
          title="Info"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 7.5v4.5M8 4.5v.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className={`h-4 w-[1px] mx-0.5 ${isDark ? "bg-[#233246]" : "bg-[#D5DBDB]"}`}></div>

        <button
          onClick={() => showFeatureNotAvailable("Preferences")}
          className={`p-1 transition-colors cursor-pointer ${
            isDark ? "text-[#E9EDF0] hover:text-[#539FE5]" : "text-[#16191F] hover:text-[#0972D3]"
          }`}
          title="Preferences"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1c.895.264 1.318 1.285.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
