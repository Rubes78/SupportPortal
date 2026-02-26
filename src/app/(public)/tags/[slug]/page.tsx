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
  const tag = await prisma.tag.findUnique({ where: { slug: params.slug } });
  return tag ? { title: `#${tag.name}` } : {};
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const tag = await prisma.tag.findUnique({ where: { slug: params.slug } });
  if (!tag) notFound();

  const page = parseInt(searchParams.page || "1");

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", tags: { some: { tagId: tag.id } } },
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
    prisma.article.count({ where: { status: "PUBLISHED", tags: { some: { tagId: tag.id } } } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4 flex gap-2">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span className="text-gray-900">#{tag.name}</span>
      </nav>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">#{tag.name}</h1>
      <p className="text-sm text-gray-500 mb-6">{total} article{total !== 1 ? "s" : ""}</p>

      {articles.length === 0 ? (
        <p className="text-gray-500">No articles with this tag yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination page={page} totalPages={totalPages} baseUrl={`/tags/${params.slug}`} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
