import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/Pagination";
import { DeleteArticleButton } from "./DeleteArticleButton";

const PER_PAGE = 15;

interface PageProps {
  searchParams: { page?: string; status?: string };
}

export default async function ArticlesListPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";
  const page = parseInt(searchParams.page || "1");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (!isAdmin) where.authorId = session?.user?.id;
  if (searchParams.status) where.status = searchParams.status;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        category: true,
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const statusFilters = ["", "DRAFT", "PUBLISHED", "ARCHIVED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <Link
          href="/dashboard/articles/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Article
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {statusFilters.map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/dashboard/articles?status=${s}` : "/dashboard/articles"}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              searchParams.status === s || (!searchParams.status && !s)
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No articles found.</p>
            <Link href="/dashboard/articles/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Create your first article
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Updated</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/articles/${article.id}/edit`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {article.title}
                    </Link>
                    {isAdmin && (
                      <p className="text-xs text-gray-400">{article.author.name || article.author.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {article.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        article.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : article.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {format(new Date(article.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {article.status === "PUBLISHED" && (
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="text-xs text-gray-500 hover:text-blue-600"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/articles/${article.id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/articles/${article.id}/history`}
                        className="text-xs text-gray-500 hover:text-gray-900"
                      >
                        History
                      </Link>
                      <DeleteArticleButton articleId={article.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            page={page}
            totalPages={totalPages}
            baseUrl="/dashboard/articles"
            searchParams={searchParams.status ? { status: searchParams.status } : {}}
          />
        </div>
      )}
    </div>
  );
}
