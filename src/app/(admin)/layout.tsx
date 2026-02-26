import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/app/(dashboard)/DashboardNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <Link href="/" className="font-semibold text-blue-600 text-sm">
            {process.env.NEXT_PUBLIC_SITE_NAME || "Support Portal"}
          </Link>
        </div>
        <DashboardNav role={(session.user as any).role} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="text-sm text-gray-600">
            Signed in as <strong>{session.user.name || session.user.email}</strong>
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
              {(session.user as any).role}
            </span>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to site
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
