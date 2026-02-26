import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/search/SearchBar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Articles" };

const PER_PAGE = 12;

interface PageProps {
  searchParams: { page?: string; category?: string; tag?: string };
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || "1");
  const categorySlug = searchParams.category;
  const tagSlug = searchParams.tag;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { status: "PUBLISHED" };
  if (categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (cat) where.categoryId = cat.id;
  }
  if (tagSlug) {
    const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
    if (tag) where.tags = { some: { tagId: tag.id } };
  }

  const [articles, total, categories] = await Promise.all([
    prisma.article.findMany({
      where,
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
    prisma.article.count({ where }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-56 shrink-0">
          <div className="mb-4">
            <SearchBar />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Categories</h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="/articles"
                  className={`text-sm block py-1 px-2 rounded hover:bg-gray-50 ${!categorySlug ? "text-blue-600 font-medium" : "text-gray-600"}`}
                >
                  All Articles
                </a>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/articles?category=${cat.slug}`}
                    className={`text-sm block py-1 px-2 rounded hover:bg-gray-50 ${categorySlug === cat.slug ? "text-blue-600 font-medium" : "text-gray-600"}`}
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {categorySlug
                ? categories.find((c) => c.slug === categorySlug)?.name || "Articles"
                : "All Articles"}
            </h1>
            <p className="text-sm text-gray-500">{total} article{total !== 1 ? "s" : ""}</p>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p>No articles found.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination page={page} totalPages={totalPages} baseUrl="/articles" searchParams={categorySlug ? { category: categorySlug } : {}} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
