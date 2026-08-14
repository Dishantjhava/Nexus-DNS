"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import Box from "@cloudscape-design/components/box";
import { HostedZone } from "@/lib/types";
import { api } from "@/lib/api";
import { DeleteZoneModal } from "@/components/ui/DeleteZoneModal";
import { useMounted } from "@/hooks/useMounted";

function HostedZonesContent() {
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const searchParam = searchParams.get("search") || "";

  const [search, setSearch] = useState(searchParam);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchZones = useCallback(async (p: number, q: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.zones.list(p, 20, q);
      setZones(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load hosted zones";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.zones.list(pageParam, 20, searchParam);
        if (!ignore) {
          setZones(res.items);
          setTotal(res.total);
          setTotalPages(res.total_pages);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load hosted zones";
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
  }, [pageParam, searchParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParam) {
        const params = new URLSearchParams();
        params.set("page", "1");
        if (search) params.set("search", search);
        router.replace(`/hosted-zones?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchParam, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/hosted-zones?${params.toString()}`);
  };

  const selectedZone = selectedItems[0];



  const handleDeleteConfirmed = async () => {
    if (!selectedZone) return;
    await api.zones.delete(selectedZone.id);
    setSelectedItems([]);
    setDeleteModalOpen(false);
    const nextTotal = total - 1;
    const nextTotalPages = Math.max(1, Math.ceil(nextTotal / 20));
    const targetPage = pageParam > nextTotalPages ? nextTotalPages : pageParam;
    fetchZones(targetPage, searchParam, true);
  };

  if (!mounted) {
    return <Box textAlign="center" padding="l">Loading hosted zones...</Box>;
  }

  return (
    <SpaceBetween size="m">
      {error && (
        <Box color="text-status-error" padding="s">
          {error}
        </Box>
      )}

      <Table<HostedZone>
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        selectedItems={selectedItems}
        ariaLabels={{
          selectionGroupLabel: "Items selection",
          itemSelectionLabel: ({ selectedItems }, item) =>
            `${item.name} is ${selectedItems.some((i) => i.id === item.id) ? "" : "not "}selected`,
          tableLabel: "Hosted zones table",
        }}
        columnDefinitions={[
          {
            id: "name",
            header: "Hosted zone name",
            cell: (item) => (
              <a
                href={`/hosted-zones/${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/hosted-zones/${item.id}`);
                }}
                className="font-medium text-[#0972D3] hover:underline text-[14px]"
              >
                {item.name}
              </a>
            ),
            sortingField: "name",
          },
          {
            id: "type",
            header: "Type",
            cell: (item) => {
              const isPublic = String(item.zone_type).toUpperCase() === "PUBLIC";
              return (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wide text-white ${
                    isPublic ? "bg-[#0972D3]" : "bg-[#414D5C]"
                  }`}
                >
                  {isPublic ? "PUBLIC" : "PRIVATE"}
                </span>
              );
            },
          },
          {
            id: "createdBy",
            header: "Created by",
            cell: () => "Route 53",
          },
          {
            id: "recordCount",
            header: "Record count",
            cell: (item) => item.record_count,
          },
          {
            id: "description",
            header: "Description",
            cell: (item) => item.description || "-",
          },
          {
            id: "publicZoneId",
            header: "Hosted zone ID",
            cell: (item) => <code className="text-xs">{item.public_zone_id}</code>,
          },
        ]}
        items={zones}
        loading={loading || refreshing}
        loadingText="Loading hosted zones..."
        selectionType="multi"
        trackBy="id"
        empty={
          <Box textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>{searchParam ? "No matches" : "You have no hosted zones"}</b>
              <Box variant="p" color="inherit">
                {searchParam
                  ? "No hosted zones match the current filter criteria."
                  : "A hosted zone tells Route 53 how to respond to DNS queries for a domain."}
              </Box>
              <Button
                variant="primary"
                onClick={() =>
                  searchParam ? router.replace("/hosted-zones") : router.push("/hosted-zones/create")
                }
              >
                {searchParam ? "Clear filter" : "Create hosted zone"}
              </Button>
            </SpaceBetween>
          </Box>
        }
        filter={
          <TextFilter
            filteringText={search}
            onChange={({ detail }) => setSearch(detail.filteringText)}
            filteringPlaceholder="Filter records by property or value"
            filteringAriaLabel="Filter hosted zones"
            disableBrowserAutocorrect
          />
        }
        header={
          <Header
            variant="h1"
            counter={`(${total})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  iconName="refresh"
                  loading={refreshing}
                  onClick={() => fetchZones(pageParam, searchParam, true)}
                  ariaLabel="Refresh table"
                />
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() => selectedZone && router.push(`/hosted-zones/${selectedZone.id}`)}
                >
                  View details
                </Button>
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() => selectedZone && router.push(`/hosted-zones/${selectedZone.id}/edit`)}
                >
                  Edit
                </Button>
                <Button disabled={selectedItems.length === 0} onClick={() => setDeleteModalOpen(true)}>
                  Delete
                </Button>
                <Button variant="primary" onClick={() => router.push("/hosted-zones/create")}>
                  Create hosted zone
                </Button>
              </SpaceBetween>
            }
          >
            Hosted zones
          </Header>
        }
        pagination={
          <Pagination
            currentPageIndex={pageParam}
            pagesCount={totalPages}
            onChange={({ detail }) => handlePageChange(detail.currentPageIndex)}
          />
        }
      />

      {/* Delete Confirmation Modal */}
      {selectedZone && (
        <DeleteZoneModal
          isOpen={deleteModalOpen}
          domainName={selectedZone.name}
          publicZoneId={selectedZone.public_zone_id}
          recordCount={selectedZone.record_count}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirmed}
        />
      )}

    </SpaceBetween>
  );
}

export default function HostedZonesPage() {
  return (
    <React.Suspense fallback={<Box textAlign="center" padding="l">Loading hosted zones...</Box>}>
      <HostedZonesContent />
    </React.Suspense>
  );
}
