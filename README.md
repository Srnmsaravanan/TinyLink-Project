# TinyLink - URL Shortener (Take-home)

Reference PDF (uploaded by candidate): /mnt/data/Take-Home Assignment_ TinyLink (1) (2).pdf

This repository contains a complete Next.js implementation for the TinyLink take-home assignment.

## Features
- Create short links (optional custom code)
- Redirect `/{code}` with HTTP 302 and click counting
- Delete links
- Dashboard UI (`/`)
- Stats page (`/code/:code`)
- Health endpoint `/api/healthz`
- APIs:
  - `POST /api/links` (409 if code exists)
  - `GET /api/links`
  - `GET /api/links/:code`
  - `DELETE /api/links/:code`

## Local setup
1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and `BASE_URL`.
2. Install deps:
```bash
npm install
```
3. Run database migrations (create table):
```sql
-- schema.sql
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  last_clicked TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```
4. Start dev server:
```bash
npm run dev
```

## Deployment
Recommended: Vercel (Next.js) + Neon (Postgres).
Set environment variable `DATABASE_URL` on Vercel.

## Notes
- Codes follow regex `[A-Za-z0-9]{6,8}`.
- Endpoint and route names follow the autograder spec.

