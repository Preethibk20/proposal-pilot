import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createServiceRoleClient } from "./supabase/server";
import type { Agency, Proposal } from "./types";
import {
  computeProposalTotal,
  createProposalSchema,
  deliverableSchema,
  generateSlug,
  lineItemSchema,
  timelinePhaseSchema,
  updateProposalSchema,
} from "./validation";

export function buildMcpServerForAgency(agency: Agency, appUrl: string): McpServer {
  const server = new McpServer({
    name: "ProposalPilot",
    version: "1.0.0",
  });

  const supabase = createServiceRoleClient();

  // 1. create_proposal
  server.registerTool(
    "create_proposal",
    {
      title: "Create Proposal Draft",
      description:
        "Create a new DRAFT client proposal in ProposalPilot from call notes, RFPs, or briefs. " +
        "Proposals always start as 'draft' so the human agency can review, edit, and publish them in the dashboard. " +
        "Totals are computed server-side from line_items (quantity * unit_price).",
      inputSchema: {
        client_name: z.string().min(1).describe("Name of the client company or person"),
        title: z.string().min(1).describe("Clear title of the proposal"),
        executive_summary: z
          .string()
          .describe("Concise executive summary of the project and goals"),
        scope: z
          .string()
          .describe("Detailed scope of work formatted in Markdown"),
        deliverables: z
          .array(deliverableSchema)
          .describe("List of concrete deliverables with title and description"),
        timeline: z
          .array(timelinePhaseSchema)
          .describe("Project phases with phase name, duration, and description"),
        line_items: z
          .array(lineItemSchema)
          .describe("Itemized pricing rows with description, quantity, and unit_price"),
        currency: z
          .string()
          .optional()
          .describe("3-letter ISO currency code (default: USD)"),
        terms: z
          .string()
          .optional()
          .describe("Payment schedule and commercial terms"),
        valid_until: z
          .string()
          .nullable()
          .optional()
          .describe("Optional expiration date in YYYY-MM-DD format"),
      },
    },
    async (args) => {
      const parsed = createProposalSchema.safeParse(args);
      if (!parsed.success) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Invalid proposal input: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
            },
          ],
        };
      }

      const input = parsed.data;
      const slug = generateSlug(input.client_name, input.title);

      const { data, error } = await supabase
        .from("proposals")
        .insert({
          agency_id: agency.id,
          slug,
          client_name: input.client_name,
          title: input.title,
          executive_summary: input.executive_summary,
          scope: input.scope,
          deliverables: input.deliverables,
          timeline: input.timeline,
          line_items: input.line_items,
          currency: input.currency,
          terms: input.terms,
          valid_until: input.valid_until ?? null,
          status: "draft",
        })
        .select("*")
        .single();

      if (error || !data) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to create proposal: ${error?.message || "Unknown database error"}`,
            },
          ],
        };
      }

      const created = data as Proposal;
      const total = computeProposalTotal(created.line_items || []);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: created.id,
                slug: created.slug,
                status: created.status,
                total,
                currency: created.currency,
                dashboard_url: `${appUrl}/proposals/${created.id}/edit`,
                public_url: `${appUrl}/p/${created.slug}`,
                note: "Created as DRAFT. Open dashboard_url to review and publish before sharing public_url.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 2. update_proposal
  server.registerTool(
    "update_proposal",
    {
      title: "Update Proposal",
      description:
        "Partially update an existing proposal owned by this agency. " +
        "Refuses updates if the proposal has already been accepted by the client. " +
        "Cannot change status (only the human agency can publish in the dashboard).",
      inputSchema: {
        id: z.string().uuid().describe("UUID of the proposal to update"),
        client_name: z.string().min(1).optional().describe("Updated client name"),
        title: z.string().min(1).optional().describe("Updated proposal title"),
        executive_summary: z.string().optional().describe("Updated executive summary"),
        scope: z.string().optional().describe("Updated Markdown scope of work"),
        deliverables: z
          .array(deliverableSchema)
          .optional()
          .describe("Updated deliverables array"),
        timeline: z
          .array(timelinePhaseSchema)
          .optional()
          .describe("Updated timeline phases array"),
        line_items: z
          .array(lineItemSchema)
          .optional()
          .describe("Updated pricing line items array"),
        currency: z.string().optional().describe("Updated 3-letter currency code"),
        terms: z.string().optional().describe("Updated terms"),
        valid_until: z
          .string()
          .nullable()
          .optional()
          .describe("Updated expiration date (YYYY-MM-DD or null)"),
      },
    },
    async (args) => {
      const { id, ...rest } = args;

      const { data: existing, error: fetchError } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .eq("agency_id", agency.id)
        .single();

      if (fetchError || !existing) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Proposal '${id}' was not found for your agency.`,
            },
          ],
        };
      }

      if (existing.status === "accepted") {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Proposal '${id}' has already been accepted by ${existing.signed_name || "the client"} and is immutable.`,
            },
          ],
        };
      }

      const parsed = updateProposalSchema.safeParse(rest);
      if (!parsed.success) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Invalid update fields: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
            },
          ],
        };
      }

      if (Object.keys(parsed.data).length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "No updatable fields were provided.",
            },
          ],
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from("proposals")
        .update(parsed.data)
        .eq("id", id)
        .eq("agency_id", agency.id)
        .select("*")
        .single();

      if (updateError || !updated) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to update proposal: ${updateError?.message || "Unknown error"}`,
            },
          ],
        };
      }

      const p = updated as Proposal;
      const total = computeProposalTotal(p.line_items || []);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: p.id,
                slug: p.slug,
                status: p.status,
                total,
                currency: p.currency,
                dashboard_url: `${appUrl}/proposals/${p.id}/edit`,
                public_url: `${appUrl}/p/${p.slug}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 3. list_proposals
  server.registerTool(
    "list_proposals",
    {
      title: "List Proposals",
      description:
        "List proposals belonging to your agency, optionally filtered by status " +
        "(draft, published, accepted, changes_requested).",
      inputSchema: {
        status: z
          .enum(["draft", "published", "accepted", "changes_requested"])
          .optional()
          .describe("Optional status filter"),
      },
    },
    async ({ status }) => {
      let query = supabase
        .from("proposals")
        .select("id, title, client_name, status, line_items, currency, updated_at")
        .eq("agency_id", agency.id)
        .order("updated_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list proposals: ${error.message}` }],
        };
      }

      const proposals = (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        client_name: row.client_name,
        status: row.status,
        currency: row.currency,
        total: computeProposalTotal(row.line_items || []),
        updated_at: row.updated_at,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: proposals.length, proposals }, null, 2),
          },
        ],
      };
    }
  );

  // 4. get_proposal
  server.registerTool(
    "get_proposal",
    {
      title: "Get Proposal Details",
      description:
        "Fetch the complete details of a single proposal by ID, including status, " +
        "client signature info (signed_name, signed_at), or change_request_note.",
      inputSchema: {
        id: z.string().uuid().describe("UUID of the proposal"),
      },
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .eq("agency_id", agency.id)
        .single();

      if (error || !data) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Proposal '${id}' was not found for your agency.`,
            },
          ],
        };
      }

      const p = data as Proposal;
      const total = computeProposalTotal(p.line_items || []);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...p,
                total,
                dashboard_url: `${appUrl}/proposals/${p.id}/edit`,
                public_url: `${appUrl}/p/${p.slug}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}
