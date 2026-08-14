"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Form from "@cloudscape-design/components/form";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import { api } from "@/lib/api";

interface TagItem {
  id: string;
  key: string;
  value: string;
  error?: string;
}

function validateDomainName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Domain name is required.";
  }
  if (trimmed.startsWith(".")) {
    return "Domain name cannot start with a dot.";
  }
  if (trimmed.length > 253) {
    return "Domain name cannot exceed 253 characters.";
  }
  if (trimmed.includes("..")) {
    return "Domain name cannot contain consecutive dots.";
  }

  const normalized = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
  const labels = normalized.split(".");

  if (labels.length < 2) {
    return "Invalid domain name format. Must include a top-level domain (e.g. example.com).";
  }

  for (const label of labels) {
    if (!label) {
      return "Domain name labels cannot be empty.";
    }
    if (label.length > 63) {
      return "Domain name label cannot exceed 63 characters.";
    }
    if (label.startsWith("-") || label.endsWith("-")) {
      return "Domain name labels cannot start or end with a hyphen.";
    }
    if (!/^[a-zA-Z0-9-]+$/.test(label)) {
      return `Invalid characters in domain name label '${label}'. Valid characters: a-z, 0-9, and hyphens.`;
    }
  }

  return null;
}

export default function CreateHostedZonePage() {
  const router = useRouter();

  const [domainName, setDomainName] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [zoneType, setZoneType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  
  // Interactive Tags state
  const [tags, setTags] = useState<TagItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate domain name
    const dError = validateDomainName(domainName);
    if (dError) {
      setDomainError(dError);
      setError(dError);
      return;
    }
    setDomainError(null);

    // Validate Tags key emptiness
    let hasTagError = false;
    const validatedTags = tags.map((t) => {
      if (!t.key.trim()) {
        hasTagError = true;
        return { ...t, error: "Key is empty." };
      }
      return t;
    });

    if (hasTagError) {
      setTags(validatedTags);
      setError("Please fix the tag validation errors before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const zone = await api.zones.create({
        name: domainName.trim(),
        description: description.trim() || null,
        zone_type: zoneType,
      });

      sessionStorage.setItem("created_zone_name", zone.name);
      router.push(`/hosted-zones/${zone.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create hosted zone";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[1200px] w-full mx-auto p-4">
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.push("/hosted-zones")}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} formAction="submit">
              Create hosted zone
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Create hosted zone</Header>}
      >
        <SpaceBetween size="l">
          {error && <Alert type="error">{error}</Alert>}

          <Container
            header={
              <Header
                variant="h2"
                description="A hosted zone is a container that holds information about how you want to route traffic for a domain, such as example.com, and its subdomains."
              >
                Hosted zone configuration
              </Header>
            }
          >
            <SpaceBetween size="m">
              <FormField
                label="Domain name"
                description="This is the name of the domain that you want to route traffic for."
                constraintText="Valid characters: a-z, 0-9, and standard DNS punctuation."
                errorText={domainError}
              >
                <Input
                  value={domainName}
                  onChange={({ detail }) => {
                    setDomainName(detail.value);
                    if (domainError) setDomainError(null);
                    if (error) setError(null);
                  }}
                  placeholder="example.com"
                  invalid={!!domainError}
                />
              </FormField>

              <FormField
                label="Description - optional"
                description="This value lets you distinguish hosted zones that have the same name."
              >
                <Textarea
                  value={description}
                  onChange={({ detail }) => setDescription(detail.value)}
                  placeholder="The hosted zone is used for..."
                />
              </FormField>

              <FormField
                label="Type"
                description="The type indicates whether you want to route traffic on the internet or in an Amazon VPC."
              >
                <RadioGroup
                  value={zoneType}
                  onChange={({ detail }) => setZoneType(detail.value as "PUBLIC" | "PRIVATE")}
                  items={[
                    {
                      value: "PUBLIC",
                      label: "Public hosted zone",
                      description: "A public hosted zone determines how traffic is routed on the internet.",
                    },
                    {
                      value: "PRIVATE",
                      label: "Private hosted zone",
                      description: "A private hosted zone determines how traffic is routed within an Amazon VPC.",
                    },
                  ]}
                />
              </FormField>
            </SpaceBetween>
          </Container>

          {/* Interactive Tags Section */}
          <Container
            header={
              <Header variant="h2" description="Apply tags to hosted zones to help organize and identify them.">
                Tags
              </Header>
            }
          >
            <SpaceBetween size="m">
              {tags.length === 0 ? (
                <Box color="text-body-secondary">No tags associated with the resource.</Box>
              ) : (
                <SpaceBetween size="s">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-start gap-4">
                      <div className="flex-1">
                        <FormField label="Key" errorText={tag.error}>
                          <Input
                            value={tag.key}
                            onChange={({ detail }) => updateTag(tag.id, "key", detail.value)}
                            placeholder="Enter key"
                            type="search"
                          />
                        </FormField>
                      </div>

                      <div className="flex-1">
                        <FormField label="Value - optional">
                          <Input
                            value={tag.value}
                            onChange={({ detail }) => updateTag(tag.id, "value", detail.value)}
                            placeholder="Enter value"
                            type="search"
                          />
                        </FormField>
                      </div>

                      <div className="pt-8">
                        <Button onClick={() => removeTag(tag.id)}>
                          Remove tag
                        </Button>
                      </div>
                    </div>
                  ))}
                </SpaceBetween>
              )}

              <SpaceBetween size="xxs">
                <Box float="left">
                  <Button onClick={addTag} disabled={tags.length >= 50}>
                    Add tag
                  </Button>
                </Box>
                <Box variant="small" color="text-body-secondary">
                  {`You can add up to ${50 - tags.length} more tags.`}
                </Box>
              </SpaceBetween>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </Form>
    </form>
  );
}
