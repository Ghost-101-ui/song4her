import type { ReactNode } from 'react';
// Song4Her 🦋 — Admin Protected Layout (Auth Guard + Shell)
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '../AdminShell';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';

async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.map((c: { name: string; value: string }) => `${c.name}=${c.value}`).join('; ');

    const res = await fetch(`${API_URL}/api/auth/session`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
