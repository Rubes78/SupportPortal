import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireAuth();
  const roles = [Role.VIEWER, Role.EDITOR, Role.ADMIN];
  const userRoleIndex = roles.indexOf(user.role as Role);
  const requiredRoleIndex = roles.indexOf(role);
  if (userRoleIndex < requiredRoleIndex) {
    throw new Error("Forbidden");
  }
  return user;
}

export function isAdmin(role: string) {
  return role === Role.ADMIN;
}

export function isEditor(role: string) {
  return role === Role.EDITOR || role === Role.ADMIN;
}
