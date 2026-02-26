// Content is sanitized server-side by lib/sanitize.ts before storage.
// We render trusted HTML directly here.
interface ArticleRendererProps {
  content: string;
}

export function ArticleRenderer({ content }: ArticleRendererProps) {
  return (
    <div
      className="prose prose-sm sm:prose max-w-none
        prose-headings:font-bold
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm
        prose-pre:bg-gray-900 prose-pre:text-gray-100
        prose-blockquote:border-l-blue-400 prose-blockquote:text-gray-600
        prose-img:rounded-lg prose-img:shadow
        prose-table:border prose-th:bg-gray-50"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
