"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="h-64 border rounded-lg bg-gray-50 animate-pulse" /> }
);

type Tab = "google-docs" | "docx";

export default function ImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("google-docs");

  // Google Docs state
  const [googleUrl, setGoogleUrl] = useState("");
  const [isLoadingGDoc, setIsLoadingGDoc] = useState(false);

  // Docx state
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);

  // Shared preview state
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const importGoogleDoc = async () => {
    if (!googleUrl.trim()) { toast.error("Enter a Google Docs URL"); return; }
    setIsLoadingGDoc(true);
    try {
      const res = await fetch("/api/import/google-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: googleUrl }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Import failed"); return; }
      setPreviewTitle(data.title);
      setPreviewContent(data.content);
      toast.success("Document imported! Review and save below.");
    } finally {
      setIsLoadingGDoc(false);
    }
  };

  const importDocx = async () => {
    if (!docxFile) { toast.error("Select a .docx file"); return; }
    setIsLoadingDocx(true);
    const formData = new FormData();
    formData.append("file", docxFile);
    try {
      const res = await fetch("/api/import/docx", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Import failed"); return; }
      setPreviewTitle(data.title);
      setPreviewContent(data.content);
      toast.success("Document imported! Review and save below.");
    } finally {
      setIsLoadingDocx(false);
    }
  };

  const saveAsArticle = async () => {
    if (!previewTitle.trim() || !previewContent.trim()) {
      toast.error("Title and content required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: previewTitle,
          content: previewContent,
          status: "DRAFT",
          changeNote: "Imported document",
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Failed to save article"); return; }
      toast.success("Saved as draft!");
      router.push(`/dashboard/articles/${data.id}/edit`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "google-docs", label: "Google Docs" },
    { id: "docx", label: "Word (.docx)" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import Document</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Google Docs tab */}
      {activeTab === "google-docs" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>The document must be shared with the service account email</li>
              <li>Or the document must be accessible to &ldquo;Anyone with the link&rdquo;</li>
              <li>URL format: https://docs.google.com/document/d/DOCUMENT_ID/...</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="https://docs.google.com/document/d/..."
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={importGoogleDoc} isLoading={isLoadingGDoc}>
              Import
            </Button>
          </div>
        </div>
      )}

      {/* Docx tab */}
      {activeTab === "docx" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".docx"
              onChange={(e) => setDocxFile(e.target.files?.[0] || null)}
              className="hidden"
              id="docx-upload"
            />
            <label htmlFor="docx-upload" className="cursor-pointer">
              <p className="text-gray-600">
                {docxFile ? (
                  <span className="font-medium text-blue-600">{docxFile.name}</span>
                ) : (
                  <>
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">.docx files only</p>
            </label>
          </div>
          <Button onClick={importDocx} isLoading={isLoadingDocx} disabled={!docxFile}>
            Convert & Preview
          </Button>
        </div>
      )}

      {/* Preview */}
      {previewContent && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Preview & Edit</h2>
          <Input
            label="Title"
            value={previewTitle}
            onChange={(e) => setPreviewTitle(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <TiptapEditor content={previewContent} onChange={setPreviewContent} />
          </div>
          <div className="flex gap-3">
            <Button onClick={saveAsArticle} isLoading={isSaving}>
              Save as Draft Article
            </Button>
            <Button variant="ghost" onClick={() => { setPreviewContent(""); setPreviewTitle(""); }}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
