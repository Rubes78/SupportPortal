import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import { CommentThread } from "@/components/comments/CommentThread";
import { FeedbackWidget } from "./FeedbackWidget";
import type { Metadata } from "next";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
  });
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt || undefined,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!article) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/articles" className="hover:text-gray-700">Articles</Link>
        {article.category && (
          <>
            <span>/</span>
            <Link href={`/categories/${article.category.slug}`} className="hover:text-gray-700">
              {article.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{article.title}</span>
      </nav>

      {/* Article header */}
      <header className="mb-8">
        {article.category && (
          <Link
            href={`/categories/${article.category.slug}`}
            className="text-xs font-medium text-blue-600 uppercase tracking-wide"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="mt-1 text-3xl font-bold text-gray-900 leading-tight">{article.title}</h1>
        {article.excerpt && (
          <p className="mt-3 text-lg text-gray-600">{article.excerpt}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span>By {article.author.name || article.author.email}</span>
          {article.publishedAt && (
            <>
              <span>·</span>
              <time dateTime={article.publishedAt.toISOString()}>
                {format(new Date(article.publishedAt), "MMMM d, yyyy")}
              </time>
            </>
          )}
        </div>
        {article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-10">
        <ArticleRenderer content={article.content} />
      </div>

      {/* Helpful feedback */}
      <FeedbackWidget articleId={article.id} />

      {/* Comments */}
      <CommentThread articleId={article.id} />
    </div>
  );
}
