"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Form from "@cloudscape-design/components/form";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Textarea from "@cloudscape-design/components/textarea";
import Toggle from "@cloudscape-design/components/toggle";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Table from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { DnsRecord, DnsRecordType, HostedZone } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

interface RecordFormItem {
  id: string;
  name: string;
  type: DnsRecordType;
  ttlStr: string;
  ttlError?: string;
  valueText: string;
  alias: boolean;
}

function validateTtl(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return "TTL is required.";
  if (!/^-?\d+$/.test(trimmed)) return "TTL must be a valid positive integer.";
  const num = parseInt(trimmed, 10);
  if (num <= 0) return "TTL must be a positive integer (minimum 1 second).";
  return null;
}

const RECORD_TYPE_OPTIONS: SelectProps.Option[] = [
  { value: "A", label: "A – Routes traffic to an IPv4 address" },
  { value: "AAAA", label: "AAAA – Routes traffic to an IPv6 address" },
  { value: "CNAME", label: "CNAME – Routes traffic to another domain name" },
  { value: "TXT", label: "TXT – Used for verification and SPF" },
  { value: "MX", label: "MX – Routes traffic to mail servers" },
  { value: "NS", label: "NS – Identifies name servers" },
  { value: "PTR", label: "PTR – Reverse DNS lookup" },
  { value: "SRV", label: "SRV – Service locator record" },
  { value: "CAA", label: "CAA – Certificate authority restriction" },
];

export default function CreateRecordPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const resolvedParams = use(params);
  const zoneId = parseInt(resolvedParams.zoneId, 10);

  const router = useRouter();
  const { showFeatureNotAvailable } = useToast();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [existingRecords, setExistingRecords] = useState<DnsRecord[]>([]);
  const [loadingZone, setLoadingZone] = useState(true);

  const [formItems, setFormItems] = useState<RecordFormItem[]>(() => [
    {
      id: "rec-1",
      name: "",
      type: "A",
      ttlStr: "300",
      valueText: "",
      alias: false,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const z = await api.zones.get(zoneId);
        setZone(z);
        const recs = await api.records.list(zoneId, 1, 50);
        setExistingRecords(recs.items);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load zone";
        setSubmitError(msg);
      } finally {
        setLoadingZone(false);
      }
    }
    init();
  }, [zoneId]);

  const addRecordBlock = () => {
    setFormItems((prev) => [
      ...prev,
      {
        id: `rec-${prev.length + 1}-${Date.now()}`,
        name: "",
        type: "A",
        ttlStr: "300",
        valueText: "",
        alias: false,
      },
    ]);
  };

  const removeRecordBlock = (id: string) => {
    if (formItems.length === 1) return;
    setFormItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateRecordItem = (id: string, updates: Partial<RecordFormItem>) => {
    setFormItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const parseValues = (type: DnsRecordType, rawText: string) => {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (type === "MX") {
      return lines.map((l) => {
        const parts = l.split(/\s+/);
        return {
          priority: parseInt(parts[0], 10) || 10,
          exchange: parts[1] || l,
        };
      });
    }

    if (type === "SRV") {
      return lines.map((l) => {
        const parts = l.split(/\s+/);
        return {
          priority: parseInt(parts[0], 10) || 10,
          weight: parseInt(parts[1], 10) || 10,
          port: parseInt(parts[2], 10) || 80,
          target: parts[3] || l,
        };
      });
    }

    if (type === "CAA") {
      return lines.map((l) => {
        const parts = l.split(/\s+/);
        return {
          flag: parseInt(parts[0], 10) || 0,
          tag: parts[1] || "issue",
          value: parts.slice(2).join(" ") || "example.com",
        };
      });
    }

    return lines;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;

    setSubmitting(true);
    setSubmitError(null);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      const fullName = item.name.trim()
        ? `${item.name.trim()}.${zone.name}`
        : zone.name;

      const ttlErr = validateTtl(item.ttlStr);
      if (ttlErr) {
        errors.push(`Record ${i + 1} (${fullName}): ${ttlErr}`);
        updateRecordItem(item.id, { ttlError: ttlErr });
        continue;
      }
      const numTtl = parseInt(item.ttlStr.trim(), 10);

      const parsedValues = parseValues(item.type, item.valueText);

      if (parsedValues.length === 0) {
        errors.push(`Record ${i + 1} (${fullName}): Value cannot be empty`);
        continue;
      }

      try {
        await api.records.create(zoneId, {
          name: fullName,
          type: item.type,
          ttl: numTtl,
          values: parsedValues,
        });
        successCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error creating record";
        errors.push(`Record ${i + 1} (${fullName}): ${msg}`);
      }
    }

    setSubmitting(false);

    if (errors.length === 0) {
      router.push(`/hosted-zones/${zoneId}`);
    } else if (successCount > 0) {
      setSubmitError(
        `Created ${successCount} record(s) successfully, but ${errors.length} failed:\n${errors.join("\n")}`
      );
    } else {
      setSubmitError(`Failed to create records:\n${errors.join("\n")}`);
    }
  };

  if (loadingZone || !zone) {
    return <Box textAlign="center" padding="l">Loading create record form...</Box>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[1200px] w-full mx-auto p-4">
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.push(`/hosted-zones/${zone.id}`)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} formAction="submit">
              Create records
            </Button>
          </SpaceBetween>
        }
        header={
          <Header
            variant="h1"
            actions={
              <Button onClick={() => showFeatureNotAvailable("Wizard Mode")}>
                Switch to wizard
              </Button>
            }
          >
            Create record
          </Header>
        }
      >
        <SpaceBetween size="l">
          {submitError && <Alert type="error">{submitError}</Alert>}

          <Container header={<Header variant="h2">Quick create record</Header>}>
            <SpaceBetween size="l">
              {formItems.map((item, index) => {
                const selectedTypeOpt =
                  RECORD_TYPE_OPTIONS.find((o) => o.value === item.type) || RECORD_TYPE_OPTIONS[0];

                return (
                  <Container
                    key={item.id}
                    header={
                      <Header
                        variant="h3"
                        actions={
                          formItems.length > 1 ? (
                            <Button onClick={() => removeRecordBlock(item.id)}>Delete</Button>
                          ) : undefined
                        }
                      >
                        Record {index + 1}
                      </Header>
                    }
                  >
                    <SpaceBetween size="m">
                      <ColumnLayout columns={2}>
                        <FormField
                          label="Record name"
                          description="Keep blank to create a record for the root domain."
                          constraintText={`.${zone.name}`}
                        >
                          <Input
                            value={item.name}
                            onChange={({ detail }) => updateRecordItem(item.id, { name: detail.value })}
                            placeholder="subdomain"
                          />
                        </FormField>

                        <FormField label="Record type">
                          <Select
                            selectedOption={selectedTypeOpt}
                            onChange={({ detail }) =>
                              updateRecordItem(item.id, {
                                type: (detail.selectedOption.value || "A") as DnsRecordType,
                              })
                            }
                            options={RECORD_TYPE_OPTIONS}
                          />
                        </FormField>
                      </ColumnLayout>

                      <FormField>
                        <Toggle
                          checked={item.alias}
                          onChange={({ detail }) => {
                            updateRecordItem(item.id, { alias: detail.checked });
                            if (detail.checked) showFeatureNotAvailable("Alias routing");
                          }}
                        >
                          Alias
                        </Toggle>
                      </FormField>

                      <FormField
                        label="Value"
                        description="Enter multiple values on separate lines."
                      >
                        <Textarea
                          value={item.valueText}
                          onChange={({ detail }) => updateRecordItem(item.id, { valueText: detail.value })}
                          rows={4}
                          placeholder={
                            item.type === "A"
                              ? "192.0.2.235"
                              : item.type === "MX"
                              ? "10 mail.example.com"
                              : item.type === "SRV"
                              ? "10 60 5060 bigbox.example.com"
                              : "Enter value"
                          }
                        />
                      </FormField>

                      <ColumnLayout columns={2}>
                        <FormField
                          label="TTL (seconds)"
                          description="Recommended: 60 to 172800"
                          errorText={item.ttlError}
                        >
                          <SpaceBetween size="xs">
                            <Input
                              value={item.ttlStr}
                              onChange={({ detail }) => {
                                const err = validateTtl(detail.value);
                                updateRecordItem(item.id, { ttlStr: detail.value, ttlError: err || undefined });
                              }}
                              placeholder="300"
                              invalid={!!item.ttlError}
                            />
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[#545B64]">Shortcuts:</span>
                              <button
                                type="button"
                                onClick={() => updateRecordItem(item.id, { ttlStr: "60", ttlError: undefined })}
                                className="px-2 py-0.5 rounded bg-[#F4F5F5] hover:bg-[#EAECF0] text-[#0972D3] font-medium border border-[#D5DBDB] cursor-pointer"
                              >
                                1m
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRecordItem(item.id, { ttlStr: "3600", ttlError: undefined })}
                                className="px-2 py-0.5 rounded bg-[#F4F5F5] hover:bg-[#EAECF0] text-[#0972D3] font-medium border border-[#D5DBDB] cursor-pointer"
                              >
                                1h
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRecordItem(item.id, { ttlStr: "86400", ttlError: undefined })}
                                className="px-2 py-0.5 rounded bg-[#F4F5F5] hover:bg-[#EAECF0] text-[#0972D3] font-medium border border-[#D5DBDB] cursor-pointer"
                              >
                                1d
                              </button>
                            </div>
                          </SpaceBetween>
                        </FormField>

                        <FormField label="Routing policy">
                          <Select
                            selectedOption={{ label: "Simple routing", value: "Simple" }}
                            disabled
                            options={[{ label: "Simple routing", value: "Simple" }]}
                          />
                        </FormField>
                      </ColumnLayout>
                    </SpaceBetween>
                  </Container>
                );
              })}

              <Box float="right">
                <Button onClick={addRecordBlock}>
                  Add another record
                </Button>
              </Box>
            </SpaceBetween>
          </Container>

          <ExpandableSection headerText="View existing records">
            <Table<DnsRecord>
              columnDefinitions={[
                { id: "name", header: "Record name", cell: (r) => r.name },
                { id: "type", header: "Type", cell: (r) => r.type },
                { id: "values", header: "Value", cell: (r) => r.values.join(", ") },
                { id: "ttl", header: "TTL", cell: (r) => r.ttl },
              ]}
              items={existingRecords}
            />
          </ExpandableSection>
        </SpaceBetween>
      </Form>
    </form>
  );
}
