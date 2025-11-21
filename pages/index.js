// pages/index.js
import useSWR from 'swr';
import { useState, useMemo } from 'react';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function Dashboard() {
  const { data, mutate, error } = useSWR('/api/links', fetcher, { revalidateOnFocus: false });
  const [target, setTarget] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', text }
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';

  // Basic URL validation
  const isValidURL = (str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Clear notices after a short delay (animated)
  function pushNotice(type, text, ttl = 3000) {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), ttl);
  }

  async function handleAdd(e) {
    e.preventDefault();

    if (!isValidURL(target)) return pushNotice('error', 'Please enter a valid URL');

    if (code && !/^[A-Za-z0-9]{6,8}$/.test(code)) {
      return pushNotice('error', 'Custom code must be 6–8 alphanumeric characters');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: target, code: code || undefined })
      });

      if (res.status === 201 || res.status === 200) {
        setTarget('');
        setCode('');
        mutate(); // refresh
        pushNotice('success', 'Short link created');
      } else {
        const err = await res.json().catch(() => ({}));
        pushNotice('error', err.error || 'Failed to create link');
      }
    } catch (err) {
      pushNotice('error', 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(c) {
    if (!confirm('Delete this link?')) return;
    try {
      const res = await fetch('/api/links/' + c, { method: 'DELETE' });
      if (res.status === 204 || res.status === 200) {
        mutate();
        pushNotice('success', 'Link deleted');
      } else {
        pushNotice('error', 'Delete failed');
      }
    } catch {
      pushNotice('error', 'Network error');
    }
  }

  const list = useMemo(() => data || [], [data]);

  return (
    <>
      <div className="wrap">
        <header className="header">
          <div>
            <h1>TinyLink</h1>
            <p className="muted">Minimal URL shortener — Dashboard</p>
          </div>
          <nav>
            <a href="/api/healthz" className="link muted">Health</a>
          </nav>
        </header>

        <main className="container">
          <section className="card create-card">
            <form onSubmit={handleAdd} className="form-row" aria-label="Create short link">
              <div className="inputs">
                <input
                  className="input primary-input"
                  placeholder="https://example.com/very/long/url"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  aria-label="Target URL"
                  required
                />
                <input
                  className="input"
                  placeholder="custom code (optional, 6-8 alnum)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  aria-label="Custom code"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
            <p className="hint">Custom code must be 6–8 alphanumeric characters. Leave empty to auto-generate.</p>
          </section>

          <section className="card list-card">
            <h3 style={{ marginTop: 0 }}>Links</h3>

            {error && <div className="empty">Failed to load links.</div>}

            {!data && (
              <div className="shimmer-wrap" aria-hidden>
                <div className="shimmer-row" />
                <div className="shimmer-row" />
                <div className="shimmer-row" />
              </div>
            )}

            {data && list.length === 0 && <div className="empty">No links yet. Create your first short link above.</div>}

            {data && list.length > 0 && (
              <div className="table-wrap" role="table" aria-label="Links table">
                <div className="table-head">
                  <div>Code</div>
                  <div>Target URL</div>
                  <div>Clicks</div>
                  <div>Last clicked</div>
                  <div>Actions</div>
                </div>

                <div className="table-body">
                  {list.map((item, i) => (
                    <div
                      role="row"
                      className="table-row"
                      key={item.code}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div role="cell">
                        <a href={`${base}/${item.code}`} target="_blank" rel="noreferrer" className="code-link">
                          {item.code}
                        </a>
                      </div>

                      <div role="cell" className="target-cell" title={item.target_url}>
                        {item.target_url}
                      </div>

                      <div role="cell" className="mono">{item.clicks}</div>

                      <div role="cell" className="muted mono">
                        {item.last_clicked ? new Date(item.last_clicked).toLocaleString() : '-'}
                      </div>

                      <div role="cell" className="actions">
                        <button
                          className="icon-btn"
                          title="Copy short URL"
                          onClick={() => {
                            navigator.clipboard?.writeText((base || window.location.origin) + '/' + item.code);
                            pushNotice('success', 'Copied to clipboard', 1500);
                          }}
                        >
                          Copy
                        </button>

                        <a href={`/code/${item.code}`} className="link small" style={{ marginLeft: 8 }}>
                          Stats
                        </a>

                        <button
                          className="icon-btn danger"
                          style={{ marginLeft: 8 }}
                      
                          onClick={() => handleDelete(item.code)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Notices */}
      <div className={`notice ${notice ? 'visible' : ''} ${notice?.type || ''}`} role="status" aria-live="polite">
        {notice?.text}
      </div>

      {/* Styles */}
      <style jsx>{`
        :root {
          --bg: #f5f7fb;
          --card: #fff;
          --muted: #6b7280;
          --accent: #2563eb;
          --danger: #dc2626;
          --glass: rgba(255,255,255,0.6);
        }
 
        /* Page layout */
        .wrap {
          min-height: 100vh;
          background: var(--bg);
          padding: 24px 20px;
          animation: fadeIn 360ms ease both;
        }

        .header {
          max-width: 1000px;
          margin: 0 auto 12px;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        h1 { margin:0; font-size: 24px; color : blue; }
        .muted { color: orange; font-size: 20px; }
        .link muted { color: orange; font-size: 20px; }
        .container {
          max-width: 1000px;
          margin: 12px auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .card {
          background: violet;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 6px 18px rgba(20,20,40,0.04);
          transition: transform 200ms ease, box-shadow 200ms ease;
        }

        .card:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(20,20,40,0.06); }

        .create-card .form-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .inputs {
          display:flex;
          gap:8px;
          flex:1;
        }

        .input {
          border: 1px solid #e6e9ee;
          padding: 10px 12px;
          border-radius: 8px;
          outline: none;
          transition: box-shadow 180ms ease, transform 120ms ease, border-color 120ms ease;
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,250,0.9));
        }

        .input:focus {
          box-shadow: 0 6px 20px rgba(37,99,235,0.12);
          border-color: rgba(37,99,235,0.9);
          transform: translateY(-1px);
        }

        .primary-input { flex: 1; }

        .hint { margin-top: 8px; color: var(--muted); font-size: 13px; }

        .btn, .btn:disabled, button { font-family: inherit; }

        .btn.primary, .btn, .icon-btn {
          background: white;
          font-size: 20px;
          color: blue;
          border: none;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease;
        }

        .btn.primary:hover:not(:disabled),
        .icon-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 20px rgba(37,99,235,0.12); }

        .btn.primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .icon-btn { background: black; padding: 6px 10px; border-radius: 8px; font-size: 14px; color:yellow; }
        .icon-btn.danger { background: var(--danger); color:red;font-size:14px;  }

        .link { color: darkgreen; text-decoration: none; }
        .small { font-size: 18px; }

        /* Table */
        .table-wrap { margin-top: 12px; overflow: hidden; border-radius: 10px; border: 1px solid #eef1f6; }
        .table-head {
          display:grid;
          grid-template-columns: 120px 1fr 80px 160px 160px;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(180deg, rgba(250,250,250,0.7), rgba(245,245,245,0.7));
          font-weight:600;
          color:#374151;
        }

        .table-body { display:flex; flex-direction:column; font-size:18px;}

        .table-row {
          color: green;
          font-size: 18px;
          display:grid;
          grid-template-columns: 120px 1fr 80px 160px 160px;
          gap: 12px;
          padding: 12px;
          border-top: 1px solid #f3f5f8;
          align-items:center;
          background: lightblue;
          transform-origin: left top;
          opacity: 10;
          transform: translateY(8px);
          animation: slideUpFade 320ms cubic-bezier(.2,.9,.3,1) forwards;
        }

        .table-row:nth-child(odd) { background: linear-gradient(180deg, #fff, #fbfcfd); }

        .code-link { font-weight:600; color: #0f172a; text-decoration: none; }

        .target-cell { color: #111827; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace; font-size: 18px; color: #111827; }

        .actions { display:flex; align-items:center; justify-content:flex-end; }

        .empty { color: var(--muted); padding: 18px; text-align:center; }

        /* Shimmer */
        .shimmer-wrap { display:flex; flex-direction:column; gap:10px; padding:6px 0; }
        .shimmer-row { height: 56px; border-radius: 8px; background: linear-gradient(90deg, #f5f7fb 0%, #eef2ff 40%, #f5f7fb 80%); background-size: 200% 100%; animation: shimmer 1200ms linear infinite; }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Notice */
        .notice {
          position: fixed;
          right: 20px;
          top: 20px;
          padding: 12px 16px;
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(15,23,42,0.12);
          transform: translateY(-6px) scale(0.98);
          opacity: 0;
          pointer-events: none;
          transition: transform 220ms cubic-bezier(.2,.9,.3,1), opacity 220ms ease;
          z-index: 80;
          font-weight: 600;
        }
        .notice.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
        .notice.success { background: linear-gradient(180deg, #ecfdf5, #dcfce7); color: #065f46; }
        .notice.error { background: linear-gradient(180deg, #fff1f2, #fee2e2); color: #991b1b; }

        /* Animations */
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive */
        @media (max-width: 860px) {
          .table-head, .table-row { grid-template-columns: 100px 1fr 64px 140px 120px; }
        }

        @media (max-width: 640px) {
          .container { padding: 8px; }
          .table-head { display:none; }
          .table-row {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto;
            gap: 6px;
            padding: 10px;
          }
          .target-cell { white-space: normal; overflow: visible; }
          .actions { justify-content: flex-start; gap: 8px; }
        }
      `}</style>
    </>
  );
}
