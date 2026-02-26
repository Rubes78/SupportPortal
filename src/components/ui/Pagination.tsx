"use client";

import Link from "next/link";
import { clsx } from "clsx";

interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

export function Pagination({ page, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (p: number) => {
    const params = new URLSearchParams({ ...searchParams, page: String(p) });
    return `${baseUrl}?${params.toString()}`;
  };

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center gap-1">
      <Link
        href={buildUrl(page - 1)}
        className={clsx(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          page === 1
            ? "text-gray-300 cursor-not-allowed pointer-events-none"
            : "text-gray-600 hover:bg-gray-100"
        )}
        aria-disabled={page === 1}
      >
        ← Prev
      </Link>

      {pages[0] > 1 && (
        <>
          <Link href={buildUrl(1)} className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">1</Link>
          {pages[0] > 2 && <span className="px-2 text-gray-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          className={clsx(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            p === page
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {p}
        </Link>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-2 text-gray-400">…</span>}
          <Link href={buildUrl(totalPages)} className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">
            {totalPages}
          </Link>
        </>
      )}

      <Link
        href={buildUrl(page + 1)}
        className={clsx(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          page === totalPages
            ? "text-gray-300 cursor-not-allowed pointer-events-none"
            : "text-gray-600 hover:bg-gray-100"
        )}
        aria-disabled={page === totalPages}
      >
        Next →
      </Link>
    </nav>
  );
}
