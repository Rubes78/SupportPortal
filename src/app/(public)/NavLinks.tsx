"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export function NavLinks({ session }: { session: Session | null }) {
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
        <Link
          href="/register"
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Register
        </Link>
      </div>
    );
  }

  const isEditor = session.user.role === "EDITOR" || session.user.role === "ADMIN";

  return (
    <div className="flex items-center gap-3">
      {isEditor && (
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          Dashboard
        </Link>
      )}
      {session.user.role === "ADMIN" && (
        <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
          Admin
        </Link>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        Sign out
      </button>
    </div>
  );
}
