import React, { useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

export interface TagPair {
  id: string;
  key: string;
  value: string;
  error?: string;
}

export interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTags: TagPair[];
  onSave: (tags: TagPair[]) => void;
}

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  isOpen,
  onClose,
  initialTags,
  onSave,
}) => {
  const [tags, setTags] = useState<TagPair[]>(() => (initialTags ? initialTags : []));

  if (!isOpen) return null;

  const addTag = () => {
    if (tags.length >= 50) return;
    setTags((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), key: "", value: "" },
    ]);
  };

  const removeTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTag = (id: string, field: "key" | "value", val: string) => {
    setTags((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, [field]: val };
          if (field === "key" && val.trim()) {
            updated.error = undefined;
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleSave = () => {
    let hasError = false;
    const validated = tags.map((t) => {
      if (!t.key.trim() && t.value.trim()) {
        hasError = true;
        return { ...t, error: "Key is required when value is specified." };
      }
      return t;
    });

    if (hasError) {
      setTags(validated);
      return;
    }

    const cleanTags = tags.filter((t) => t.key.trim().length > 0);
    onSave(cleanTags);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      onDismiss={onClose}
      header="Manage tags"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save changes
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Box color="text-body-secondary">
          Apply tags to hosted zones to help organize and identify them.
        </Box>

        {tags.length === 0 ? (
          <Box textAlign="center" padding="s" color="text-body-secondary">
            No tags associated with the resource. Click &quot;Add new tag&quot; to create one.
          </Box>
        ) : (
          <SpaceBetween size="s">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <FormField label="Key" errorText={tag.error}>
                    <Input
                      value={tag.key}
                      onChange={({ detail }) => updateTag(tag.id, "key", detail.value)}
                      placeholder="e.g. environment"
                    />
                  </FormField>
                </div>
                <div className="flex-1">
                  <FormField label="Value">
                    <Input
                      value={tag.value}
                      onChange={({ detail }) => updateTag(tag.id, "value", detail.value)}
                      placeholder="e.g. production"
                    />
                  </FormField>
                </div>
                <div className="pt-7">
                  <Button onClick={() => removeTag(tag.id)} ariaLabel="Remove tag">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </SpaceBetween>
        )}

        <Button onClick={addTag} disabled={tags.length >= 50}>
          Add new tag
        </Button>
      </SpaceBetween>
    </Modal>
  );
};
