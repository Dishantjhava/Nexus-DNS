"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Form from "@cloudscape-design/components/form";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { DnsRecord, HostedZone } from "@/lib/types";
import { api } from "@/lib/api";

export default function EditRecordPage({
  params,
}: {
  params: Promise<{ zoneId: string; recordId: string }>;
}) {
  const resolvedParams = use(params);
  const zoneId = parseInt(resolvedParams.zoneId, 10);
  const recordId = parseInt(resolvedParams.recordId, 10);

  const router = useRouter();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [record, setRecord] = useState<DnsRecord | null>(null);
  const [ttlStr, setTtlStr] = useState("300");
  const [ttlError, setTtlError] = useState<string | null>(null);
  const [valueText, setValueText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateTtl(val: string): string | null {
    const trimmed = val.trim();
    if (!trimmed) return "TTL is required.";
    if (!/^-?\d+$/.test(trimmed)) return "TTL must be a valid positive integer.";
    const num = parseInt(trimmed, 10);
    if (num <= 0) return "TTL must be a positive integer (minimum 1 second).";
    return null;
  }

  useEffect(() => {
    async function load() {
      try {
        const z = await api.zones.get(zoneId);
        setZone(z);
        const r = await api.records.get(zoneId, recordId);
        setRecord(r);
        setTtlStr(r.ttl.toString());

        if (r.type === "MX") {
          setValueText(
            r.values
              .map((val: unknown) =>
                typeof val === "object" && val !== null && "priority" in val && "exchange" in val
                  ? `${(val as { priority: number; exchange: string }).priority} ${(val as { priority: number; exchange: string }).exchange}`
                  : String(val)
              )
              .join("\n")
          );
        } else if (r.type === "SRV") {
          setValueText(
            r.values
              .map((val: unknown) =>
                typeof val === "object" && val !== null && "target" in val
                  ? `${(val as { priority: number; weight: number; port: number; target: string }).priority} ${(val as { priority: number; weight: number; port: number; target: string }).weight} ${(val as { priority: number; weight: number; port: number; target: string }).port} ${(val as { priority: number; weight: number; port: number; target: string }).target}`
                  : String(val)
              )
              .join("\n")
          );
        } else if (r.type === "CAA") {
          setValueText(
            r.values
              .map((val: unknown) =>
                typeof val === "object" && val !== null && "tag" in val
                  ? `${(val as { flag: number; tag: string; value: string }).flag} ${(val as { flag: number; tag: string; value: string }).tag} ${(val as { flag: number; tag: string; value: string }).value}`
                  : String(val)
              )
              .join("\n")
          );
        } else {
          setValueText(r.values.join("\n"));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load record details";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [zoneId, recordId]);

  const parseValues = (type: string, rawText: string) => {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || record.is_system) return;

    const ttlErr = validateTtl(ttlStr);
    if (ttlErr) {
      setTtlError(ttlErr);
      setError(ttlErr);
      return;
    }
    setTtlError(null);
    const numTtl = parseInt(ttlStr.trim(), 10);

    setSaving(true);
    setError(null);

    const parsedValues = parseValues(record.type, valueText);

    try {
      await api.records.update(zoneId, recordId, {
        ttl: numTtl,
        values: parsedValues,
      });
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update record";
      setError(msg);
      setSaving(false);
    }
  };

  if (loading || !zone || !record) {
    return <Box textAlign="center" padding="l">Loading record details...</Box>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-[1200px] w-full mx-auto p-4">
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.push(`/hosted-zones/${zoneId}`)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              disabled={record.is_system}
              formAction="submit"
            >
              Save changes
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Edit record</Header>}
      >
        <SpaceBetween size="l">
          {record.is_system && (
            <Alert type="warning" header="System-managed record">
              System-managed records cannot be edited or modified.
            </Alert>
          )}

          {error && <Alert type="error">{error}</Alert>}

          <Container header={<Header variant="h2">Record details</Header>}>
            <SpaceBetween size="m">
              <ColumnLayout columns={2}>
                <FormField label="Record name" description="Record name is immutable.">
                  <Input value={record.name} disabled />
                </FormField>
                <FormField label="Record type" description="Record type is immutable.">
                  <Input value={record.type} disabled />
                </FormField>
              </ColumnLayout>

              <FormField label="Value" description="Enter multiple values on separate lines.">
                <Textarea
                  value={valueText}
                  onChange={({ detail }) => setValueText(detail.value)}
                  disabled={record.is_system}
                  rows={4}
                />
              </FormField>

              <FormField
                label="TTL (seconds)"
                description="Recommended: 60 to 172800"
                errorText={ttlError || undefined}
              >
                <SpaceBetween size="xs">
                  <Input
                    value={ttlStr}
                    onChange={({ detail }) => {
                      setTtlStr(detail.value);
                      const err = validateTtl(detail.value);
                      setTtlError(err);
                      if (error) setError(null);
                    }}
                    disabled={record.is_system}
                    placeholder="300"
                    invalid={!!ttlError}
                  />
                  {!record.is_system && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#545B64]">Shortcuts:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTtlStr("60");
                          setTtlError(null);
                        }}
                        className="px-2 py-0.5 rounded bg-[#F4F5F5] hover:bg-[#EAECF0] text-[#0972D3] font-medium border border-[#D5DBDB] cursor-pointer"
                      >
                        1m
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTtlStr("3600");
                          setTtlError(null);
                        }}
                        className="px-2 py-0.5 rounded bg-[#F4F5F5] hover:bg-[#EAECF0] text-[#0972D3] font-medium border border-[#D5DBDB] cursor-pointer"
                      >
                        1h
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTtlStr("86400");
                          setTtlError(null);
                        }}
                        className="px-2 py-0.5 rounded bg-[#F4F5F5] hover:bg-[#EAECF0] text-[#0972D3] font-medium border border-[#D5DBDB] cursor-pointer"
                      >
                        1d
                      </button>
                    </div>
                  )}
                </SpaceBetween>
              </FormField>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </Form>
    </form>
  );
}
