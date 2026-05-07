/*
 * Agentik Design — minimalist full-hero landing.
 *
 * Static React component rendered by Astro to plain HTML at build time
 * (renderToStaticMarkup in app/pages/index.astro). No client runtime.
 *
 * One headline, one subhead, one primary CTA. Tokens come from globals.css.
 */

const STUDIO_URL = 'https://agentik-design.vercel.app';
const REPO_URL = 'https://github.com/nexu-io/open-design';

const ext = { target: '_blank', rel: 'noreferrer noopener' } as const;

const arrowOut = (
  <svg
    viewBox='0 0 24 24'
    width='14'
    height='14'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M5 19L19 5M19 5H8M19 5v11' />
  </svg>
);

const styles = `
  .ad-hero {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 48px 24px;
    background: var(--paper);
    color: var(--ink);
  }
  .ad-stack {
    max-width: 720px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    animation: ad-fade 700ms ease-out both;
  }
  .ad-badge {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-mute);
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
  }
  .ad-headline {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(40px, 7vw, 84px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--ink);
  }
  .ad-headline em {
    font-style: italic;
    color: var(--coral);
  }
  .ad-sub {
    font-family: var(--body);
    font-size: clamp(15px, 1.4vw, 18px);
    line-height: 1.55;
    color: var(--ink-mute);
    max-width: 540px;
  }
  .ad-cta-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 4px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .ad-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: var(--ink);
    color: var(--paper);
    border-radius: 999px;
    font-family: var(--sans);
    font-weight: 600;
    font-size: 15px;
    letter-spacing: -0.005em;
    text-decoration: none;
    transition: transform 200ms ease, background 200ms ease;
  }
  .ad-cta:hover { background: var(--coral); transform: translateY(-1px); }
  .ad-link {
    font-family: var(--sans);
    font-size: 14px;
    color: var(--ink-mute);
    text-decoration: none;
    border-bottom: 1px solid var(--line);
    padding-bottom: 2px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 200ms ease;
  }
  .ad-link:hover { color: var(--ink); }
  @keyframes ad-fade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ad-stack { animation: none; }
  }
`;

export default function Page() {
  return (
    <main className='ad-hero'>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className='ad-stack'>
        <span className='ad-badge'>Agentik Design</span>
        <h1 className='ad-headline'>
          Design at the <em>speed</em> of thought.
        </h1>
        <p className='ad-sub'>
          Your coding agent, turned into a design engine. Open-source, local-first,
          and ready when you are.
        </p>
        <div className='ad-cta-row'>
          <a className='ad-cta' href={STUDIO_URL} {...ext}>
            Open the studio {arrowOut}
          </a>
          <a className='ad-link' href={REPO_URL} {...ext}>
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
