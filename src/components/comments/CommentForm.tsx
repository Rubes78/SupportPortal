"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

interface CommentFormProps {
  articleId: string;
  parentId?: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function CommentForm({ articleId, parentId, onSuccess, onCancel }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          articleId,
          parentId: parentId || null,
          authorName: session ? undefined : authorName,
          authorEmail: session ? undefined : authorEmail,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit comment");

      toast.success("Comment submitted! It will appear after approval.");
      setContent("");
      setAuthorName("");
      setAuthorEmail("");
      onSuccess();
    } catch {
      toast.error("Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!session && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Your email (not published)"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
          />
        </div>
      )}
      <Textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        required
      />
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting} size="sm">
          Post Comment
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
