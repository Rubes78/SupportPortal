"use client";

import { useState, useEffect, useCallback } from "react";
import type { CommentDTO } from "@/types";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";

interface CommentThreadProps {
  articleId: string;
}

export function CommentThread({ articleId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      const data = await res.json();
      setComments(data.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Comments ({comments.length})
      </h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Leave a comment</h3>
        <CommentForm articleId={articleId} onSuccess={fetchComments} />
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onRefresh={fetchComments} />
          ))}
        </div>
      )}
    </div>
  );
}
