import { SignIn } from '@clerk/nextjs';

// Renders Clerk's hosted SignIn UI. Lives outside the (app) route group so it
// is not shadowed by the SPA catch-all at app/(app)/[[...slug]].
export default function Page() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <SignIn />
    </div>
  );
}
