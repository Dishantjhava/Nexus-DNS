import { DnsRecord, DnsRecordType, HostedZone, PaginatedResponse, User } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const isGet = !options.method || options.method === "GET";
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Send session_token cookie automatically
    // Always bypass browser cache for GET so refresh fetches fresh data from FastAPI → SQLite
    cache: isGet ? "no-store" : "default",
  });

  if (response.status === 401) {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || "Unauthorized - Session expired");
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.detail || `HTTP Error ${response.status}`;
    const err = new Error(errorMsg) as Error & { status: number; code?: string };
    err.status = response.status;
    err.code = data?.error?.code;
    throw err;
  }

  return data as T;
}

export const api = {
  auth: {
    login: (username: string, password: string): Promise<User> =>
      fetchApi<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),

    logout: (): Promise<void> =>
      fetchApi<void>("/api/auth/logout", {
        method: "POST",
      }),

    me: (): Promise<User> => fetchApi<User>("/api/auth/me"),
  },

  zones: {
    list: (
      page: number = 1,
      pageSize: number = 20,
      search?: string
    ): Promise<PaginatedResponse<HostedZone>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append("search", search);
      return fetchApi<PaginatedResponse<HostedZone>>(`/api/hosted-zones?${params.toString()}`);
    },

    get: (id: number): Promise<HostedZone> =>
      fetchApi<HostedZone>(`/api/hosted-zones/${id}`),

    create: (data: {
      name: string;
      description?: string | null;
      zone_type?: "PUBLIC" | "PRIVATE";
    }): Promise<HostedZone> =>
      fetchApi<HostedZone>("/api/hosted-zones", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: number, data: { description?: string | null }): Promise<HostedZone> =>
      fetchApi<HostedZone>(`/api/hosted-zones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: number): Promise<void> =>
      fetchApi<void>(`/api/hosted-zones/${id}`, {
        method: "DELETE",
      }),
  },

  records: {
    list: (
      zoneId: number,
      page: number = 1,
      pageSize: number = 20,
      search?: string,
      type?: DnsRecordType
    ): Promise<PaginatedResponse<DnsRecord>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (type) params.append("type", type);
      return fetchApi<PaginatedResponse<DnsRecord>>(
        `/api/hosted-zones/${zoneId}/records?${params.toString()}`
      );
    },

    get: (zoneId: number, recordId: number): Promise<DnsRecord> =>
      fetchApi<DnsRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`),

    create: (
      zoneId: number,
      data: {
        name: string;
        type: DnsRecordType;
        ttl: number;
        values: unknown[];
      }
    ): Promise<DnsRecord> =>
      fetchApi<DnsRecord>(`/api/hosted-zones/${zoneId}/records`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (
      zoneId: number,
      recordId: number,
      data: {
        name?: string;
        type?: DnsRecordType;
        ttl?: number;
        values?: unknown[];
      }
    ): Promise<DnsRecord> =>
      fetchApi<DnsRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (zoneId: number, recordId: number): Promise<void> =>
      fetchApi<void>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
        method: "DELETE",
      }),
  },
};
