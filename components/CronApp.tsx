'use client';

import { useCallback, useEffect, useState } from 'react';

type Explained = {
  expression: string;
  isValid: boolean;
  format: string;
  description: string;
  nextRuns: string[];
  frequency?: { type?: string; interval?: string } | null; // paid plans
};
type ApiError = { error: string; code?: string };

const PRESETS = [
  ['0 9 * * 1-5', 'Weekdays at 9'],
  ['*/15 * * * *', 'Every 15 min'],
  ['0 0 * * 0', 'Sundays at midnight'],
  ['30 2 1 * *', 'Monthly, 2:30'],
  ['0 */6 * * *', 'Every 6 hours']
] as const;

const SLOTS5 = ['minute', 'hour', 'day', 'month', 'weekday'];
const SLOTS6 = ['second', ...SLOTS5];

function relative(iso: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours} h`;
  return `in ${Math.round(hours / 24)} days`;
}

function utc(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CronApp() {
  const [input, setInput] = useState('0 9 * * 1-5');
  const [data, setData] = useState<Explained | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const explain = useCallback(async (expression: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/explain?expression=${encodeURIComponent(expression)}`);
      const body = await res.json();
      if (!res.ok) throw body;
      setData(body);
    } catch (e) {
      setData(null);
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    // ?expression=... opens on that expression, so links and the showcase can preload one.
    const start = new URLSearchParams(window.location.search).get('expression') || '0 9 * * 1-5';
    setInput(start);
    explain(start);
  }, [explain]);

  if (error?.code === 'missing_key') {
    return (
      <main className="wrap">
        <section className="panel missing">
          <h1>Add your API key</h1>
          <p>
            Get a free APIVerve key at{' '}
            <a href="https://dashboard.apiverve.com/signup?api=cronparser" target="_blank" rel="noreferrer">
              dashboard.apiverve.com
            </a>
            , set <code>APIVERVE_API_KEY</code> in <code>.env</code> or your Vercel project, then reload.
          </p>
        </section>
      </main>
    );
  }

  const fields = input.trim().split(/\s+/);
  const slots = fields.length === 6 ? SLOTS6 : SLOTS5;

  return (
    <main className="wrap">
      <header className="head">
        <span className="logo">⏱</span>
        <div>
          <h1>Cron Explainer</h1>
          <p>Read any cron schedule in plain English, and see when it runs next.</p>
        </div>
      </header>

      <section className="panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            explain(input);
          }}
          className="entry"
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} aria-label="Cron expression" />
          <button disabled={busy || !input.trim()}>{busy ? '…' : 'Explain'}</button>
        </form>

        <div className="slots" aria-hidden>
          {slots.map((s, i) => (
            <div key={s} className="slot">
              <code>{fields[i] ?? '·'}</code>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="presets">
          {PRESETS.map(([expr, label]) => (
            <button
              key={expr}
              onClick={() => {
                setInput(expr);
                explain(expr);
              }}
              className={expr === data?.expression ? 'on' : ''}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="err">{error.error}</p>}

      {data && (
        <div className="cols">
          <section className="panel says">
            <span className="kicker">In plain English</span>
            <p className="sentence">{data.description}</p>
            <div className="meta">
              <span>{data.format}</span>
              {data.frequency?.type && <span>{data.frequency.type}</span>}
            </div>
          </section>

          <section className="panel">
            <span className="kicker">Next runs (UTC)</span>
            <ol className="runs">
              {data.nextRuns.map((r, i) => (
                <li key={r}>
                  <span className="n">{i + 1}</span>
                  <span className="when">{utc(r)}</span>
                  <span className="rel">{relative(r)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      <footer className="foot">
        Built with the <a href="https://apiverve.com/marketplace/cronparser">Cron Parser</a> API from APIVerve.
      </footer>
    </main>
  );
}
