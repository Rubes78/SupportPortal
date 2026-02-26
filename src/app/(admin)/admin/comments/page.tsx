import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CommentModerator } from "./CommentModerator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Moderate Comments" };

export default async function CommentsAdminPage() {
  const [pending, approved] = await Promise.all([
    prisma.comment.findMany({
      where: { isApproved: false },
      include: {
        article: { select: { title: true, slug: true } },
        author: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.findMany({
      where: { isApproved: true },
      include: {
        article: { select: { title: true, slug: true } },
        author: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Comments</h1>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{pending.length}</span>
            Pending Approval
          </h2>
          <div className="space-y-2">
            {pending.map((comment) => (
              <div key={comment.id} className="bg-white border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-700">
                        {comment.author?.name || comment.authorName || "Anonymous"}
                      </span>
                      <span>on</span>
                      <a href={`/articles/${comment.article.slug}`} className="text-blue-600 hover:underline truncate">
                        {comment.article.title}
                      </a>
                      <span>·</span>
                      <span>{format(new Date(comment.createdAt), "MMM d, HH:mm")}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <CommentModerator commentId={comment.id} isApproved={false} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Recent Approved ({approved.length})
        </h2>
        <div className="space-y-2">
          {approved.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">
                      {comment.author?.name || comment.authorName || "Anonymous"}
                    </span>
                    <span>on</span>
                    <a href={`/articles/${comment.article.slug}`} className="text-blue-600 hover:underline truncate">
                      {comment.article.title}
                    </a>
                    <span>·</span>
                    <span>{format(new Date(comment.createdAt), "MMM d, HH:mm")}</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">{comment.content}</p>
                </div>
                <CommentModerator commentId={comment.id} isApproved={true} />
              </div>
            </div>
          ))}
          {approved.length === 0 && pending.length === 0 && (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
