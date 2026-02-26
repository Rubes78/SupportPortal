import Link from "next/link";
import { format } from "date-fns";

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    publishedAt?: Date | null;
    author: { id?: string; name: string | null; email: string };
    category?: { name: string; slug: string } | null;
    tags: { tag: { id: string; name: string; slug: string } }[];
    _count?: { comments: number };
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {article.category && (
        <Link
          href={`/categories/${article.category.slug}`}
          className="text-xs font-medium text-blue-600 uppercase tracking-wide hover:underline"
        >
          {article.category.name}
        </Link>
      )}
      <h2 className="mt-1 text-lg font-semibold text-gray-900 hover:text-blue-600 leading-snug">
        <Link href={`/articles/${article.slug}`}>{article.title}</Link>
      </h2>
      {article.excerpt && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span>{article.author.name || article.author.email}</span>
        {article.publishedAt && (
          <>
            <span>·</span>
            <time dateTime={new Date(article.publishedAt).toISOString()}>
              {format(new Date(article.publishedAt), "MMM d, yyyy")}
            </time>
          </>
        )}
        {article._count && (
          <>
            <span>·</span>
            <span>{article._count.comments} comments</span>
          </>
        )}
      </div>
      {article.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {article.tags.map(({ tag }) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
