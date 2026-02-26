import { searchArticles } from "@/lib/search";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { Pagination } from "@/components/ui/Pagination";
import type { Metadata } from "next";

interface PageProps {
  searchParams: { q?: string; page?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return { title: searchParams.q ? `Search: ${searchParams.q}` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1");
  const perPage = 10;

  const { articles, total } = q.trim() ? await searchArticles(q, page, perPage) : { articles: [], total: 0 };
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>
      <SearchBar defaultValue={q} className="mb-6" />

      {q && (
        <p className="text-sm text-gray-500 mb-4">
          {total} result{total !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
        </p>
      )}

      <SearchResults
        results={articles.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          headline: a.headline,
          publishedAt: a.publishedAt,
          rank: a.rank,
        }))}
        query={q}
      />

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination page={page} totalPages={totalPages} baseUrl="/search" searchParams={{ q }} />
        </div>
      )}
    </div>
  );
}
