"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Form from "@cloudscape-design/components/form";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import { api } from "@/lib/api";
import { HostedZone, DnsRecord } from "@/lib/types";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";

interface PageProps {
  params: Promise<{ zoneId: string }>;
}

const RECORD_TYPES: SelectProps.Option[] = [
  { label: "A – Routes traffic to an IPv4 address and some AWS resources", value: "A" },
  { label: "AAAA – Routes traffic to an IPv6 address and some AWS resources", value: "AAAA" },
  { label: "CNAME – Routes traffic to another domain name and some AWS resources", value: "CNAME" },
  { label: "MX – Routes traffic to mail servers", value: "MX" },
  { label: "NS – Routes traffic to name servers", value: "NS" },
  { label: "PTR – Routes traffic to canonical domain name", value: "PTR" },
  { label: "SOA – Start of Authority", value: "SOA" },
  { label: "SRV – Routes traffic to specific services", value: "SRV" },
  { label: "TXT – Contains text data", value: "TXT" },
  { label: "CAA – Certificate Authority Authorization", value: "CAA" },
];

export default function TestRecordPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const zoneId = parseInt(resolvedParams.zoneId, 10);
  const { setCustomBreadcrumbs } = useBreadcrumbs();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [subdomain, setSubdomain] = useState("");
  const [selectedType, setSelectedType] = useState<SelectProps.Option>(RECORD_TYPES[0]);
  const [resolverIp, setResolverIp] = useState("192.0.2.25");
  const [testing, setTesting] = useState(false);

  // Results state
  const [responseResult, setResponseResult] = useState<{
    responseCode: "NOERROR" | "NXDOMAIN";
    queriedRecordName: string;
    type: string;
    protocol: string;
    values: string[] | null;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [zData, rData] = await Promise.all([
          api.zones.get(zoneId),
          api.records.list(zoneId, 1, 100),
        ]);
        if (!ignore) {
          setZone(zData);
          setRecords(rData.items);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load hosted zone");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [zoneId]);

  // Set breadcrumbs: Route 53 > Hosted zones > domain.com > Test record
  useEffect(() => {
    if (zone?.name) {
      setCustomBreadcrumbs([
        { label: "Route 53", href: "/hosted-zones" },
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: zone.name, href: `/hosted-zones/${zoneId}` },
        { label: "Test record" },
      ]);
    }
    return () => { setCustomBreadcrumbs(null); };
  }, [zone?.name, zoneId, setCustomBreadcrumbs]);

  const handleGetNextResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;

    setTesting(true);

    setTimeout(() => {
      const type = selectedType.value || "A";
      const cleanSub = subdomain.trim();
      
      // Calculate queried record name
      let fullQueriedName = zone.name;
      if (cleanSub) {
        fullQueriedName = cleanSub.endsWith(zone.name)
          ? cleanSub
          : `${cleanSub}.${zone.name}`;
      }

      const fqdnQueried = fullQueriedName.endsWith(".") ? fullQueriedName.toLowerCase() : `${fullQueriedName.toLowerCase()}.`;

      // Find record in stored records
      const match = records.find((r) => {
        const rName = r.name.toLowerCase();
        const rFqdn = rName.endsWith(".") ? rName : `${rName}.`;
        return (rFqdn === fqdnQueried || rName === fullQueriedName.toLowerCase()) && r.type === type;
      });

      if (match) {
        const formattedValues = match.values.map((v: unknown) =>
          typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)
        );
        setResponseResult({
          responseCode: "NOERROR",
          queriedRecordName: fullQueriedName,
          type,
          protocol: "UDP",
          values: formattedValues,
        });
      } else {
        setResponseResult({
          responseCode: "NXDOMAIN",
          queriedRecordName: fullQueriedName,
          type,
          protocol: "UDP",
          values: null,
        });
      }
      setTesting(false);

      // Smooth scroll to response section
      setTimeout(() => {
        const el = document.getElementById("route53-response-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 350);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] w-full mx-auto p-4">
        <Box color="text-body-secondary">Loading test record configuration...</Box>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="max-w-[1200px] w-full mx-auto p-4">
        <Alert type="error">{error || "Hosted zone not found."}</Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleGetNextResponse} className="max-w-[1200px] w-full mx-auto p-4">
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.push(`/hosted-zones/${zoneId}`)}>
              Cancel
            </Button>
            <Button variant="primary" loading={testing} formAction="submit">
              Get response
            </Button>
          </SpaceBetween>
        }
        header={
          <Header
            variant="h1"
            description="Test records to simulate the values that Route 53 returns in response to DNS queries. This tool displays the standard values that Route 53 provides based on the settings in the hosted zone. The tool doesn't send actual DNS queries."
            info={
              <span className="text-[#0972D3] text-sm cursor-pointer hover:underline ml-2">
                Info
              </span>
            }
          >
            Test record
          </Header>
        }
      >
        <SpaceBetween size="l">
          {/* Container 1: Record to test */}
          <Container
            header={
              <Header variant="h2">
                Record to test
              </Header>
            }
          >
            <SpaceBetween size="m">
              <div>
                <Box variant="awsui-key-label">Hosted zone</Box>
                <div className="text-[14px] text-[#16191F] font-normal mt-0.5">{zone.name}</div>
              </div>

              <FormField
                label={
                  <span>
                    Record name - <span className="font-normal text-[#545B64]">optional</span>{" "}
                    <span className="text-[#0972D3] text-xs cursor-pointer hover:underline">Info</span>
                  </span>
                }
                description={`To check a record that has the same name as the hosted zone ${zone.name}, leave this field blank. To check the record for a subdomain, enter the subdomain name excluding the domain name.`}
              >
                <Input
                  value={subdomain}
                  onChange={({ detail }) => setSubdomain(detail.value)}
                  placeholder="www"
                  type="search"
                />
              </FormField>

              <FormField
                label={
                  <span>
                    Record type{" "}
                    <span className="text-[#0972D3] text-xs cursor-pointer hover:underline">Info</span>
                  </span>
                }
                description="The DNS type of the record determines the format of the value that Route 53 returns in response to DNS queries."
              >
                <Select
                  selectedOption={selectedType}
                  onChange={({ detail }) => setSelectedType(detail.selectedOption)}
                  options={RECORD_TYPES}
                />
              </FormField>
            </SpaceBetween>
          </Container>

          {/* Container 2: Settings to simulate DNS queries - optional */}
          <Container
            header={
              <Header
                variant="h2"
                description="Simulate the response that Route 53 returns to a specific IP address. This is useful for testing geolocation and latency records."
              >
                Settings to simulate DNS queries - <i>optional</i>
              </Header>
            }
          >
            <SpaceBetween size="m">
              <FormField
                label={
                  <span>
                    Resolver IP address{" "}
                    <span className="text-[#0972D3] text-xs cursor-pointer hover:underline">Info</span>
                  </span>
                }
                description="The IP address that the tool uses to simulate the location of the DNS resolver that a client uses to make requests. If you omit this value, the tool uses the IP address of a DNS resolver in the AWS US East (N. Virginia) Region."
              >
                <Input
                  value={resolverIp}
                  onChange={({ detail }) => setResolverIp(detail.value)}
                  placeholder="192.0.2.25"
                />
              </FormField>

              <ExpandableSection headerText="Additional configuration">
                <Box color="text-body-secondary" padding="s">
                  No additional configuration parameters set.
                </Box>
              </ExpandableSection>
            </SpaceBetween>
          </Container>

          {/* Container 3: Response returned by Route 53 (Matches Screenshot 3) */}
          {responseResult && (
            <div id="route53-response-section">
              <Container
                header={
                  <Header
                    variant="h2"
                    description="Response from Route 53 based on the following options."
                  >
                    Response returned by Route 53
                  </Header>
                }
              >
                <SpaceBetween size="l">
                  <ColumnLayout columns={1} variant="text-grid">
                    <KeyValuePairs
                      items={[
                        { label: "Hosted zone", value: zone.name },
                        { label: "Record name", value: responseResult.queriedRecordName },
                        { label: "Record type", value: responseResult.type },
                      ]}
                    />
                  </ColumnLayout>

                  <div className="h-[1px] bg-[#D5DBDB] w-full" />

                  <ColumnLayout columns={1} variant="text-grid">
                    <KeyValuePairs
                      items={[
                        {
                          label: "DNS response code",
                          value:
                            responseResult.responseCode === "NOERROR" ? (
                              <span className="flex items-center gap-1.5 text-[#1D8102] font-bold">
                                <svg className="w-4 h-4 fill-current text-[#1D8102]" viewBox="0 0 16 16">
                                  <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                                  <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z" />
                                </svg>
                                NOERROR
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[#D13212] font-bold">
                                <svg className="w-4 h-4 fill-current text-[#D13212]" viewBox="0 0 16 16">
                                  <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                                </svg>
                                Non-Existent Domain
                              </span>
                            ),
                        },
                        { label: "Protocol", value: responseResult.protocol },
                        {
                          label: "Response returned by Route 53",
                          value:
                            responseResult.values && responseResult.values.length > 0 ? (
                              <div className="flex flex-col gap-1 font-mono text-xs text-[#16191F] mt-1 bg-[#F4F5F5] p-3 rounded border border-[#D5DBDB]">
                                {responseResult.values.map((v, i) => (
                                  <div key={i}>{v}</div>
                                ))}
                              </div>
                            ) : (
                              "-"
                            ),
                        },
                      ]}
                    />
                  </ColumnLayout>
                </SpaceBetween>
              </Container>
            </div>
          )}
        </SpaceBetween>
      </Form>
    </form>
  );
}
