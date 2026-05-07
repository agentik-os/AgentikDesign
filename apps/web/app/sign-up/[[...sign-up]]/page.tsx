import { SignUp } from '@clerk/nextjs';

// Renders Clerk's hosted SignUp UI. Lives outside the (app) route group so it
// is not shadowed by the SPA catch-all at app/(app)/[[...slug]].
export default function Page() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <SignUp />
    </div>
  );
}
