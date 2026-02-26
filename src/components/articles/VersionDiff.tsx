"use client";

import { useEffect, useRef } from "react";

interface VersionDiffProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
}

export function VersionDiff({
  oldContent,
  newContent,
  oldLabel = "Previous",
  newLabel = "Current",
}: VersionDiffProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Strip HTML tags for text-level diff
    const stripHtml = (html: string) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    };

    const oldText = stripHtml(oldContent);
    const newText = stripHtml(newContent);

    import("diff").then(({ diffWords }) => {
      const diff = diffWords(oldText, newText);
      if (!containerRef.current) return;

      const html = diff
        .map((part) => {
          if (part.added) {
            return `<ins class="bg-green-100 text-green-800 no-underline px-0.5 rounded">${escapeHtml(part.value)}</ins>`;
          }
          if (part.removed) {
            return `<del class="bg-red-100 text-red-800 line-through px-0.5 rounded">${escapeHtml(part.value)}</del>`;
          }
          return escapeHtml(part.value);
        })
        .join("");

      containerRef.current.innerHTML = `
        <div class="flex gap-2 text-xs mb-2">
          <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded">− ${oldLabel}</span>
          <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded">+ ${newLabel}</span>
        </div>
        <div class="text-sm leading-relaxed whitespace-pre-wrap font-mono border rounded p-4 bg-gray-50">${html}</div>
      `;
    });
  }, [oldContent, newContent, oldLabel, newLabel]);

  return <div ref={containerRef} className="space-y-2" />;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
