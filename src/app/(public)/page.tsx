import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { SearchBar } from "@/components/search/SearchBar";

export const revalidate = 60;

export default async function HomePage() {
  const [recentArticles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: { where: { isApproved: true } } } },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
      orderBy: { order: "asc" },
      take: 6,
    }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-blue-100 mb-8 text-lg">
            Search our knowledge base or browse categories below.
          </p>
          <SearchBar placeholder="Search articles..." className="max-w-xl mx-auto" />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <span className="font-medium text-gray-900 group-hover:text-blue-600">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {cat._count.articles}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/categories" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              View all categories →
            </Link>
          </section>
        )}

        {/* Recent Articles */}
        {recentArticles.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Articles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {recentArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            <Link href="/articles" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
              View all articles →
            </Link>
          </section>
        )}

        {recentArticles.length === 0 && categories.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No articles published yet.</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
