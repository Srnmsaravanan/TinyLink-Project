import { query } from '../lib/server-db';

export async function getServerSideProps({ params, res }) {
  const code = params.code;
  // check if exists
  const { rows } = await query('SELECT target_url FROM links WHERE code=$1', [code]);
  if (!rows || rows.length === 0) {
    res.statusCode = 404;
    return { notFound: true };
  }
  const target = rows[0].target_url;
  // increment clicks and last_clicked
  await query('UPDATE links SET clicks = clicks + 1, last_clicked = now() WHERE code=$1', [code]);
  // Perform 302 redirect
  return {
    redirect: {
      destination: target,
      permanent: false
    }
  };
}

export default function RedirectPage() {
  return <div>Redirecting…</div>
}
