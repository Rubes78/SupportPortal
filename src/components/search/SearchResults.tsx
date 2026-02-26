import Link from "next/link";
import { format } from "date-fns";
import type { SearchResult } from "@/types";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No results found for &ldquo;{query}&rdquo;</p>
        <p className="text-gray-400 text-sm mt-2">Try different keywords or browse by category</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <article key={result.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold">
            <Link href={`/articles/${result.slug}`} className="text-blue-600 hover:underline">
              {result.title}
            </Link>
          </h2>
          {result.publishedAt && (
            <p className="text-xs text-gray-400 mt-1">
              {format(new Date(result.publishedAt), "MMMM d, yyyy")}
            </p>
          )}
          <div
            className="mt-2 text-sm text-gray-600 [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded"
            dangerouslySetInnerHTML={{ __html: result.headline }}
          />
        </article>
      ))}
    </div>
  );
}
