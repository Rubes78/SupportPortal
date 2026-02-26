"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function DeleteArticleButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Article deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
