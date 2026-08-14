export interface User {
  id: number;
  username: string;
}

export interface HostedZone {
  id: number;
  public_zone_id: string;
  name: string;
  description: string | null;
  zone_type: "PUBLIC" | "PRIVATE";
  record_count: number;
  created_at: string;
  updated_at: string;
}

export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "PTR"
  | "SRV"
  | "CAA"
  | "SOA";

export interface DnsRecord {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: DnsRecordType;
  ttl: number;
  values: string[];
  alias?: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
