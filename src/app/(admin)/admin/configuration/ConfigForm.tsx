"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { SiteConfig } from "@prisma/client";

interface ConfigFormProps {
  config: SiteConfig;
  googleClientEmail: string | null;
}

interface GoogleKeyInfo {
  client_email?: string;
  project_id?: string;
  type?: string;
}

function parseKeyInfo(raw: string): { ok: true; info: GoogleKeyInfo } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    const required = ["type", "project_id", "private_key", "client_email"];
    const missing = required.filter((f) => !parsed[f]);
    if (missing.length > 0) return { ok: false, error: `Missing fields: ${missing.join(", ")}` };
    return { ok: true, info: parsed };
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}

export function ConfigForm({ config, googleClientEmail }: ConfigFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    siteName: config.siteName,
    siteDescription: config.siteDescription ?? "",
    allowRegistration: config.allowRegistration,
    defaultRole: config.defaultRole,
    commentsEnabled: config.commentsEnabled,
    commentsRequireApproval: config.commentsRequireApproval,
    anonymousCommentsEnabled: config.anonymousCommentsEnabled,
    articlesPerPage: config.articlesPerPage,
    showAuthor: config.showAuthor,
  });

  // Google Docs state (managed separately from main settings)
  const [googleKeyInput, setGoogleKeyInput] = useState("");
  const [clearGoogle, setClearGoogle] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);

  const set = (key: keyof typeof values, val: unknown) =>
    setValues((v) => ({ ...v, [key]: val }));

  // Live parse of whatever is in the textarea
  const keyPreview = googleKeyInput.trim()
    ? parseKeyInfo(googleKeyInput.trim())
    : null;

  /* ── Main settings save ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          articlesPerPage: Number(values.articlesPerPage),
          siteDescription: values.siteDescription || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Configuration saved");
      router.refresh();
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  /* ── Google credentials save ── */
  const handleGoogleSave = async () => {
    if (clearGoogle) {
      setSavingGoogle(true);
      try {
        const res = await fetch("/api/admin/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleServiceAccountKey: null }),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Google credentials removed");
        setClearGoogle(false);
        router.refresh();
      } catch {
        toast.error("Failed to remove credentials");
      } finally {
        setSavingGoogle(false);
      }
      return;
    }

    if (!googleKeyInput.trim()) return;

    if (!keyPreview?.ok) {
      toast.error("Fix the JSON errors before saving");
      return;
    }

    setSavingGoogle(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleServiceAccountKey: googleKeyInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success("Google credentials saved");
      setGoogleKeyInput("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save credentials");
    } finally {
      setSavingGoogle(false);
    }
  };

  const currentlyConfigured = !!googleClientEmail && !clearGoogle;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* General */}
      <Section title="General">
        <Field label="Site Name">
          <input
            type="text"
            value={values.siteName}
            onChange={(e) => set("siteName", e.target.value)}
            className={input}
            required
            maxLength={100}
          />
        </Field>
        <Field label="Site Description" hint="Shown in search results and the portal header.">
          <textarea
            value={values.siteDescription}
            onChange={(e) => set("siteDescription", e.target.value)}
            className={`${input} h-20 resize-none`}
            maxLength={500}
          />
        </Field>
      </Section>

      {/* Registration */}
      <Section title="Registration">
        <Toggle
          label="Allow public registration"
          hint="When off, only admins can create new accounts."
          checked={values.allowRegistration}
          onChange={(v) => set("allowRegistration", v)}
        />
        <Field label="Default role for new users">
          <select
            value={values.defaultRole}
            onChange={(e) => set("defaultRole", e.target.value)}
            className={select}
          >
            <option value="VIEWER">VIEWER — read-only access</option>
            <option value="EDITOR">EDITOR — can create and edit articles</option>
          </select>
        </Field>
      </Section>

      {/* Comments */}
      <Section title="Comments">
        <Toggle
          label="Enable comments"
          hint="When off, the comment section is hidden on all articles."
          checked={values.commentsEnabled}
          onChange={(v) => set("commentsEnabled", v)}
        />
        <Toggle
          label="Require approval"
          hint="Comments from non-editors must be approved before appearing."
          checked={values.commentsRequireApproval}
          onChange={(v) => set("commentsRequireApproval", v)}
        />
        <Toggle
          label="Allow anonymous comments"
          hint="Let visitors comment without signing in."
          checked={values.anonymousCommentsEnabled}
          onChange={(v) => set("anonymousCommentsEnabled", v)}
        />
      </Section>

      {/* Content */}
      <Section title="Content">
        <Field label="Articles per page" hint="Number of articles shown per page in listings (1–100).">
          <input
            type="number"
            min={1}
            max={100}
            value={values.articlesPerPage}
            onChange={(e) => set("articlesPerPage", e.target.value)}
            className={`${input} w-24`}
          />
        </Field>
        <Toggle
          label="Show author on articles"
          hint="Display the author's name on published articles."
          checked={values.showAuthor}
          onChange={(v) => set("showAuthor", v)}
        />
      </Section>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save Configuration"}
        </button>
      </div>

      {/* Google Docs — separate section, separate save */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Google Docs Integration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Paste a Google service account JSON to enable importing from Google Docs.{" "}
          <a
            href="https://console.cloud.google.com/iam-admin/serviceaccounts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Create a service account →
          </a>
        </p>

        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {/* Current status */}
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              {currentlyConfigured ? (
                <p className="text-xs text-green-700 mt-0.5">
                  Configured — <span className="font-mono">{googleClientEmail}</span>
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Not configured</p>
              )}
            </div>
            {currentlyConfigured && !clearGoogle && (
              <button
                type="button"
                onClick={() => setClearGoogle(true)}
                className="text-xs text-red-600 hover:text-red-700 border border-red-200 rounded px-2 py-1 transition-colors"
              >
                Remove credentials
              </button>
            )}
            {clearGoogle && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Will be removed on save</span>
                <button
                  type="button"
                  onClick={() => setClearGoogle(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Undo
                </button>
              </div>
            )}
          </div>

          {/* Key input */}
          {!clearGoogle && (
            <div className="px-4 py-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {currentlyConfigured ? "Replace service account JSON" : "Service account JSON"}
              </label>
              <textarea
                value={googleKeyInput}
                onChange={(e) => setGoogleKeyInput(e.target.value)}
                placeholder='{"type":"service_account","project_id":"...","client_email":"...@....iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\n...", ...}'
                className={`${input} h-28 resize-none font-mono text-xs`}
                spellCheck={false}
              />

              {/* Live validation feedback */}
              {keyPreview && (
                <div
                  className={`text-xs rounded px-3 py-2 ${
                    keyPreview.ok
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {keyPreview.ok ? (
                    <>
                      ✓ Valid JSON &mdash;{" "}
                      <span className="font-mono">{keyPreview.info.client_email}</span>{" "}
                      ({keyPreview.info.project_id})
                    </>
                  ) : (
                    <>✗ {keyPreview.error}</>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleGoogleSave}
            disabled={
              savingGoogle ||
              (!clearGoogle && (!googleKeyInput.trim() || !keyPreview?.ok))
            }
            className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 disabled:opacity-40 transition-colors"
          >
            {savingGoogle
              ? "Saving…"
              : clearGoogle
              ? "Remove credentials"
              : "Save Google credentials"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Small layout helpers ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-6 px-4 py-4">
      <div className="w-52 shrink-0 pt-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

const input =
  "w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const select =
  "text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
