"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Tabs from "@cloudscape-design/components/tabs";
import Badge from "@cloudscape-design/components/badge";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Container from "@cloudscape-design/components/container";
import { HostedZone, DnsRecord, DnsRecordType } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useSplitPanel } from "@/context/SplitPanelContext";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { DeleteZoneModal } from "@/components/ui/DeleteZoneModal";
import { TestRecordModal } from "@/components/ui/TestRecordModal";
import { QueryLoggingModal, QueryLoggingConfig } from "@/components/ui/QueryLoggingModal";
import { ManageTagsModal, TagPair } from "@/components/ui/ManageTagsModal";
import { useMounted } from "@/hooks/useMounted";

interface PageProps {
  params: Promise<{ zoneId: string }>;
}

const TYPE_FILTER_OPTIONS: SelectProps.Option[] = [
  { label: "All record types", value: "" },
  { label: "A", value: "A" },
  { label: "AAAA", value: "AAAA" },
  { label: "CNAME", value: "CNAME" },
  { label: "MX", value: "MX" },
  { label: "NS", value: "NS" },
  { label: "PTR", value: "PTR" },
  { label: "SOA", value: "SOA" },
  { label: "SRV", value: "SRV" },
  { label: "TXT", value: "TXT" },
  { label: "CAA", value: "CAA" },
];

const ROUTING_FILTER_OPTIONS: SelectProps.Option[] = [
  { label: "All routing policies", value: "" },
  { label: "Simple", value: "Simple" },
  { label: "Weighted", value: "Weighted" },
  { label: "Latency", value: "Latency" },
  { label: "Failover", value: "Failover" },
  { label: "Geolocation", value: "Geolocation" },
  { label: "Geoproximity", value: "Geoproximity" },
  { label: "Multivalue answer", value: "Multivalue answer" },
];

const ALIAS_FILTER_OPTIONS: SelectProps.Option[] = [
  { label: "All alias options", value: "" },
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

interface KskItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function HostedZoneDetailPage({ params }: PageProps) {
  const mounted = useMounted();
  const resolvedParams = use(params);
  const zoneId = parseInt(resolvedParams.zoneId, 10);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { showFeatureNotAvailable } = useToast();
  const { setSelectedRecord, setSplitPanelOpen } = useSplitPanel();
  const { setCustomBreadcrumbs } = useBreadcrumbs();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL state for records filter
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const searchParam = searchParams.get("search") || "";
  const typeParam = searchParams.get("type") || "";

  const [search, setSearch] = useState(searchParam);
  const [routingPolicyFilter, setRoutingPolicyFilter] = useState("");
  const [aliasFilter, setAliasFilter] = useState("");
  const [selectedRecordItems, setSelectedRecordItems] = useState<DnsRecord[]>([]);

  // NOTE: selection → split panel is handled directly in onSelectionChange below

  useEffect(() => {
    return () => {
      setSelectedRecord(null);
    };
  }, [setSelectedRecord]);

  // Sync custom breadcrumbs (Route 53 > Hosted zones > domain.com)
  useEffect(() => {
    if (zone?.name) {
      setCustomBreadcrumbs([
        { label: "Route 53", href: "/hosted-zones" },
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: zone.name },
      ]);
    }
    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [zone?.name, setCustomBreadcrumbs]);

  // Modals state
  const [deleteZoneModalOpen, setDeleteZoneModalOpen] = useState(false);
  const [testRecordModalOpen, setTestRecordModalOpen] = useState(false);
  const [queryLoggingModalOpen, setQueryLoggingModalOpen] = useState(false);
  const [queryLoggingConfig, setQueryLoggingConfig] = useState<QueryLoggingConfig | null>(() => {
    if (typeof window === "undefined" || !zoneId) return null;
    try {
      const saved = localStorage.getItem(`nexus_dns_query_log_${zoneId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Accelerated Recovery State
  const [acceleratedRecoveryEnabled, setAcceleratedRecoveryEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined" || !zoneId) return false;
    try {
      return localStorage.getItem(`nexus_dns_accelerated_recovery_${zoneId}`) === "true";
    } catch {
      return false;
    }
  });

  const handleToggleAcceleratedRecovery = () => {
    const next = !acceleratedRecoveryEnabled;
    setAcceleratedRecoveryEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`nexus_dns_accelerated_recovery_${zoneId}`, String(next));
    }
  };

  // DNSSEC Signing State
  const [dnssecEnabled, setDnssecEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined" || !zoneId) return false;
    try {
      return localStorage.getItem(`nexus_dns_dnssec_${zoneId}`) === "true";
    } catch {
      return false;
    }
  });

  const handleToggleDnssec = () => {
    const next = !dnssecEnabled;
    setDnssecEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`nexus_dns_dnssec_${zoneId}`, String(next));
    }
  };

  // Hosted Zone Tags State & CRUD
  const [zoneTags, setZoneTags] = useState<TagPair[]>(() => {
    if (typeof window === "undefined" || !zoneId) return [];
    try {
      const saved = localStorage.getItem(`nexus_dns_tags_${zoneId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [manageTagsModalOpen, setManageTagsModalOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const handleSaveTags = (newTags: TagPair[]) => {
    setZoneTags(newTags);
    if (typeof window !== "undefined") {
      localStorage.setItem(`nexus_dns_tags_${zoneId}`, JSON.stringify(newTags));
    }
  };



  const [deletingRecord, setDeletingRecord] = useState(false);
  const [recordDeleteError, setRecordDeleteError] = useState<string | null>(null);

  // Check for success banner from sessionStorage lazily
  const [createdBannerDomain, setCreatedBannerDomain] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const banner = sessionStorage.getItem("created_zone_name");
    if (banner) {
      sessionStorage.removeItem("created_zone_name");
      return banner;
    }
    return null;
  });

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [zData, rData] = await Promise.all([
          api.zones.get(zoneId),
          api.records.list(zoneId, pageParam, 20, searchParam, (typeParam as DnsRecordType) || undefined),
        ]);
        setZone(zData);
        setRecords(rData.items);
        setTotalRecords(rData.total);
        setTotalPages(rData.total_pages);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load zone details";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [zoneId, pageParam, searchParam, typeParam]
  );

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [zData, rData] = await Promise.all([
          api.zones.get(zoneId),
          api.records.list(zoneId, pageParam, 20, searchParam, (typeParam as DnsRecordType) || undefined),
        ]);
        if (!ignore) {
          setZone(zData);
          setRecords(rData.items);
          setTotalRecords(rData.total);
          setTotalPages(rData.total_pages);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load zone details";
          setError(msg);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [zoneId, pageParam, searchParam, typeParam]);

  // Debounced search handling
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (search) params.set("search", search);
        else params.delete("search");
        router.replace(`/hosted-zones/${zoneId}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchParam, router, zoneId, searchParams]);

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    });
    router.push(`/hosted-zones/${zoneId}?${params.toString()}`);
  };

  const selectedRecord = selectedRecordItems[0];



  const handleDeleteRecord = async () => {
    if (!selectedRecord || selectedRecord.is_system) return;
    if (!confirm(`Are you sure you want to delete record "${selectedRecord.name}"?`)) return;

    setDeletingRecord(true);
    setRecordDeleteError(null);
    try {
      await api.records.delete(zoneId, selectedRecord.id);
      setSelectedRecordItems([]);
      loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete record";
      setRecordDeleteError(msg);
    } finally {
      setDeletingRecord(false);
    }
  };

  if (!mounted || (loading && !zone)) {
    return <Box textAlign="center" padding="l">Loading hosted zone details...</Box>;
  }

  if (error || !zone) {
    return (
      <Box padding="l">
        <Alert type="error">{error || "Hosted zone not found"}</Alert>
      </Box>
    );
  }

  return (
    <SpaceBetween size="l">
      {createdBannerDomain && (
        <Alert
          type="success"
          dismissible
          onDismiss={() => setCreatedBannerDomain(null)}
          header={`${createdBannerDomain} was successfully created.`}
        >
          Now you can create records in the hosted zone to specify how you want Route 53 to route traffic for your domain.
        </Alert>
      )}

      {recordDeleteError && <Alert type="error">{recordDeleteError}</Alert>}

      {/* Page Header */}
      <Header
        variant="h1"
        info={
          <Badge color={zone.zone_type.toUpperCase() === "PUBLIC" ? "blue" : "grey"}>
            {zone.zone_type}
          </Badge>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setDeleteZoneModalOpen(true)}>Delete zone</Button>
            <Button onClick={() => router.push(`/hosted-zones/${zoneId}/test-record`)}>Test record</Button>
            <Button onClick={() => router.push(`/hosted-zones/${zoneId}/configure-query-logging`)}>
              Configure query logging
            </Button>
          </SpaceBetween>
        }
      >
        {zone.name}
      </Header>

      {/* Expandable Hosted Zone Details Container */}
      <ExpandableSection
        headerText="Hosted zone details"
        variant="container"
        defaultExpanded={false}
        headerActions={
          <Button
            onClick={() => router.push(`/hosted-zones/${zoneId}/edit`)}
          >
            Edit hosted zone
          </Button>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          <KeyValuePairs
            items={[
              { label: "Domain name", value: zone.name },
              { label: "Hosted zone ID", value: <code>{zone.public_zone_id}</code> },
              { label: "Type", value: zone.zone_type },
              { label: "Record count", value: zone.record_count },
              { label: "Description", value: zone.description || "-" },
              {
                label: "Query logging",
                value: queryLoggingConfig?.enabled
                  ? `Enabled (${queryLoggingConfig.logGroupArn})`
                  : "Disabled",
              },
            ]}
          />
        </ColumnLayout>
      </ExpandableSection>

      {/* Cloudscape Tabs Container for Records & Features */}
      <Tabs
        tabs={[
          {
            id: "records",
            label: `Records (${totalRecords})`,
            content: (
              <Table<DnsRecord>
                onSelectionChange={({ detail }) => {
                  const items = detail.selectedItems;
                  setSelectedRecordItems(items);
                  if (items.length > 0) {
                    setSelectedRecord(items[0]);
                    setSplitPanelOpen(true);
                  } else {
                    setSelectedRecord(null);
                    setSplitPanelOpen(false);
                  }
                }}
                selectedItems={selectedRecordItems}
                columnDefinitions={[
                  {
                    id: "name",
                    header: "Record name",
                    cell: (rec) =>
                      !rec.is_system ? (
                        <a
                          href={`/hosted-zones/${zoneId}/edit-record/${rec.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/hosted-zones/${zoneId}/edit-record/${rec.id}`);
                          }}
                          className="font-bold text-[#0972D3] hover:underline"
                        >
                          {rec.name}
                        </a>
                      ) : (
                        <span>{rec.name}</span>
                      ),
                    sortingField: "name",
                  },
                  {
                    id: "type",
                    header: "Type",
                    cell: (rec) => <b>{rec.type}</b>,
                  },
                  {
                    id: "routing",
                    header: "Routing",
                    cell: () => "Simple",
                  },
                  {
                    id: "differentiator",
                    header: "Differentiator",
                    cell: () => "-",
                  },
                  {
                    id: "alias",
                    header: "Alias",
                    cell: () => "No",
                  },
                  {
                    id: "values",
                    header: "Value/Route traffic to",
                    cell: (rec) => (
                      <div className="flex flex-col gap-0.5 font-mono text-xs max-w-[500px]">
                        {rec.values.map((v: unknown, i: number) => {
                          let strVal = "";
                          if (typeof v === "object" && v !== null) {
                            if ("priority" in v && "exchange" in v) {
                              strVal = `${(v as { priority: number; exchange: string }).priority} ${(v as { priority: number; exchange: string }).exchange}`;
                            } else if ("target" in v) {
                              const srv = v as { priority: number; weight: number; port: number; target: string };
                              strVal = `${srv.priority} ${srv.weight} ${srv.port} ${srv.target}`;
                            } else if ("tag" in v) {
                              const caa = v as { flag: number; tag: string; value: string };
                              strVal = `${caa.flag} ${caa.tag} ${caa.value}`;
                            } else {
                              strVal = JSON.stringify(v);
                            }
                          } else {
                            strVal = String(v);
                          }
                          return (
                            <div key={i} className="truncate" title={strVal}>
                              {strVal}
                            </div>
                          );
                        })}
                      </div>
                    ),
                  },
                  {
                    id: "ttl",
                    header: "TTL (seconds)",
                    cell: (rec) => rec.ttl.toLocaleString(),
                  },
                ]}
                items={records.filter((rec) => {
                  if (aliasFilter === "Yes" && !rec.alias) return false;
                  if (aliasFilter === "No" && rec.alias) return false;
                  return true;
                })}
                loading={loading || refreshing}
                loadingText="Loading records..."
                selectionType="single"
                trackBy="id"
                empty={
                  <Box textAlign="center" color="inherit">
                    <SpaceBetween size="m">
                      <b>No matches</b>
                      <Box variant="p" color="inherit">
                        No records match the current filter criteria.
                      </Box>
                      <Button
                        onClick={() => {
                          setSearch("");
                          setRoutingPolicyFilter("");
                          setAliasFilter("");
                          updateQueryParams({ search: "", type: "", page: "1" });
                        }}
                      >
                        Clear filter
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
                filter={
                  <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="flex-1 min-w-[200px]">
                      <TextFilter
                        filteringText={search}
                        onChange={({ detail }) => setSearch(detail.filteringText)}
                        filteringPlaceholder="Filter records by property or value"
                      />
                    </div>
                    <div className="w-[170px]">
                      <Select
                        selectedOption={
                          TYPE_FILTER_OPTIONS.find((o) => o.value === typeParam) || TYPE_FILTER_OPTIONS[0]
                        }
                        onChange={({ detail }) =>
                          updateQueryParams({ type: detail.selectedOption.value || "", page: "1" })
                        }
                        options={TYPE_FILTER_OPTIONS}
                        placeholder="Type"
                      />
                    </div>
                    <div className="w-[185px]">
                      <Select
                        selectedOption={
                          ROUTING_FILTER_OPTIONS.find((o) => o.value === routingPolicyFilter) || ROUTING_FILTER_OPTIONS[0]
                        }
                        onChange={({ detail }) => setRoutingPolicyFilter(detail.selectedOption.value || "")}
                        options={ROUTING_FILTER_OPTIONS}
                        placeholder="Routing policy"
                      />
                    </div>
                    <div className="w-[150px]">
                      <Select
                        selectedOption={
                          ALIAS_FILTER_OPTIONS.find((o) => o.value === aliasFilter) || ALIAS_FILTER_OPTIONS[0]
                        }
                        onChange={({ detail }) => setAliasFilter(detail.selectedOption.value || "")}
                        options={ALIAS_FILTER_OPTIONS}
                        placeholder="Alias"
                      />
                    </div>
                  </div>
                }
                header={
                  <Header
                    variant="h2"
                    counter={`(${totalRecords})`}
                    actions={
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          iconName="refresh"
                          loading={refreshing}
                          onClick={() => loadData(true)}
                          ariaLabel="Refresh records table"
                        />
                        <Button
                          disabled={!selectedRecord || selectedRecord.is_system}
                          onClick={() =>
                            selectedRecord && router.push(`/hosted-zones/${zoneId}/edit-record/${selectedRecord.id}`)
                          }
                        >
                          Edit record
                        </Button>
                        <Button
                          disabled={!selectedRecord || selectedRecord.is_system}
                          loading={deletingRecord}
                          onClick={handleDeleteRecord}
                        >
                          Delete record
                        </Button>
                        <Button onClick={() => router.push(`/hosted-zones/${zoneId}/import-zone-file`)}>
                          Import zone file
                        </Button>
                        <Button variant="primary" onClick={() => router.push(`/hosted-zones/${zoneId}/create-record`)}>
                          Create record
                        </Button>
                      </SpaceBetween>
                    }
                  >
                    Records
                  </Header>
                }
                pagination={
                  <Pagination
                    currentPageIndex={pageParam}
                    pagesCount={totalPages}
                    onChange={({ detail }) => updateQueryParams({ page: detail.currentPageIndex.toString() })}
                  />
                }
              />
            ),
          },
          {
            id: "accelerated-recovery",
            label: "Accelerated recovery",
            content: (
              <Container
                header={
                  <Header
                    variant="h2"
                    info={<span className="text-[#0972D3] text-xs cursor-pointer hover:underline">Info</span>}
                    actions={
                      <Button onClick={handleToggleAcceleratedRecovery}>
                        {acceleratedRecoveryEnabled ? "Disable" : "Enable"}
                      </Button>
                    }
                  >
                    Accelerated recovery
                  </Header>
                }
              >
                <SpaceBetween size="m">
                  <Box color="text-body-secondary">
                    Enable the accelerated recovery option to ensure that you can continue to make changes to your public DNS records after an impairment to US East (N. Virginia).
                  </Box>
                  <div>
                    <Box variant="awsui-key-label">Status</Box>
                    <div className="mt-1">
                      {acceleratedRecoveryEnabled ? (
                        <span className="flex items-center gap-1.5 font-semibold text-[#1D8102]">
                          <svg className="w-4 h-4 text-[#1D8102] fill-current" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                            <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z" />
                          </svg>
                          Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[#545B64]">
                          <svg className="w-4 h-4 text-[#545B64] fill-current" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                            <path d="M4 8a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 014 8z" />
                          </svg>
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>
                </SpaceBetween>
              </Container>
            ),
          },
          {
            id: "dnssec-signing",
            label: "DNSSEC signing",
            content: (
              <SpaceBetween size="l">
                <Container
                  header={
                    <Header
                      variant="h2"
                      info={<span className="text-[#0972D3] text-xs cursor-pointer hover:underline">Info</span>}
                      actions={
                        <Button onClick={handleToggleDnssec}>
                          {dnssecEnabled ? "Disable DNSSEC signing" : "Enable DNSSEC signing"}
                        </Button>
                      }
                    >
                      DNSSEC signing
                    </Header>
                  }
                >
                  <SpaceBetween size="m">
                    <div>
                      <Box variant="awsui-key-label">DNSSEC signing status</Box>
                      <div className="mt-1">
                        {dnssecEnabled ? (
                          <span className="flex items-center gap-1.5 font-semibold text-[#1D8102]">
                            <svg className="w-4 h-4 text-[#1D8102] fill-current" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                              <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z" />
                            </svg>
                            Signing
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[#545B64]">
                            <svg className="w-4 h-4 text-[#545B64] fill-current" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                              <path d="M4 8a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 014 8z" />
                            </svg>
                            Not signing
                          </span>
                        )}
                      </div>
                    </div>

                    {!dnssecEnabled && (
                      <Alert
                        type="info"
                        dismissible
                        header="You have not enabled DNSSEC signing for this hosted zone"
                      >
                        To enable DNSSEC signing and have Route 53 create a key-signing key (KSK) for you, choose Enable DNSSEC signing. Next, you must establish a DNSSEC chain of trust for your hosted zone. You&apos;ll complete this step after you enable DNSSEC signing.
                      </Alert>
                    )}
                  </SpaceBetween>
                </Container>

                <Container
                  header={
                    <Header
                      variant="h2"
                      info={<span className="text-[#0972D3] text-xs cursor-pointer hover:underline">Info</span>}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button disabled>View details</Button>
                          <Button onClick={() => showFeatureNotAvailable("Advanced DNSSEC view")}>
                            Switch to advanced view
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Key-signing keys (KSKs)
                    </Header>
                  }
                >
                  <Table<KskItem>
                    columnDefinitions={[
                      { id: "name", header: "Name", cell: (item: KskItem) => <b>{item.name}</b> },
                      {
                        id: "status",
                        header: "Status",
                        cell: (item: KskItem) => (
                          <span className="text-[#1D8102] font-semibold">{item.status}</span>
                        ),
                      },
                      { id: "created_at", header: "Creation date", cell: (item: KskItem) => item.created_at },
                    ]}
                    items={
                      dnssecEnabled
                        ? [
                            {
                              id: "ksk-1",
                              name: `Ksk-881415009887-${zone.name}`,
                              status: "ACTIVE",
                              created_at: new Date().toISOString().split("T")[0],
                            },
                          ]
                        : []
                    }
                    empty={<Box textAlign="center" color="inherit">No key-signing keys.</Box>}
                  />
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "tags",
            label: `Hosted zone tags (${zoneTags.length})`,
            content: (
              <Table
                columnDefinitions={[
                  { id: "key", header: "Key", cell: (item: TagPair) => item.key },
                  { id: "value", header: "Value", cell: (item: TagPair) => item.value },
                ]}
                items={zoneTags.filter((t) => {
                  if (!tagSearch.trim()) return true;
                  const query = tagSearch.toLowerCase();
                  return t.key.toLowerCase().includes(query) || t.value.toLowerCase().includes(query);
                })}
                empty={<Box textAlign="center" color="inherit">No tags associated with the resource.</Box>}
                filter={
                  <TextFilter
                    filteringText={tagSearch}
                    onChange={({ detail }) => setTagSearch(detail.filteringText)}
                    filteringPlaceholder="Search"
                  />
                }
                header={
                  <Header
                    variant="h2"
                    actions={
                      <Button onClick={() => setManageTagsModalOpen(true)}>
                        Manage tags
                      </Button>
                    }
                  >
                    Tags
                  </Header>
                }
              />
            ),
          },
        ]}
      />

      {/* Delete Hosted Zone Modal */}
      <DeleteZoneModal
        isOpen={deleteZoneModalOpen}
        domainName={zone.name}
        publicZoneId={zone.public_zone_id}
        recordCount={zone.record_count}
        onClose={() => setDeleteZoneModalOpen(false)}
        onConfirm={async () => {
          await api.zones.delete(zone.id);
          router.push("/hosted-zones");
        }}
      />

      {/* Test DNS Record Modal */}
      <TestRecordModal
        isOpen={testRecordModalOpen}
        onClose={() => setTestRecordModalOpen(false)}
        domainName={zone.name}
        records={records}
      />

      {/* Configure Query Logging Modal */}
      <QueryLoggingModal
        isOpen={queryLoggingModalOpen}
        onClose={() => setQueryLoggingModalOpen(false)}
        zoneId={zone.id}
        domainName={zone.name}
        initialConfig={queryLoggingConfig}
        onSave={(config) => setQueryLoggingConfig(config)}
      />

      {/* Manage Hosted Zone Tags Modal */}
      <ManageTagsModal
        isOpen={manageTagsModalOpen}
        onClose={() => setManageTagsModalOpen(false)}
        initialTags={zoneTags}
        onSave={handleSaveTags}
      />
    </SpaceBetween>
  );
}
