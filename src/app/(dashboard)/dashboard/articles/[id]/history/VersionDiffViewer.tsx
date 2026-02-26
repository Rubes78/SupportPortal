"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface VersionDiffViewerProps {
  articleId: string;
  versionId: string;
  versionNumber: number;
  isLatest: boolean;
}

export function VersionDiffViewer({
  articleId,
  versionId,
  versionNumber,
  isLatest,
}: VersionDiffViewerProps) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (!confirm(`Restore version ${versionNumber}? This creates a new version with the old content.`)) return;
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Restored to version ${versionNumber}`);
      router.refresh();
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLatest) return null;

  return (
    <div className="mt-2">
      <button
        onClick={handleRestore}
        disabled={isRestoring}
        className="text-xs text-orange-600 hover:text-orange-800 disabled:opacity-50"
      >
        {isRestoring ? "Restoring..." : "Restore this version"}
      </button>
    </div>
  );
}
