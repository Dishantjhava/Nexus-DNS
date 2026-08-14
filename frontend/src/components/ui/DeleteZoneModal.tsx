"use client";

import React, { useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface DeleteZoneModalProps {
  isOpen: boolean;
  domainName: string;
  publicZoneId: string;
  recordCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteZoneModal: React.FC<DeleteZoneModalProps> = ({
  isOpen,
  domainName,
  onClose,
  onConfirm,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = () => {
    setConfirmInput("");
    setError(null);
    setDeleting(false);
    onClose();
  };

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim().toLowerCase() === "delete";

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete hosted zone";
      setError(msg);
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      onDismiss={handleDismiss}
      header={`Delete hosted zone ${domainName}?`}
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleDismiss} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={!isConfirmed || deleting}
              loading={deleting}
            >
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Box color="text-body-secondary">
          Delete the hosted zone permanently? This action cannot be undone. Your domain might become unavailable on the internet.
        </Box>

        <div className="h-[1px] bg-[#E9EAEA] w-full my-1" />

        <FormField
          label={
            <span>
              To confirm that you want to delete the hosted zone, enter <i>delete</i> in the field.
            </span>
          }
        >
          <Input
            value={confirmInput}
            onChange={({ detail }) => setConfirmInput(detail.value)}
            placeholder="delete"
            autoFocus
          />
        </FormField>

        {error && <Alert type="error">{error}</Alert>}
      </SpaceBetween>
    </Modal>
  );
};
