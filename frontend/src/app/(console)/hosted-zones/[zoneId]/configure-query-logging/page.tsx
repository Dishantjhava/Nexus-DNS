"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Form from "@cloudscape-design/components/form";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import { api } from "@/lib/api";
import { HostedZone } from "@/lib/types";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";

interface PageProps {
  params: Promise<{ zoneId: string }>;
}

export default function ConfigureQueryLoggingPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const zoneId = parseInt(resolvedParams.zoneId, 10);
  const { setCustomBreadcrumbs } = useBreadcrumbs();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Form state
  const [selectedLogGroup, setSelectedLogGroup] = useState<SelectProps.Option>({
    label: "/aws/route53/example.com",
    value: "/aws/route53/example.com",
  });
  const [refreshingGroups, setRefreshingGroups] = useState(false);

  // Load zone data
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await api.zones.get(zoneId);
        if (!ignore) {
          setZone(data);
          const defaultGroup = `/aws/route53/${data.name}`;
          setSelectedLogGroup({ label: defaultGroup, value: defaultGroup });
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

  // Set breadcrumbs: Route 53 > Hosted zones > domain.com > Configure query logging
  useEffect(() => {
    if (zone?.name) {
      setCustomBreadcrumbs([
        { label: "Route 53", href: "/hosted-zones" },
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: zone.name, href: `/hosted-zones/${zoneId}` },
        { label: "Configure query logging" },
      ]);
    }
    return () => { setCustomBreadcrumbs(null); };
  }, [zone?.name, zoneId, setCustomBreadcrumbs]);

  const logGroupOptions: SelectProps.Option[] = [
    { label: `/aws/route53/${zone?.name || "example.com"}`, value: `/aws/route53/${zone?.name || "example.com"}` },
    { label: "/aws/route53/query-logs-global", value: "/aws/route53/query-logs-global" },
    { label: "/aws/route53/audit-logs", value: "/aws/route53/audit-logs" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;

    setSubmitting(true);
    setError(null);

    try {
      // Save configuration to localStorage
      const config = {
        enabled: true,
        logGroupArn: `arn:aws:logs:us-east-1:881415009887:log-group:${selectedLogGroup.value}`,
        logStreamPrefix: "query-logs-",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(`nexus_dns_query_log_${zoneId}`, JSON.stringify(config));
      }
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to configure query logging");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] w-full mx-auto p-4">
        <Box color="text-body-secondary">Loading query logging configuration...</Box>
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
    <form onSubmit={handleSubmit} className="max-w-[1200px] w-full mx-auto p-4">
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.push(`/hosted-zones/${zoneId}`)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} formAction="submit">
              Create
            </Button>
          </SpaceBetween>
        }
        header={
          <Header
            variant="h1"
            description="You can configure Amazon Route 53 to log information about the queries that Route 53 receives, such as the domain or subdomain that was requested, the date and time of the query, and the DNS record type (such as A or AAAA)."
            info={
              <span className="text-[#0972D3] text-sm cursor-pointer hover:underline ml-2">
                Info
              </span>
            }
          >
            Configure query logging
          </Header>
        }
      >
        <SpaceBetween size="l">
          {error && <Alert type="error">{error}</Alert>}

          {/* Container 1: Log group */}
          <Container
            header={
              <Header
                variant="h2"
                description="Specify the CloudWatch Logs log group where you want Route 53 to save DNS queries for records in this hosted zone."
                info={
                  <span className="text-[#0972D3] text-xs cursor-pointer hover:underline">
                    Info
                  </span>
                }
              >
                Log group
              </Header>
            }
          >
            <SpaceBetween size="m">
              <FormField
                label="Log group"
                description="You can choose the name of an existing log group or choose to create a new log group."
                constraintText="The log group can have up to 512 characters. Valid characters: a-z, A-Z, 0-9, and . _ / # - (hyphen)"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      selectedOption={selectedLogGroup}
                      onChange={({ detail }) => setSelectedLogGroup(detail.selectedOption)}
                      options={logGroupOptions}
                    />
                  </div>
                  <Button
                    iconName="refresh"
                    loading={refreshingGroups}
                    onClick={() => {
                      setRefreshingGroups(true);
                      setTimeout(() => setRefreshingGroups(false), 300);
                    }}
                    ariaLabel="Refresh log groups"
                  />
                </div>
              </FormField>
            </SpaceBetween>
          </Container>

          {/* Warning Banner: Missing permission (Matches Screenshot 4) */}
          <div className="border border-[#7D4E00] rounded-xl p-4 bg-[#FFF8E6] flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191F] margin-0">
                    {permissionsGranted ? "Permissions granted" : "Missing permission"}
                  </h3>
                  <p className="text-[13px] text-[#545B64] mt-1 mb-0 leading-normal">
                    {permissionsGranted
                      ? "Resource policy granted. Route 53 has required permissions to publish logs to CloudWatch Logs."
                      : "Route 53 needs permission from a resource policy to publish logs to a CloudWatch Logs log group. No existing resource policies grant the required permissions."}
                  </p>
                </div>
              </div>

              {!permissionsGranted && (
                <Button onClick={() => setPermissionsGranted(true)}>
                  Grant permissions
                </Button>
              )}
            </div>

            <ExpandableSection headerText="Details">
              <Box color="text-body-secondary" padding="s">
                Resource Policy ARN: <code>arn:aws:logs:us-east-1:881415009887:policy:route53-query-logging-policy</code>
              </Box>
            </ExpandableSection>
          </div>

          {/* Permissions - optional */}
          <ExpandableSection headerText="Permissions - optional">
            <Box color="text-body-secondary" padding="s">
              Specify IAM service roles or custom CloudWatch resource policies for query log publishing.
            </Box>
          </ExpandableSection>
        </SpaceBetween>
      </Form>
    </form>
  );
}
