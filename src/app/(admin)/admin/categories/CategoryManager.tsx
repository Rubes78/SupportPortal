"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  _count: { articles: number };
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const rootCategories = categories.filter((c) => !c.parentId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parentId || null, order: categories.length }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Category created");
      setName("");
      setParentId("");
      router.refresh();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, count: number) => {
    if (count > 0 && !confirm(`This category has ${count} articles. They will be uncategorized. Continue?`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Create form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-sm text-gray-700 mb-4">Create Category</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Category name"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent (optional)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No parent (top-level)</option>
              {rootCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" isLoading={isCreating} size="sm">
            Create Category
          </Button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">
          All Categories ({categories.length})
        </div>
        {categories.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {cat.parentId ? "↳ " : ""}{cat.name}
                  </p>
                  <p className="text-xs text-gray-400">{cat._count.articles} articles · /{cat.slug}</p>
                </div>
                <button
                  onClick={() => handleDelete(cat.id, cat._count.articles)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
