import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../../ArticleForm";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: "Edit Article" };

export default async function EditArticlePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  });

  if (!article) notFound();
  if (session?.user?.role === "EDITOR" && article.authorId !== session.user.id) notFound();

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 truncate">{article.title}</h1>
        <div className="flex gap-3 shrink-0">
          <Link
            href={`/dashboard/articles/${params.id}/history`}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            History
          </Link>
          {article.status === "PUBLISHED" && (
            <Link
              href={`/articles/${article.slug}`}
              target="_blank"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              View →
            </Link>
          )}
        </div>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
  <ArticleForm categories={categories} tags={tags} initialData={article as any} />
    </div>
  );
}
