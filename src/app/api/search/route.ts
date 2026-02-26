import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/search";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");

  if (!q.trim()) {
    return NextResponse.json({ data: [], total: 0, page, perPage, totalPages: 0 });
  }

  const { articles, total } = await searchArticles(q, page, perPage);
  return NextResponse.json({
    data: articles,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}
