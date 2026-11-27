import { z } from "zod";
import type { LineItem } from "./types";

export const deliverableSchema = z.object({
  title: z.string().trim().min(1, "Deliverable title is required").max(200),
  description: z.string().trim().max(2000).default(""),
});

export const timelinePhaseSchema = z.object({
  phase: z.string().trim().min(1, "Phase name is required").max(200),
  duration: z.string().trim().min(1, "Duration is required").max(100),
  description: z.string().trim().max(2000).default(""),
});

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Line item description is required").max(300),
  quantity: z.coerce.number().min(0, "Quantity must be >= 0").max(100000),
  unit_price: z.coerce.number().min(0, "Unit price must be >= 0").max(100000000),
});

export const createProposalSchema = z.object({
  client_name: z.string().trim().min(1, "Client name is required").max(200),
  title: z.string().trim().min(1, "Proposal title is required").max(300),
  executive_summary: z.string().trim().max(10000).default(""),
  scope: z.string().trim().max(30000).default(""),
  deliverables: z.array(deliverableSchema).max(50).default([]),
  timeline: z.array(timelinePhaseSchema).max(50).default([]),
  line_items: z.array(lineItemSchema).max(100).default([]),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code (e.g. USD)")
    .default("USD"),
  terms: z.string().trim().max(20000).default(""),
  valid_until: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "valid_until must be YYYY-MM-DD")
    .nullable()
    .optional(),
});

export const updateProposalSchema = createProposalSchema.partial();

export const acceptProposalSchema = z.object({
  signed_name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(200),
  agreed_to_terms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms to sign"),
});

export const requestChangesSchema = z.object({
  note: z
    .string()
    .trim()
    .min(5, "Please describe the changes you would like (at least 5 characters)")
    .max(5000),
});

export function computeProposalTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => {
    const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
    const price = Number.isFinite(item.unit_price) ? item.unit_price : 0;
    return sum + qty * price;
  }, 0);
}

export function generateSlug(clientName: string, title: string): string {
  const base = `${clientName}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "proposal"}-${suffix}`;
}
