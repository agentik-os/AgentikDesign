'use client';

import dynamic from 'next/dynamic';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

// The product is a fully client-driven SPA — every component reads
// localStorage, window.location, etc. — so we opt out of static-time
// rendering for the entire tree. This keeps `next build --output export`
// from trying to evaluate browser-only code while still emitting a real
// shell HTML the daemon can serve as the SPA fallback.
const App = dynamic(() => import('../../../src/App').then((m) => m.App), {
  ssr: false,
  loading: () => <div className="od-loading-shell">Loading Agentik Design…</div>,
});

// Gate the SPA behind a launch flag so the public deployment can show a
// "Coming Soon" placeholder until the dashboard is ready. Defaults to
// blocked (anything other than the literal string "true" hides the SPA).
const DASHBOARD_ENABLED = process.env.NEXT_PUBLIC_DASHBOARD_ENABLED === 'true';

function ComingSoonScreen() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'var(--bg-app, #F4EFE6)',
        color: 'var(--text-strong, #1a1a1a)',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
          Agentik Design
        </h1>
        <p style={{ fontSize: 16, opacity: 0.75, margin: 0 }}>
          Dashboard coming soon. We&rsquo;re polishing the experience.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
          }}
        >
          <SignedOut>
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button
                type="button"
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: '1px solid var(--border-soft, rgba(0,0,0,0.15))',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

export function ClientApp() {
  if (!DASHBOARD_ENABLED) return <ComingSoonScreen />;
  return <App />;
}
