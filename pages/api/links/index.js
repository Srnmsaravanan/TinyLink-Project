import { query } from '../../../lib/server-db';

// GET all links or POST create a link
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await query('SELECT code, target_url, clicks, last_clicked, created_at FROM links ORDER BY created_at DESC');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { target_url, code } = req.body || {};
    if (!target_url) return res.status(400).json({ error: 'target_url required' });

    // validate URL
    try {
      new URL(target_url);
    } catch (e) {
      return res.status(400).json({ error: 'invalid url' });
    }

    const codeRegex = /^[A-Za-z0-9]{6,8}$/;
    let finalCode = code;
    if (!finalCode) {
      // generate 6-char code
      finalCode = Math.random().toString(36).slice(2,8);
      // make sure it matches pattern (lowercase+numbers ok)
      if (!codeRegex.test(finalCode)) finalCode = finalCode.padEnd(6, '0').slice(0,6);
    } else {
      if (!codeRegex.test(finalCode)) {
        return res.status(400).json({ error: 'code must match [A-Za-z0-9]{6,8}' });
      }
    }

    try {
      await query('INSERT INTO links(code, target_url) VALUES($1,$2)', [finalCode, target_url]);
      return res.status(201).json({ code: finalCode, target_url });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'code already exists' });
      }
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end('Method Not Allowed');
}
