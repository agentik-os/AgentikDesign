import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; status?: string; error?: string; message?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const sp = await searchParams;
  return <SettingsClient toast={sp} />;
}
