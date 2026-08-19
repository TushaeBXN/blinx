/**
 * Auth helpers for API routes.
 *
 * requireAuth()  — get the session userId or return a 401 Response.
 * isAdmin()      — true if the user is the platform admin (set ADMIN_EMAIL in .env.local).
 * adminFilter()  — returns a Prisma userId filter: {} for admin, { userId } for users.
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "tushaethomas@icloud.com";

export interface AuthResult {
  userId: string;
  email: string;
  admin: boolean;
}

/**
 * Call at the top of every API route handler.
 * Returns { userId, email, admin } or a ready-to-return 401 NextResponse.
 *
 * Usage:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId, admin } = auth;
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const email = session.user.email ?? "";
  return { userId, email, admin: email === ADMIN_EMAIL };
}

/**
 * Returns a Prisma `where` fragment that scopes records to the user.
 * Admins see everything (empty filter), regular users see only their own rows.
 *
 * Usage:
 *   const where = adminFilter(userId, admin);
 *   const rows = await prisma.someTable.findMany({ where });
 */
export function adminFilter(
  userId: string,
  admin: boolean,
): { userId: string } | Record<string, never> {
  return admin ? {} : { userId };
}

/**
 * For tables where userId is nullable (legacy rows without an owner),
 * admins see everything; users see their own rows plus un-owned system rows.
 */
export function userOrSystemFilter(
  userId: string,
  admin: boolean,
): { OR: ({ userId: string } | { userId: null })[] } | Record<string, never> {
  if (admin) return {};
  return { OR: [{ userId }, { userId: null }] };
}
