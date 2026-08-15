"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Form from "@cloudscape-design/components/form";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Textarea from "@cloudscape-design/components/textarea";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import { HostedZone, DnsRecordType } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";

interface PageProps {
  params: Promise<{ zoneId: string }>;
}

interface ParsedRecord {
  id: string;
  name: string;
  type: DnsRecordType;
  value: string;
  ttl: number;
}

// TTL Parser Helper (supports 0s, 300, 1h, 1d, 3600)
function parseTtl(ttlStr: string): number {
  if (!ttlStr) return 300;
  const clean = ttlStr.trim().toLowerCase();
  if (clean.endsWith("s")) return parseInt(clean.slice(0, -1), 10) || 0;
  if (clean.endsWith("m")) return (parseInt(clean.slice(0, -1), 10) || 1) * 60;
  if (clean.endsWith("h")) return (parseInt(clean.slice(0, -1), 10) || 1) * 3600;
  if (clean.endsWith("d")) return (parseInt(clean.slice(0, -1), 10) || 1) * 86400;
  return parseInt(clean, 10) || 300;
}

// BIND Line Parser
function parseZoneFile(content: string, zoneName: string): ParsedRecord[] {
  if (!content.trim()) return [];

  const lines = content.split("\n");
  const parsed: ParsedRecord[] = [];
  let currentTtl = 300;
  let currentOrigin = zoneName;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) return;

    // Handle $ORIGIN or $TTL directives
    if (line.startsWith("$ORIGIN")) {
      const parts = line.split(/\s+/);
      if (parts[1]) currentOrigin = parts[1].replace(/\.$/, "");
      return;
    }
    if (line.startsWith("$TTL")) {
      const parts = line.split(/\s+/);
      if (parts[1]) currentTtl = parseTtl(parts[1]);
      return;
    }

    const tokens = line.split(/\s+/);
    if (tokens.length < 3) return;

    // Record pattern parsing: <subdomain> [ttl] [class] <type> <value>
    const sub = tokens[0];
    let recordName = sub;

    if (sub === "@") {
      recordName = currentOrigin;
    } else if (!sub.includes(".")) {
      recordName = `${sub}.${currentOrigin}`;
    } else if (!sub.endsWith(".")) {
      recordName = sub.endsWith(currentOrigin) ? sub : `${sub}.${currentOrigin}`;
    }

    // Strip trailing dots for display matching AWS Route 53 console format
    recordName = recordName.replace(/\.$/, "");

    // Locate Record Type in tokens (A, AAAA, CNAME, MX, TXT, NS, PTR, SRV, CAA)
    const validTypes: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "PTR", "SRV", "CAA"];
    let typeIndex = -1;
    let recordType: DnsRecordType = "A";

    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i].toUpperCase() as DnsRecordType;
      if (validTypes.includes(t)) {
        typeIndex = i;
        recordType = t;
        break;
      }
    }

    if (typeIndex === -1) return;

    // Extract TTL if present before Type
    let recordTtl = currentTtl;
    if (typeIndex > 1) {
      const potentialTtl = tokens[typeIndex - 1];
      if (potentialTtl.toUpperCase() !== "IN" && !isNaN(parseInt(potentialTtl, 10))) {
        recordTtl = parseTtl(potentialTtl);
      } else if (typeIndex > 2) {
        const potentialTtl2 = tokens[typeIndex - 2];
        if (!isNaN(parseInt(potentialTtl2, 10))) {
          recordTtl = parseTtl(potentialTtl2);
        }
      }
    }

    // Extract Value (everything after type)
    const rawValue = tokens.slice(typeIndex + 1).join(" ");
    const cleanValue = rawValue.replace(/^"|"$/g, "");

    if (cleanValue) {
      parsed.push({
        id: `parsed-${index}-${Date.now()}`,
        name: recordName,
        type: recordType,
        value: cleanValue,
        ttl: recordTtl,
      });
    }
  });

  return parsed;
}

export default function ImportZoneFilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const zoneId = resolvedParams.zoneId;

  const router = useRouter();
  const { addToast } = useToast();
  const { setCustomBreadcrumbs } = useBreadcrumbs();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [zoneFileContent, setZoneFileContent] = useState("");
  const [filterText, setFilterText] = useState("");
  const [touched, setTouched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Derived parsed records with useMemo
  const parsedRecords = React.useMemo(() => {
    if (!zone) return [];
    return parseZoneFile(zoneFileContent, zone.name);
  }, [zoneFileContent, zone]);

  // Load Hosted Zone details
  useEffect(() => {
    let isMounted = true;
    api.zones
      .get(parseInt(zoneId, 10))
      .then((z) => {
        if (isMounted) {
          setZone(z);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [zoneId]);

  // Sync Breadcrumbs matching AWS Route 53 format
  useEffect(() => {
    if (zone) {
      setCustomBreadcrumbs([
        { label: "Route 53", href: "/hosted-zones" },
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: zone.name, href: `/hosted-zones/${zoneId}` },
        { label: "Import zone file", href: `/hosted-zones/${zoneId}/import-zone-file` },
      ]);
    }
  }, [zone, zoneId, setCustomBreadcrumbs]);

  // Handle Import Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedRecords.length === 0 || importing || !zone) return;

    setImporting(true);
    let successCount = 0;

    for (const rec of parsedRecords) {
      try {
        await api.records.create(parseInt(zoneId, 10), {
          name: rec.name,
          type: rec.type,
          ttl: rec.ttl,
          values: [rec.value],
        });
        successCount++;
      } catch {
        // Continue with remaining records
      }
    }

    setImporting(false);
    addToast(
      `Successfully created ${successCount} record(s) for ${zone.name} from zone file.`,
      "success"
    );
    router.push(`/hosted-zones/${zoneId}`);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] w-full mx-auto p-4">
        <Box color="text-body-secondary">Loading zone configuration...</Box>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="max-w-[1200px] w-full mx-auto p-4">
        <Alert type="error">Hosted zone not found.</Alert>
      </div>
    );
  }

  // Filter parsed records for table preview
  const filteredRecords = parsedRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(filterText.toLowerCase()) ||
      r.type.toLowerCase().includes(filterText.toLowerCase()) ||
      r.value.toLowerCase().includes(filterText.toLowerCase()) ||
      r.ttl.toString().includes(filterText)
  );

  const hasNoContent = zoneFileContent.trim().length === 0;

  return (
    <form onSubmit={handleImportSubmit} className="max-w-[1200px] w-full mx-auto p-4 pb-12">
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => router.push(`/hosted-zones/${zoneId}`)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={importing}
              disabled={parsedRecords.length === 0 || importing}
            >
              Import
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="l">
          {/* Header Section */}
          <Header
            variant="h1"
            info={<Link variant="info">Info</Link>}
            description="You can create records for a Route 53 hosted zone by importing a zone file."
          >
            Import zone file
          </Header>

          {/* Container 1: Zone File */}
          <Container
            header={
              <Header
                variant="h2"
                description="Paste the contents of your zone file below."
              >
                Zone file
              </Header>
            }
          >
            <SpaceBetween size="s">
              <div className="relative">
                <Textarea
                  value={zoneFileContent}
                  onChange={({ detail }) => {
                    setZoneFileContent(detail.value);
                    if (!touched) setTouched(true);
                  }}
                  placeholder={`subdomain1 0s A 10.0.0.0\nsubdomain2 0s CNAME example.com.`}
                  rows={8}
                  ariaRequired
                  invalid={hasNoContent && touched}
                />
              </div>

              {/* Red Validation error matching AWS Console screenshot */}
              {hasNoContent && (
                <div className="flex items-center gap-1.5 text-xs text-[#D13212] font-semibold mt-1">
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.5 10.44L10.44 11.5 8 9.06l-2.44 2.44L4.5 10.44 6.94 8 4.5 5.56 5.56 4.5 8 6.94l2.44-2.44 1.06 1.06L9.06 8l2.44 2.44z" />
                  </svg>
                  <span>No zone file.</span>
                </div>
              )}

              <Box variant="small" color="text-body-secondary" className="mt-1">
                If the hosted zone already contains records that appear in the zone file, the import process fails, and no records are created. Enter multiple records on separate lines.
              </Box>
            </SpaceBetween>
          </Container>

          {/* Container 2: Record preview table */}
          <Container
            header={
              <Header
                variant="h2"
                counter={`(${parsedRecords.length})`}
                description="Route 53 creates the following records when you choose Import zone file. If you edit the contents of the zone file above, the table reflects your changes."
              >
                Record preview for {zone.name}
              </Header>
            }
          >
            <Table<ParsedRecord>
              columnDefinitions={[
                {
                  id: "name",
                  header: "Record name",
                  cell: (item) => <b className="text-[#16191F] dark:text-[#FFFFFF]">{item.name}</b>,
                  sortingField: "name",
                },
                {
                  id: "type",
                  header: "Type",
                  cell: (item) => item.type,
                },
                {
                  id: "value",
                  header: "Value/Route traffic to",
                  cell: (item) => <code className="font-mono text-xs">{item.value}</code>,
                },
                {
                  id: "ttl",
                  header: "TTL (seconds)",
                  cell: (item) => item.ttl,
                },
              ]}
              items={filteredRecords}
              loadingText="Parsing zone file..."
              empty={
                <Box textAlign="center" color="inherit" className="py-8">
                  <Box variant="p" color="text-body-secondary">
                    This table displays records based on the contents of your zone file.
                  </Box>
                </Box>
              }
              filter={
                <TextFilter
                  filteringText={filterText}
                  onChange={({ detail }) => setFilterText(detail.filteringText)}
                  filteringPlaceholder="Filter records by property or value"
                />
              }
              pagination={
                <Pagination
                  currentPageIndex={currentPage}
                  onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
                  pagesCount={Math.ceil(filteredRecords.length / 10) || 1}
                />
              }
            />
          </Container>
        </SpaceBetween>
      </Form>
    </form>
  );
}
