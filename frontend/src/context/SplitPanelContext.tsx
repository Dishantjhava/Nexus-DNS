"use client";

import React, { createContext, useContext, useState } from "react";
import { DnsRecord } from "@/lib/types";

interface SplitPanelContextType {
  selectedRecord: DnsRecord | null;
  setSelectedRecord: (record: DnsRecord | null) => void;
  splitPanelOpen: boolean;
  setSplitPanelOpen: (open: boolean) => void;
}

const SplitPanelContext = createContext<SplitPanelContextType>({
  selectedRecord: null,
  setSelectedRecord: () => {},
  splitPanelOpen: false,
  setSplitPanelOpen: () => {},
});

export const SplitPanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRecord, setSelectedRecord] = useState<DnsRecord | null>(null);
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);

  const handleSetSelectedRecord = (record: DnsRecord | null) => {
    setSelectedRecord(record);
    setSplitPanelOpen(!!record);
  };

  return (
    <SplitPanelContext.Provider
      value={{
        selectedRecord,
        setSelectedRecord: handleSetSelectedRecord,
        splitPanelOpen,
        setSplitPanelOpen,
      }}
    >
      {children}
    </SplitPanelContext.Provider>
  );
};

export const useSplitPanel = () => useContext(SplitPanelContext);
