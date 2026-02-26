"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface CommentModeratorProps {
  commentId: string;
  isApproved: boolean;
}

export function CommentModerator({ commentId, isApproved }: CommentModeratorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Comment approved");
      router.refresh();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment permanently?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Comment deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 shrink-0">
      {!isApproved && (
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-200 hover:bg-red-100 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
