import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const where = isAdmin ? {} : { authorId: session?.user?.id };

  const [total, published, drafts, totalComments] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.count({ where: { ...where, status: "PUBLISHED" } }),
    prisma.article.count({ where: { ...where, status: "DRAFT" } }),
    isAdmin ? prisma.comment.count({ where: { isApproved: false } }) : Promise.resolve(0),
  ]);

  const recentArticles = await prisma.article.findMany({
    where,
    include: { author: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const stats = [
    { label: "Total Articles", value: total, href: "/dashboard/articles" },
    { label: "Published", value: published, href: "/dashboard/articles?status=PUBLISHED" },
    { label: "Drafts", value: drafts, href: "/dashboard/articles?status=DRAFT" },
    ...(isAdmin ? [{ label: "Pending Comments", value: totalComments, href: "/admin/comments" }] : []),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/dashboard/articles/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Article
        </Link>
        <Link
          href="/dashboard/import"
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
        >
          Import Document
        </Link>
      </div>

      {/* Recent articles */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-sm text-gray-700">Recent Articles</h2>
        </div>
        {recentArticles.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No articles yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentArticles.map((article) => (
              <li key={article.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/articles/${article.id}/edit`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {article.title}
                  </Link>
                  <p className="text-xs text-gray-400">{article.author.name || article.author.email}</p>
                </div>
                <span
                  className={`ml-3 px-2 py-0.5 text-xs rounded-full shrink-0 ${
                    article.status === "PUBLISHED"
                      ? "bg-green-100 text-green-700"
                      : article.status === "DRAFT"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {article.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
