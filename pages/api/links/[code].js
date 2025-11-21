import { query } from '../../../lib/server-db';

export default async function handler(req, res) {
  const { code } = req.query;

  if (req.method === 'GET') {
    const { rows } = await query(
      'SELECT code, target_url, clicks, last_clicked, created_at FROM links WHERE code=$1',
      [code]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'not found' });
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { rowCount } = await query('DELETE FROM links WHERE code=$1', [code]);
    if (rowCount === 0)
      return res.status(404).json({ error: 'not found' });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}
