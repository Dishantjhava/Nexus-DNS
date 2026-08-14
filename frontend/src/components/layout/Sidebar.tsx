"use client";

import React from "react";
import SideNavigation, { SideNavigationProps } from "@cloudscape-design/components/side-navigation";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { showFeatureNotAvailable } = useToast();

  const navItems: SideNavigationProps.Item[] = [
    { type: "link", text: "Dashboard", href: "/dashboard" },
    { type: "link", text: "Hosted zones", href: "/hosted-zones" },
    { type: "link", text: "Health checks", href: "/health-checks" },
    { type: "link", text: "Profiles", href: "/profiles" },
    {
      type: "section",
      text: "Global Resolver",
      items: [
        { type: "link", text: "Global resolvers", href: "/resolver/global", info: <span className="text-[10px] text-[#0972D3] font-bold">New</span> },
        { type: "link", text: "Shared DNS views", href: "/resolver/shared", info: <span className="text-[10px] text-[#0972D3] font-bold">New</span> },
      ],
    },
    {
      type: "section",
      text: "VPC Resolver",
      items: [
        { type: "link", text: "VPCs", href: "#vpcs" },
        { type: "link", text: "Inbound endpoints", href: "#inbound" },
        { type: "link", text: "Outbound endpoints", href: "#outbound" },
        { type: "link", text: "Rules", href: "#rules" },
        { type: "link", text: "Query logging", href: "#query-logging" },
        { type: "link", text: "Outposts", href: "#outposts" },
      ],
    },
    {
      type: "section",
      text: "Domains",
      items: [
        { type: "link", text: "Registered domains", href: "#domains" },
        { type: "link", text: "Requests", href: "#requests" },
      ],
    },
    {
      type: "section",
      text: "IP-based routing",
      items: [],
    },
  ];

  return (
    <SideNavigation
      activeHref={pathname}
      header={{ href: "/hosted-zones", text: "Route 53" }}
      items={navItems}
      onFollow={(e) => {
        if (!e.detail.external) {
          e.preventDefault();
          if (e.detail.href.startsWith("/")) {
            router.push(e.detail.href);
          } else {
            showFeatureNotAvailable(e.detail.text || "Feature");
          }
        }
      }}
    />
  );
};
