import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      _count: { select: { articles: { where: { status: "PUBLISHED" } } } },
      children: {
        include: {
          _count: { select: { articles: { where: { status: "PUBLISHED" } } } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h1>
      {categories.length === 0 ? (
        <p className="text-gray-500">No categories yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <Link
                href={`/categories/${cat.slug}`}
                className="font-semibold text-gray-900 hover:text-blue-600 flex items-center justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {cat._count.articles}
                </span>
              </Link>
              {cat.children.length > 0 && (
                <ul className="mt-2 space-y-1 pl-2">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="text-sm text-gray-600 hover:text-blue-600 flex items-center justify-between"
                      >
                        <span>↳ {child.name}</span>
                        <span className="text-xs text-gray-400">{child._count.articles}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
