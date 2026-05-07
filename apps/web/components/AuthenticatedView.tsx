'use client';
import { useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { api } from '../../../convex/_generated/api';

/**
 * Materializes the Convex `users` row for the currently signed-in Clerk user.
 *
 * Runs once per mount: when Clerk reports signed-in AND `users.current`
 * resolves to `null` (no row yet), it calls `users.upsert` exactly once.
 * Renders nothing — purely a side-effect component, mounted in the root
 * layout so first sign-in always provisions the Convex user.
 */
export function AuthenticatedView() {
  const { isSignedIn } = useAuth();
  const me = useQuery(api.users.current, isSignedIn ? {} : 'skip');
  const upsert = useMutation(api.users.upsert);
  const fired = useRef(false);

  useEffect(() => {
    if (isSignedIn && me === null && !fired.current) {
      fired.current = true;
      upsert({}).catch(console.error);
    }
  }, [isSignedIn, me, upsert]);

  return null;
}
