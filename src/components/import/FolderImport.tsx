"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface FolderFile {
  id: string;
  name: string;
  folderPath: string[];
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
}

interface ImportItem {
  fileId: string;
  name: string;
  folderPath: string[];
  checked: boolean;
  categoryId: string | null;
  status: "DRAFT" | "PUBLISHED";
}

interface ImportResult {
  fileId: string;
  title: string;
  success: boolean;
  articleId?: string;
  error?: string;
}

type Stage = "idle" | "listing" | "selecting" | "importing" | "done";

export function FolderImport() {
  const [folderUrl, setFolderUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [folderName, setFolderName] = useState("");
  const [items, setItems] = useState<ImportItem[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState({ total: 0, succeeded: 0, failed: 0 });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: any[]) => {
        const flat: Category[] = [];
        for (const cat of data) {
          flat.push({ id: cat.id, name: cat.name, parentId: null });
          for (const child of cat.children || []) {
            flat.push({ id: child.id, name: `  ${child.name}`, parentId: cat.id });
          }
        }
        setCategories(flat);
      })
      .catch(() => {});
  }, []);

  const browseFolder = async () => {
    if (!folderUrl.trim()) {
      toast.error("Enter a Google Drive folder URL");
      return;
    }
    setStage("listing");
    try {
      const res = await fetch(
        `/api/import/google-drive-folder?url=${encodeURIComponent(folderUrl)}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to list folder");
        setStage("idle");
        return;
      }
      if (!data.files?.length) {
        toast.error("No Google Docs found in this folder");
        setStage("idle");
        return;
      }
      setFolderName(data.folderName);
      setItems(
        data.files.map((f: FolderFile) => ({
          fileId: f.id,
          name: f.name,
          folderPath: f.folderPath,
          checked: true,
          categoryId: f.suggestedCategoryId,
          status: "DRAFT" as const,
        }))
      );
      setStage("selecting");
    } catch {
      toast.error("Network error");
      setStage("idle");
    }
  };

  const importSelected = async () => {
    const selected = items.filter((i) => i.checked);
    if (!selected.length) {
      toast.error("Select at least one document");
      return;
    }
    setStage("importing");
    try {
      const res = await fetch("/api/import/google-drive-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selected.map((i) => ({
            fileId: i.fileId,
            title: i.name,
            categoryId: i.categoryId,
            status: i.status,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Import failed");
        setStage("selecting");
        return;
      }
      setResults(data.results);
      setSummary(data.summary);
      setStage("done");
      if (data.summary.succeeded > 0) {
        toast.success(
          `Imported ${data.summary.succeeded} article${data.summary.succeeded !== 1 ? "s" : ""}`
        );
      }
    } catch {
      toast.error("Network error");
      setStage("selecting");
    }
  };

  const reset = () => {
    setFolderUrl("");
    setStage("idle");
    setFolderName("");
    setItems([]);
    setResults([]);
  };

  const updateItem = (idx: number, patch: Partial<ImportItem>) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  const selectedCount = items.filter((i) => i.checked).length;

  // ── Idle ───────────────────────────────────────────────────────────────────
  if (stage === "idle") {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Requirements:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>The folder must be shared with the service account email</li>
            <li>Documents in subfolders are auto-matched to categories by folder name</li>
            <li>URL format: https://drive.google.com/drive/folders/FOLDER_ID</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="https://drive.google.com/drive/folders/..."
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && browseFolder()}
            className="flex-1"
          />
          <Button onClick={browseFolder}>Browse Folder</Button>
        </div>
      </div>
    );
  }

  // ── Listing ────────────────────────────────────────────────────────────────
  if (stage === "listing") {
    return (
      <div className="flex items-center gap-3 py-10 text-gray-500">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Scanning folder contents…</span>
      </div>
    );
  }

  // ── Selecting ──────────────────────────────────────────────────────────────
  if (stage === "selecting") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{folderName}</h3>
            <p className="text-sm text-gray-500">
              {items.length} document{items.length !== 1 ? "s" : ""} found &middot;{" "}
              {selectedCount} selected
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setItems((prev) => prev.map((i) => ({ ...i, checked: true })))}
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setItems((prev) => prev.map((i) => ({ ...i, checked: false })))}
            >
              Deselect all
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="w-10 px-3 py-2" />
                <th className="px-3 py-2 text-left">Document</th>
                <th className="px-3 py-2 text-left w-44">Category</th>
                <th className="px-3 py-2 text-left w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={item.fileId} className={item.checked ? "" : "opacity-40"}>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => updateItem(idx, { checked: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div
                      className="font-medium text-gray-900 truncate max-w-xs"
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    {item.folderPath.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.folderPath.join(" / ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.categoryId || ""}
                      onChange={(e) => updateItem(idx, { categoryId: e.target.value || null })}
                      disabled={!item.checked}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateItem(idx, { status: e.target.value as "DRAFT" | "PUBLISHED" })
                      }
                      disabled={!item.checked}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <Button onClick={importSelected} disabled={selectedCount === 0}>
            Import {selectedCount > 0 ? `${selectedCount} ` : ""}
            Document{selectedCount !== 1 ? "s" : ""}
          </Button>
          <Button variant="ghost" onClick={reset}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── Importing ──────────────────────────────────────────────────────────────
  if (stage === "importing") {
    return (
      <div className="flex items-center gap-3 py-10 text-gray-500">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>
          Importing {selectedCount} document{selectedCount !== 1 ? "s" : ""}… this may take a
          moment.
        </span>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg p-4 ${
          summary.failed === 0
            ? "bg-green-50 border border-green-200"
            : "bg-yellow-50 border border-yellow-200"
        }`}
      >
        <p className="font-medium text-gray-900">
          Import complete — {summary.succeeded} of {summary.total} succeeded
          {summary.failed > 0 && `, ${summary.failed} failed`}
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left">Document</th>
              <th className="px-3 py-2 text-left w-24">Result</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((r) => (
              <tr key={r.fileId}>
                <td className="px-3 py-2 font-medium text-gray-900">{r.title}</td>
                <td className="px-3 py-2">
                  {r.success ? (
                    <span className="text-green-600 font-medium">Created</span>
                  ) : (
                    <span className="text-red-500 font-medium">Failed</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.success ? (
                    <a
                      href={`/dashboard/articles/${r.articleId}/edit`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit article
                    </a>
                  ) : (
                    <span className="text-xs text-red-400">{r.error}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="ghost" onClick={reset}>
        Import Another Folder
      </Button>
    </div>
  );
}
