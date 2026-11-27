import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextResponse } from "next/server";
import { buildMcpServerForAgency } from "@/lib/mcp-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Agency } from "@/lib/types";
import { getAppUrl } from "@/lib/utils";

async function authenticateToken(token: string): Promise<Agency | null> {
  if (!token || token.length < 24) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("mcp_token", token)
    .single();

  if (error || !data) return null;
  return data as Agency;
}

async function handleMcpRequest(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rate = checkRateLimit(`mcp:${token.slice(0, 8)}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  const agency = await authenticateToken(token);
  if (!agency) {
    return NextResponse.json(
      { error: "Invalid or expired MCP token." },
      { status: 401 }
    );
  }

  const origin = new URL(request.url).origin;
  const appUrl = getAppUrl(origin);

  const server = buildMcpServerForAgency(agency, appUrl);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  return handleMcpRequest(request, context);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  return handleMcpRequest(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  return handleMcpRequest(request, context);
}
