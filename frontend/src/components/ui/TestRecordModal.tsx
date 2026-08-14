"use client";

import React, { useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import { DnsRecord } from "@/lib/types";

interface TestRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
  records: DnsRecord[];
}

const TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "A - IPv4 address", value: "A" },
  { label: "AAAA - IPv6 address", value: "AAAA" },
  { label: "CNAME - Canonical name", value: "CNAME" },
  { label: "MX - Mail exchange", value: "MX" },
  { label: "NS - Name server", value: "NS" },
  { label: "PTR - Pointer", value: "PTR" },
  { label: "SOA - Start of authority", value: "SOA" },
  { label: "SRV - Service locator", value: "SRV" },
  { label: "TXT - Text", value: "TXT" },
  { label: "CAA - Certification authority authorization", value: "CAA" },
];

export const TestRecordModal: React.FC<TestRecordModalProps> = ({
  isOpen,
  onClose,
  domainName,
  records,
}) => {
  const [recordName, setRecordName] = useState(domainName);
  const [selectedTypeOption, setSelectedTypeOption] = useState<SelectProps.Option>(TYPE_OPTIONS[0]);
  const [clientIp, setClientIp] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    responseCode: "NOERROR" | "NXDOMAIN";
    matchedRecord: DnsRecord | null;
    protocol: string;
    responseTimeMs: number;
  } | null>(null);

  const handleRunTest = () => {
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      const type = selectedTypeOption.value;
      const cleanInput = recordName.trim().toLowerCase();
      const fqdnInput = cleanInput.endsWith(".") ? cleanInput : `${cleanInput}.`;

      // Find matching record from stored records
      const matched = records.find((r) => {
        const rName = r.name.toLowerCase();
        const rFqdn = rName.endsWith(".") ? rName : `${rName}.`;
        return (rFqdn === fqdnInput || rName === cleanInput) && r.type === type;
      });

      const responseTimeMs = Math.floor(Math.random() * 12) + 8; // 8-20ms simulation

      if (matched) {
        setTestResult({
          responseCode: "NOERROR",
          matchedRecord: matched,
          protocol: "UDP",
          responseTimeMs,
        });
      } else {
        setTestResult({
          responseCode: "NXDOMAIN",
          matchedRecord: null,
          protocol: "UDP",
          responseTimeMs,
        });
      }
      setTesting(false);
    }, 400);
  };

  const handleDismiss = () => {
    setTestResult(null);
    setTesting(false);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      onDismiss={handleDismiss}
      header="Test DNS record response"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleDismiss}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRunTest} loading={testing}>
              Get response
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        <Box color="text-body-secondary">
          Simulate DNS queries against stored DNS record sets in <b>{domainName}</b>.
        </Box>

        <FormField
          label="Record name"
          description="Enter the FQDN or subdomain to test."
        >
          <Input
            value={recordName}
            onChange={({ detail }) => setRecordName(detail.value)}
            placeholder={domainName}
          />
        </FormField>

        <FormField
          label="Record type"
          description="Select the record type for the query."
        >
          <Select
            selectedOption={selectedTypeOption}
            onChange={({ detail }) => setSelectedTypeOption(detail.selectedOption)}
            options={TYPE_OPTIONS}
          />
        </FormField>

        <FormField
          label="Client IP address - optional"
          description="Simulate a query originating from a specific IPv4 or IPv6 client."
        >
          <Input
            value={clientIp}
            onChange={({ detail }) => setClientIp(detail.value)}
            placeholder="192.0.2.1"
          />
        </FormField>

        {/* DNS Response Results Section */}
        {testResult && (
          <Container
            header={
              <Header
                variant="h3"
                actions={
                  <StatusIndicator
                    type={testResult.responseCode === "NOERROR" ? "success" : "warning"}
                  >
                    {testResult.responseCode === "NOERROR"
                      ? "Response received (NOERROR)"
                      : "No record found (NXDOMAIN)"}
                  </StatusIndicator>
                }
              >
                DNS Query Results
              </Header>
            }
          >
            <SpaceBetween size="m">
              <KeyValuePairs
                columns={3}
                items={[
                  { label: "Response code", value: testResult.responseCode },
                  { label: "Protocol", value: testResult.protocol },
                  { label: "Response time", value: `${testResult.responseTimeMs} ms` },
                ]}
              />

              <FormField label="DNS Response Values">
                {testResult.matchedRecord ? (
                  <div className="bg-[#161B22] text-[#79C0FF] font-mono text-xs p-3 rounded border border-[#30363D] flex flex-col gap-1">
                    <div className="text-gray-400 border-b border-[#30363D] pb-1 mb-1">
                      ; {testResult.matchedRecord.name} IN {testResult.matchedRecord.type} (TTL {testResult.matchedRecord.ttl}s)
                    </div>
                    {testResult.matchedRecord.values.map((val: unknown, idx: number) => (
                      <div key={idx}>
                        {typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Box color="text-status-error" padding="xs">
                    DNS server returned NXDOMAIN — no matching <b>{selectedTypeOption.value}</b> record found for <code>{recordName}</code>.
                  </Box>
                )}
              </FormField>
            </SpaceBetween>
          </Container>
        )}
      </SpaceBetween>
    </Modal>
  );
};
