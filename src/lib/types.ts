export type ProposalStatus =
  | "draft"
  | "published"
  | "accepted"
  | "changes_requested";

export interface Deliverable {
  title: string;
  description: string;
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  description: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Agency {
  id: string;
  name: string;
  email: string;
  mcp_token: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  agency_id: string;
  slug: string;
  client_name: string;
  title: string;
  executive_summary: string;
  scope: string;
  deliverables: Deliverable[];
  timeline: TimelinePhase[];
  line_items: LineItem[];
  currency: string;
  terms: string;
  valid_until: string | null;
  status: ProposalStatus;
  signed_name: string | null;
  signed_at: string | null;
  signed_ip: string | null;
  change_request_note: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}
