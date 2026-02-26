import { getSiteConfig } from "@/lib/config";
import { ConfigForm } from "./ConfigForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuration" };

function maskDatabaseUrl(url: string | undefined): string {
  if (!url) return "Not set";
  try {
    const u = new URL(url);
    return `${u.protocol}//*****@${u.host}${u.pathname}`;
  } catch {
    return "Invalid URL";
  }
}

export default async function ConfigurationPage() {
  const config = await getSiteConfig();

  const dbUrl = maskDatabaseUrl(process.env.DATABASE_URL);
  const nextAuthUrl = process.env.NEXTAUTH_URL || "Not set";
  const secretSet = !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET !== "replace-me";
  const googleConfigured =
    !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim().length > 10;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuration</h1>
      <p className="text-sm text-gray-500 mb-8">Manage site-wide settings for the support portal.</p>

      <ConfigForm config={config} />

      {/* System Info — read-only */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 text-sm">
          <Row label="Database" value={dbUrl} mono />
          <Row label="Auth URL" value={nextAuthUrl} mono />
          <Row
            label="Auth Secret"
            value={secretSet ? "Configured ✓" : "Not set ✗"}
            ok={secretSet}
          />
          <Row
            label="Google Docs"
            value={googleConfigured ? "Service account configured ✓" : "Not configured"}
            ok={googleConfigured}
          />
        </div>
        {!secretSet && (
          <p className="mt-2 text-xs text-amber-600">
            Set <code className="font-mono bg-amber-50 px-1 rounded">NEXTAUTH_SECRET</code> in your{" "}
            <code className="font-mono bg-amber-50 px-1 rounded">.env</code> file:{" "}
            <code className="font-mono bg-amber-50 px-1 rounded">openssl rand -base64 32</code>
          </p>
        )}
        {!googleConfigured && (
          <p className="mt-1 text-xs text-gray-400">
            Google Docs import is disabled. Add{" "}
            <code className="font-mono bg-gray-50 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_KEY</code> to enable it.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  ok,
}: {
  label: string;
  value: string;
  mono?: boolean;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="w-32 shrink-0 text-gray-500">{label}</span>
      <span
        className={`${mono ? "font-mono text-xs" : ""} ${
          ok === true
            ? "text-green-700"
            : ok === false
            ? "text-red-600"
            : "text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
