import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { VersionDiffViewer } from "./VersionDiffViewer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Version History" };

interface PageProps {
  params: { id: string };
}

export default async function HistoryPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) notFound();
  if (session?.user?.role === "EDITOR" && article.authorId !== session.user.id) notFound();

  const versions = await prisma.articleVersion.findMany({
    where: { articleId: params.id },
    include: { author: { select: { name: true, email: true } } },
    orderBy: { versionNumber: "desc" },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/articles/${params.id}/edit`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Edit Article
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Version History</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {versions.length} version{versions.length !== 1 ? "s" : ""} — &ldquo;{article.title}&rdquo;
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Version list */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">
            Versions
          </div>
          <ul className="divide-y divide-gray-100">
            {versions.map((version, index) => (
              <li key={version.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        v{version.versionNumber}
                      </span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {version.changeNote || "No change note"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {version.author.name || version.author.email} ·{" "}
                      {format(new Date(version.createdAt), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <VersionDiffViewer
                  articleId={params.id}
                  versionId={version.id}
                  versionNumber={version.versionNumber}
                  isLatest={index === 0}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Diff panel placeholder */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 text-center py-12">
            Select versions to compare or restore from the list.
          </p>
        </div>
      </div>
    </div>
  );
}
