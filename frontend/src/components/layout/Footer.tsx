"use client";

import React from "react";
import { useToast } from "@/context/ToastContext";

export const Footer: React.FC = () => {
  const { showFeatureNotAvailable } = useToast();

  return (
    <footer className="w-full h-7 bg-[#161B22] text-[#AAB7B8] text-[11px] px-3 flex items-center justify-between border-t border-[#232F3E] select-none z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => showFeatureNotAvailable("CloudShell")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px]">☁</span> CloudShell
        </button>
        <button
          onClick={() => showFeatureNotAvailable("Agent Toolkit for AWS")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px]">🤖</span> Agent Toolkit for AWS
        </button>
        <button
          onClick={() => showFeatureNotAvailable("Feedback")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Feedback
        </button>
        <button
          onClick={() => showFeatureNotAvailable("Console mobile app")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px]">📲</span> Console mobile app
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span>© 2026, Amazon Web Services, Inc. or its affiliates.</span>
        <button
          onClick={() => showFeatureNotAvailable("Privacy")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Privacy
        </button>
        <button
          onClick={() => showFeatureNotAvailable("Terms")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Terms
        </button>
        <button
          onClick={() => showFeatureNotAvailable("Cookie preferences")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Cookie preferences
        </button>
      </div>
    </footer>
  );
};
