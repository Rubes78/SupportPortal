import { prisma } from "./prisma";

/**
 * Sanitize user input for use in PostgreSQL tsquery
 * Strips special tsquery characters and builds a prefix-match query
 */
export function buildTsQuery(input: string): string {
  // Remove special tsquery characters
  const sanitized = input.replace(/[&|!():*\\'"<>@]/g, " ");
  // Split into tokens and filter empties
  const tokens = sanitized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return "";
  // Join with AND, append :* for prefix matching
  return tokens.map((t) => `${t}:*`).join(" & ");
}

export async function searchArticles(query: string, page = 1, perPage = 10) {
  const tsQuery = buildTsQuery(query);
  if (!tsQuery) return { articles: [], total: 0 };

  const offset = (page - 1) * perPage;

  const [articles, countResult] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        slug: string;
        excerpt: string | null;
        publishedAt: Date | null;
        rank: number;
        headline: string;
        authorName: string | null;
        authorEmail: string;
      }>
    >`
      SELECT
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a."publishedAt",
        ts_rank(a."searchVector", to_tsquery('english', ${tsQuery})) AS rank,
        ts_headline('english', a.content, to_tsquery('english', ${tsQuery}),
          'MaxWords=50, MinWords=20, ShortWord=3, HighlightAll=false, MaxFragments=3, FragmentDelimiter=" ... "'
        ) AS headline,
        u.name AS "authorName",
        u.email AS "authorEmail"
      FROM articles a
      JOIN users u ON a."authorId" = u.id
      WHERE
        a.status = 'PUBLISHED'
        AND a."searchVector" @@ to_tsquery('english', ${tsQuery})
      ORDER BY rank DESC
      LIMIT ${perPage}
      OFFSET ${offset}
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM articles a
      WHERE
        a.status = 'PUBLISHED'
        AND a."searchVector" @@ to_tsquery('english', ${tsQuery})
    `,
  ]);

  return {
    articles,
    total: Number(countResult[0]?.count ?? 0),
  };
}
