'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

const PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    oauth: false,
    oauthNote: 'OAuth not publicly available — paste your API key.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    oauth: false,
    oauthNote: 'OAuth not publicly available — paste your API key.',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    oauth: true,
    oauthNote: 'Sign in with Google to authorize.',
  },
];

export function SettingsClient({
  toast,
}: {
  toast: { provider?: string; status?: string; error?: string; message?: string };
}) {
  const credentials = useQuery(api.providerCredentials.list);
  const upsert = useMutation(api.providerCredentials.upsert);
  const remove = useMutation(api.providerCredentials.remove);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const connected = (id: string) =>
    credentials?.some((c: { provider: string }) => c.provider === id) ?? false;

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        Connect AI providers to use your own API keys (BYOK).
      </p>

      {toast.status === 'connected' && (
        <div
          style={{
            padding: 12,
            background: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {toast.provider} connected successfully.
        </div>
      )}
      {toast.error && (
        <div
          style={{
            padding: 12,
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {toast.error}: {toast.message ?? 'Use the API key field below.'}
        </div>
      )}

      {PROVIDERS.map((p) => (
        <div
          key={p.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            background: '#fff',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{p.name}</h2>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                background: connected(p.id) ? '#dcfce7' : '#f3f4f6',
                color: connected(p.id) ? '#166534' : '#6b7280',
              }}
            >
              {connected(p.id) ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>{p.oauthNote}</p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {p.oauth && (
              <a
                href={`/api/auth/${p.id}/start`}
                style={{
                  padding: '8px 16px',
                  background: '#111827',
                  color: '#fff',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                Connect via OAuth
              </a>
            )}
            <input
              type='password'
              placeholder={`Or paste ${p.name} API key`}
              value={keys[p.id] ?? ''}
              onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })}
              style={{
                flex: 1,
                minWidth: 220,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            <button
              type='button'
              disabled={busy === p.id || !keys[p.id]}
              onClick={async () => {
                setBusy(p.id);
                try {
                  await upsert({ provider: p.id, accessToken: keys[p.id]! });
                  setKeys({ ...keys, [p.id]: '' });
                } finally {
                  setBusy(null);
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer',
                opacity: busy === p.id || !keys[p.id] ? 0.5 : 1,
              }}
            >
              {busy === p.id ? 'Saving...' : 'Save Key'}
            </button>
            {connected(p.id) && (
              <button
                type='button'
                onClick={async () => {
                  setBusy(p.id);
                  try {
                    await remove({ provider: p.id });
                  } finally {
                    setBusy(null);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#fff',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
