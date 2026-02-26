import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";
import type { Metadata } from "next";

const PER_PAGE = 10;

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } });
  return cat ? { title: cat.name } : {};
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const page = parseInt(searchParams.page || "1");

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { categoryId: category.id, status: "PUBLISHED" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: { where: { isApproved: true } } } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.article.count({ where: { categoryId: category.id, status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4 flex gap-2">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-gray-700">Categories</Link>
        <span>/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{category.name}</h1>
      <p className="text-sm text-gray-500 mb-6">{total} article{total !== 1 ? "s" : ""}</p>

      {articles.length === 0 ? (
        <p className="text-gray-500">No articles in this category yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination page={page} totalPages={totalPages} baseUrl={`/categories/${params.slug}`} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
