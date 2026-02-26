import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NavLinks } from "./NavLinks";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg text-blue-600 hover:text-blue-700">
            {process.env.NEXT_PUBLIC_SITE_NAME || "Support Portal"}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/articles" className="hover:text-gray-900">Articles</Link>
            <Link href="/categories" className="hover:text-gray-900">Categories</Link>
            <Link href="/search" className="hover:text-gray-900">Search</Link>
          </nav>
          <NavLinks session={session} />
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "Support Portal"}
        </div>
      </footer>
    </div>
  );
}
