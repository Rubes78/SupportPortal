"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="h-64 border rounded-lg bg-gray-50 animate-pulse" /> }
);

interface Category { id: string; name: string; slug: string }
interface Tag { id: string; name: string; slug: string }

interface ArticleFormProps {
  categories: Category[];
  tags: Tag[];
  initialData?: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    status: string;
    categoryId: string | null;
    tags: { tag: { id: string } }[];
    changeNote?: string;
  };
}

export function ArticleForm({ categories, tags, initialData }: ArticleFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [status, setStatus] = useState(initialData?.status || "DRAFT");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags?.map((t) => t.tag.id) || []
  );
  const [changeNote, setChangeNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent, saveStatus?: string) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!content.trim()) { toast.error("Content is required"); return; }

    setIsSaving(true);
    try {
      const payload = {
        title,
        content,
        excerpt: excerpt || null,
        status: saveStatus || status,
        categoryId: categoryId || null,
        tagIds: selectedTags,
        changeNote: changeNote || undefined,
      };

      const url = isEditing ? `/api/articles/${initialData!.id}` : "/api/articles";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to save article");
        return;
      }

      toast.success(isEditing ? "Article updated!" : "Article created!");
      router.push(`/dashboard/articles/${data.id}/edit`);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>
          {isEditing && (
            <Input
              label="Change note (optional)"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Describe what changed in this version"
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Publish</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Button type="submit" isLoading={isSaving} size="sm" className="w-full">
                {isEditing ? "Update Article" : "Save Article"}
              </Button>
              {status !== "PUBLISHED" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  isLoading={isSaving}
                  onClick={(e) => handleSubmit(e as any, "PUBLISHED")}
                >
                  Save & Publish
                </Button>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <Textarea
              label="Excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Short description (optional)"
            />
          </div>

          {/* Category */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
