"use client";

import React, { useState, useEffect, use } from "react";
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
import { api } from "@/lib/api";
import { HostedZone } from "@/lib/types";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";

interface TagItem {
  id: string;
  key: string;
  value: string;
  error?: string;
}

interface PageProps {
  params: Promise<{ zoneId: string }>;
}

export default function EditHostedZonePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const zoneId = parseInt(resolvedParams.zoneId, 10);
  const { setCustomBreadcrumbs } = useBreadcrumbs();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load zone data
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await api.zones.get(zoneId);
        if (!ignore) {
          setZone(data);
          setDescription(data.description || "");
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

  // Set breadcrumbs: Route 53 > Hosted zones > domain.com > Edit
  useEffect(() => {
    if (zone?.name) {
      setCustomBreadcrumbs([
        { label: "Route 53", href: "/hosted-zones" },
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: zone.name, href: `/hosted-zones/${zoneId}` },
        { label: "Edit" },
      ]);
    }
    return () => { setCustomBreadcrumbs(null); };
  }, [zone?.name, zoneId, setCustomBreadcrumbs]);

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
          if (field === "key" && val.trim()) updated.error = undefined;
          return updated;
        }
        return t;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate tag keys
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
      await api.zones.update(zoneId, { description: description.trim() || null });
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update hosted zone");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[860px] w-full mx-auto p-6">
        <Box color="text-body-secondary">Loading hosted zone...</Box>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="max-w-[860px] w-full mx-auto p-6">
        <Alert type="error">{error || "Hosted zone not found."}</Alert>
      </div>
    );
  }

  const isPublic = String(zone.zone_type).toUpperCase() === "PUBLIC";

  return (
    <form onSubmit={handleSubmit} className="max-w-[860px] w-full mx-auto p-4">
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.push(`/hosted-zones/${zoneId}`)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} formAction="submit">
              Save changes
            </Button>
          </SpaceBetween>
        }
        header={
          <Header
            variant="h1"
            info={
              <Box color="text-status-info" display="inline">
                <span
                  className="text-[#0972D3] text-[13px] font-normal cursor-pointer hover:underline ml-2"
                  onClick={() => {}}
                >
                  Info
                </span>
              </Box>
            }
          >
            Edit {zone.name}
          </Header>
        }
      >
        <SpaceBetween size="l">
          {error && <Alert type="error">{error}</Alert>}

          {/* Edit hosted zone container */}
          <Container
            header={
              <Header
                variant="h2"
                description="A hosted zone is a container that holds information about how you want to route traffic for a domain, such as example.com, and its subdomains."
              >
                Edit hosted zone
              </Header>
            }
          >
            <SpaceBetween size="l">
              {/* Domain name — read-only */}
              <FormField label="Domain name">
                <Input value={zone.name} disabled ariaLabel="Domain name" />
              </FormField>

              {/* Hosted zone ID — read-only */}
              <FormField label="Hosted zone ID">
                <Input value={zone.public_zone_id} disabled ariaLabel="Hosted zone ID" />
              </FormField>

              {/* Record count — read-only */}
              <FormField label="Record count">
                <Input value={String(zone.record_count)} disabled ariaLabel="Record count" />
              </FormField>

              {/* Type — read-only */}
              <FormField label="Type">
                <Input
                  value={isPublic ? "Public hosted zone" : "Private hosted zone"}
                  disabled
                  ariaLabel="Type"
                />
              </FormField>

              {/* Description — editable */}
              <FormField
                label={
                  <span>
                    Description -{" "}
                    <span className="font-normal text-[#414D5C]">optional</span>
                    {"  "}
                    <span className="text-[#0972D3] text-[13px] cursor-pointer hover:underline">
                      Info
                    </span>
                  </span>
                }
                description="This value lets you distinguish hosted zones that have the same name."
                constraintText={`The description can have up to 256 characters. ${description.length}/256`}
              >
                <Textarea
                  value={description}
                  onChange={({ detail }) => {
                    if (detail.value.length <= 256) setDescription(detail.value);
                  }}
                  placeholder="The hosted zone is used for..."
                  rows={4}
                />
              </FormField>
            </SpaceBetween>
          </Container>

          {/* Tags container */}
          <Container
            header={
              <Header
                variant="h2"
                description="Apply tags to hosted zones to help organize and identify them."
                info={
                  <span className="text-[#0972D3] text-[13px] cursor-pointer hover:underline">
                    Info
                  </span>
                }
              >
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
                          />
                        </FormField>
                      </div>
                      <div className="flex-1">
                        <FormField label="Value - optional">
                          <Input
                            value={tag.value}
                            onChange={({ detail }) => updateTag(tag.id, "value", detail.value)}
                            placeholder="Enter value"
                          />
                        </FormField>
                      </div>
                      <div className="pt-8">
                        <Button onClick={() => removeTag(tag.id)}>Remove tag</Button>
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
