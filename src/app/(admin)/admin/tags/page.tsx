import { prisma } from "@/lib/prisma";
import { TagManager } from "./TagManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Tags" };

export default async function TagsAdminPage() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tags</h1>
      <TagManager tags={tags} />
    </div>
  );
}
