"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/context/ThemeContext";

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { showFeatureNotAvailable } = useToast();
  const { theme, toggleTheme } = useTheme();

  const accountDisplay = user?.username || "admin";

  return (
    <header className="w-full h-[48px] bg-[#0F141C] text-white flex items-center justify-between px-3 sticky top-0 z-40 select-none border-b border-[#232F3E]">
      {/* Left section: AWS Logo, Q badge, 9-dot grid, Search bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex items-center hover:opacity-85 focus:outline-none pr-1 cursor-pointer"
          title="AWS Console"
        >
          <svg className="h-6 w-auto" viewBox="0 0 65 30" fill="none">
            <text x="2" y="20" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="800" letterSpacing="-0.5px">aws</text>
            <path d="M 6 23 Q 28 31 54 20" stroke="#FF9900" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 50 16.5 L 57 20 L 52 24 Z" fill="#FF9900" />
          </svg>
        </button>

        <div className="h-6 w-[1px] bg-[#30363D]"></div>

        {/* Amazon Q gradient icon */}
        <button
          onClick={() => showFeatureNotAvailable("Amazon Q Assistant")}
          className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#6B21A8] via-[#2563EB] to-[#60A5FA] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          title="Amazon Q"
        >
          <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <div className="h-6 w-[1px] bg-[#30363D]"></div>

        {/* 9-dot grid icon */}
        <button
          onClick={() => showFeatureNotAvailable("Services Menu")}
          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          title="Console Services"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
            <circle cx="3" cy="3" r="1.5" /><circle cx="8" cy="3" r="1.5" /><circle cx="13" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="13" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" /><circle cx="8" cy="13" r="1.5" /><circle cx="13" cy="13" r="1.5" />
          </svg>
        </button>

        {/* Spacious Search Bar */}
        <div
          onClick={() => showFeatureNotAvailable("Global Console Search")}
          className="relative flex items-center cursor-pointer w-[480px] h-[32px] bg-[#0F141C] border border-[#30363D] rounded-md px-3 text-white text-xs select-none hover:border-[#58A6FF] transition-colors"
        >
          <span className="text-gray-400 mr-2 text-xs flex items-center gap-1.5 italic">
            <svg className="w-3.5 h-3.5 text-gray-400 fill-current" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
            Search
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-gray-400 bg-[#21262D] px-1.5 py-0.5 rounded border border-[#30363D] font-mono">[Alt+S]</span>
            <span className="w-5 h-5 rounded bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#58A6FF]" title="Ask Amazon Q">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12a5 5 0 110-10 5 5 0 010 10z"/></svg>
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Utilities Icons, Region, User Account */}
      <div className="flex items-center gap-3.5 text-xs font-normal">
        {/* CloudShell button */}
        <button
          onClick={() => showFeatureNotAvailable("CloudShell")}
          className="w-7 h-7 rounded bg-[#161B22] border border-[#30363D] flex items-center justify-center text-[#58A6FF] hover:bg-[#21262D] transition-colors cursor-pointer"
          title="CloudShell"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16"><path d="M6 4l-4 4 4 4M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>

        <div className="h-5 w-[1px] bg-[#30363D]"></div>

        <button onClick={() => showFeatureNotAvailable("Notifications")} className="hover:text-gray-300 p-1 cursor-pointer" title="Notifications">
          <svg className="w-4 h-4 fill-current text-gray-300 hover:text-white" viewBox="0 0 16 16"><path d="M8 1a5 5 0 00-5 5v4l-1.5 1.5h13L13 10V6a5 5 0 00-5-5zM8 15a2 2 0 002-2H6a2 2 0 002 2z"/></svg>
        </button>

        <div className="h-5 w-[1px] bg-[#30363D]"></div>

        <button onClick={() => showFeatureNotAvailable("Help")} className="hover:text-gray-300 p-1 cursor-pointer" title="Help">
          <svg className="w-4 h-4 fill-current text-gray-300 hover:text-white" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/><text x="8" y="11.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">?</text></svg>
        </button>

        <div className="h-5 w-[1px] bg-[#30363D]"></div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#161B22] border border-[#30363D] text-[#58A6FF] hover:bg-[#21262D] transition-colors cursor-pointer text-xs font-semibold"
          title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {theme === "dark" ? (
            <>
              <svg className="w-3.5 h-3.5 fill-current text-[#FF9900]" viewBox="0 0 16 16">
                <path d="M8 12a4 4 0 100-8 4 4 0 000 8zM8 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 0zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 13z" />
              </svg>
              <span>Light</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 fill-current text-[#58A6FF]" viewBox="0 0 16 16">
                <path d="M6 .278a.768.768 0 01.08.858 7.208 7.208 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 01.81.316.733.733 0 01-.031.893A8.349 8.349 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 016 .278z" />
              </svg>
              <span>Dark</span>
            </>
          )}
        </button>

        <div className="h-5 w-[1px] bg-[#30363D]"></div>

        <button onClick={() => showFeatureNotAvailable("Region Selector")} className="flex items-center gap-1.5 text-gray-200 hover:text-white cursor-pointer px-1">
          <svg className="w-4 h-4 fill-current text-gray-300" viewBox="0 0 16 16"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm5.93 7H10.5a13.3 13.3 0 00-.77-4.22A6.52 6.52 0 0113.93 7zM8 1.53c.85 1.44 1.48 3.32 1.7 5.47H6.3C6.52 4.85 7.15 2.97 8 1.53z"/></svg>
          <span>Global ▾</span>
        </button>

        <div className="h-5 w-[1px] bg-[#30363D]"></div>

        {/* Account dropdown */}
        <div className="relative group cursor-pointer">
          <button
            className="flex items-center gap-1 text-[#58A6FF] hover:text-[#79C0FF] font-semibold text-xs focus:outline-none whitespace-nowrap py-1 px-1 rounded hover:bg-[#1C2332] transition-colors"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span>{accountDisplay} (881415009887)</span>
            <svg className="w-3 h-3 fill-current text-gray-400 flex-shrink-0" viewBox="0 0 16 16">
              <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z"/>
            </svg>
          </button>

          {/* Dropdown panel */}
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#161B22] border border-[#30363D] rounded shadow-2xl py-1 w-64 text-left z-50">
            {/* Account info header */}
            <div className="px-4 py-3 border-b border-[#30363D] bg-[#0F141C]">
              <div className="text-[11px] text-gray-400 mb-0.5 font-normal">Signed in as</div>
              <div className="text-[13px] text-white font-bold truncate">{accountDisplay}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Account ID: 8814-1500-9887</div>
            </div>

            {/* Menu items */}
            {[
              "Account",
              "Organization",
              "Service quotas",
              "Security credentials",
              "Switch role",
            ].map((item) => (
              <button
                key={item}
                onClick={() => showFeatureNotAvailable(item)}
                className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#21262D] cursor-pointer transition-colors"
              >
                {item}
              </button>
            ))}

            <button
              onClick={toggleTheme}
              className="w-full text-left px-4 py-2 text-xs text-[#58A6FF] hover:bg-[#21262D] cursor-pointer transition-colors flex items-center justify-between"
            >
              <span>Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-[#30363D] bg-[#0F141C]">
                {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
              </span>
            </button>

            <div className="border-t border-[#30363D] my-1" />

            {/* Sign out — real action */}
            <button
              onClick={() => logout()}
              className="w-full text-left px-4 py-2.5 text-xs text-[#EC7211] hover:bg-[#21262D] cursor-pointer font-bold transition-colors flex items-center justify-between"
            >
              <span>Sign out</span>
              <svg className="w-3.5 h-3.5 fill-current text-[#EC7211]" viewBox="0 0 16 16">
                <path d="M6 2a1 1 0 00-1 1v3h2V4h6v8H7v-2H5v3a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1H6z"/>
                <path d="M4.5 10.5L7 8 4.5 5.5 3.5 6.5 4.79 7.8H0v1.4h4.79L3.5 10.5l1 1z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
