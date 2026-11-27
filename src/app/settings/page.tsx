import { headers } from "next/headers";
import { requireAgency } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { SettingsClient } from "@/components/SettingsClient";
import { getAppUrl } from "@/lib/utils";

export default async function SettingsPage() {
  const agency = await requireAgency();

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : undefined;
  const appUrl = getAppUrl(origin);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar agencyName={agency.name} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <SettingsClient
          agencyName={agency.name}
          agencyEmail={agency.email}
          initialToken={agency.mcp_token}
          appUrl={appUrl}
        />
      </main>
    </div>
  );
}
