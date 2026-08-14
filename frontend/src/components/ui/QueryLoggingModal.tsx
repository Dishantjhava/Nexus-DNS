"use client";

import React, { useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Toggle from "@cloudscape-design/components/toggle";
import Alert from "@cloudscape-design/components/alert";

export interface QueryLoggingConfig {
  enabled: boolean;
  logGroupArn: string;
  logStreamPrefix: string;
}

interface QueryLoggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: number;
  domainName: string;
  initialConfig?: QueryLoggingConfig | null;
  onSave: (config: QueryLoggingConfig) => void;
}

export const QueryLoggingModal: React.FC<QueryLoggingModalProps> = ({
  isOpen,
  onClose,
  zoneId,
  domainName,
  initialConfig,
  onSave,
}) => {
  const defaultArn = `arn:aws:logs:us-east-1:881415009887:log-group:route53/${domainName}`;

  const [enabled, setEnabled] = useState(() => initialConfig?.enabled ?? false);
  const [logGroupArn, setLogGroupArn] = useState(() => initialConfig?.logGroupArn || defaultArn);
  const [logStreamPrefix, setLogStreamPrefix] = useState(() => initialConfig?.logStreamPrefix || "query-logs-");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    if (enabled && !logGroupArn.trim()) {
      setError("CloudWatch log group ARN is required when query logging is enabled.");
      return;
    }

    setSaving(true);
    const config: QueryLoggingConfig = {
      enabled,
      logGroupArn: logGroupArn.trim(),
      logStreamPrefix: logStreamPrefix.trim(),
    };

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`nexus_dns_query_log_${zoneId}`, JSON.stringify(config));
      }
      onSave(config);
      setSaving(false);
      onClose();
    } catch {
      setError("Failed to save query logging configuration.");
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      onDismiss={onClose}
      header="Configure query logging"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Save configuration
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        {error && <Alert type="error">{error}</Alert>}

        <Box color="text-body-secondary">
          Configure Route 53 to log DNS queries received for <b>{domainName}</b> to Amazon CloudWatch Logs.
        </Box>

        <FormField
          label="Query logging status"
          description="Enable or disable DNS query logging for this hosted zone."
        >
          <Toggle
            checked={enabled}
            onChange={({ detail }) => setEnabled(detail.checked)}
          >
            {enabled ? "Enabled" : "Disabled"}
          </Toggle>
        </FormField>

        {enabled && (
          <>
            <FormField
              label="CloudWatch log group ARN"
              description="Specify the Amazon Resource Name (ARN) of the CloudWatch Logs log group."
              constraintText="Example: arn:aws:logs:us-east-1:123456789012:log-group:route53/example.com"
            >
              <Input
                value={logGroupArn}
                onChange={({ detail }) => setLogGroupArn(detail.value)}
                placeholder={defaultArn}
              />
            </FormField>

            <FormField
              label="Log stream prefix - optional"
              description="A prefix to append to log stream names in CloudWatch Logs."
            >
              <Input
                value={logStreamPrefix}
                onChange={({ detail }) => setLogStreamPrefix(detail.value)}
                placeholder="query-logs-"
              />
            </FormField>

            <Alert type="info">
              Query logging publishes log streams to CloudWatch Logs under <code>{logGroupArn || defaultArn}</code>.
            </Alert>
          </>
        )}
      </SpaceBetween>
    </Modal>
  );
};
