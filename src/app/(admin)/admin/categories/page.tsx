import { prisma } from "@/lib/prisma";
import { CategoryManager } from "./CategoryManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Categories" };

export default async function CategoriesAdminPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
