import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../ArticleForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Article" };

export default async function NewArticlePage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Article</h1>
      <ArticleForm categories={categories} tags={tags} />
    </div>
  );
}
