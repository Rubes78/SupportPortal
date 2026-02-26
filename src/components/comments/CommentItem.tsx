"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { CommentDTO } from "@/types";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  comment: CommentDTO;
  onRefresh: () => void;
}

export function CommentItem({ comment, onRefresh }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);

  const authorLabel = comment.author?.name || comment.authorName || "Anonymous";

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
          {authorLabel[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{authorLabel}</span>
            <span className="text-gray-400">·</span>
            <time className="text-gray-400" dateTime={comment.createdAt.toString()}>
              {format(new Date(comment.createdAt), "MMM d, yyyy")}
            </time>
          </div>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          <button
            onClick={() => setShowReply(!showReply)}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            {showReply ? "Cancel" : "Reply"}
          </button>

          {showReply && (
            <div className="mt-3">
              <CommentForm
                articleId={comment.articleId}
                parentId={comment.id}
                onSuccess={() => {
                  setShowReply(false);
                  onRefresh();
                }}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} onRefresh={onRefresh} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
