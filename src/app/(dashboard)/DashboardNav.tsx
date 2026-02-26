"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";

interface DashboardNavProps {
  role: string;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/articles", label: "Articles" },
    { href: "/dashboard/articles/new", label: "New Article" },
    { href: "/dashboard/import", label: "Import" },
  ];

  const adminItems = [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/tags", label: "Tags" },
    { href: "/admin/comments", label: "Comments" },
    { href: "/admin/configuration", label: "Configuration" },
  ];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">Dashboard</p>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            "block px-2 py-1.5 rounded text-sm transition-colors",
            isActive(item.href)
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          {item.label}
        </Link>
      ))}

      {role === "ADMIN" && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mt-4 mb-2">Admin</p>
          {adminItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block px-2 py-1.5 rounded text-sm transition-colors",
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </>
      )}

      <div className="pt-4">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="block w-full text-left px-2 py-1.5 rounded text-sm text-gray-500 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
