# Project Databases — Setup Guide

This repository uses both a hosted Supabase Postgres database and one or more local PostgreSQL databases. Follow the steps below to provision each database and load the required schema before starting any services.

Note: Replace any example credentials with your own. Check `.env` (root) and `backend/events/.env` for current values you may want to change.

## 1) Supabase (Events, Categories, Interests, Feedback)

Used by the Events service at `backend/events` to store events, categories, user interests, photos, and feedback.

- Config file: `backend/events/.env:1`
- Client: `backend/events/db.js:1`
- API entry: `backend/events/index.js:1`

Environment variables required (in `backend/events/.env` or root `.env`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (service role key, server-side only)

If you are using the provided Supabase project in `.env`, you can skip schema creation. If you are creating a fresh Supabase project, create the following tables with SQL (SQL Editor → New query):

```sql
-- events and photos
create table if not exists events (
  event_id bigint generated always as identity primary key,
  event_title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  interested_count int default 0
);

create table if not exists event_photos (
  id bigserial primary key,
  event_id bigint not null references events(event_id) on delete cascade,
  photo_url text not null
);

-- taxonomy
create table if not exists categories (
  category_id bigint generated always as identity primary key,
  category_name text not null unique
);

create table if not exists event_categories (
  event_id bigint not null references events(event_id) on delete cascade,
  category_id bigint not null references categories(category_id) on delete cascade,
  primary key (event_id, category_id)
);

-- user interests (anonymous userId cookie)
create table if not exists interested_category (
  user_id uuid not null,
  category_id bigint not null references categories(category_id) on delete cascade,
  primary key (user_id, category_id)
);

-- per-event interest toggle (optional aggregate source)
create table if not exists interested_events (
  user_id uuid not null,
  event_id bigint not null references events(event_id) on delete cascade,
  primary key (user_id, event_id)
);

-- feedback stored as JSON in text_content
create table if not exists feedback (
  feedback_id uuid primary key,
  event_id bigint not null references events(event_id) on delete cascade,
  text_content text not null,
  created_at timestamptz default now()
);
```

Row Level Security (RLS): If you enable RLS, create policies that allow the Events service (using the service role key) to read/write these tables.

Quick check:

- Start the events service and hit `GET /` on its port; the handler runs a sample `select` on `events` to verify connectivity. See `backend/events/index.js:1`.

## 2) Heatmap Database (local PostgreSQL)

Used by the heatmap backend at `backend/heatmap/backend/exhibition-map-backend` to cache current building status and capacities.

- Pool config: `backend/heatmap/backend/exhibition-map-backend/heatmap_db.js:1`
- API route using DB: `backend/heatmap/backend/exhibition-map-backend/routes/heatmap.js:1`
- Schema and seed SQL: `backend/heatmap/database/aa.sql:1`

Steps:

1. Ensure PostgreSQL is installed and running locally (default port `5432`).
2. Create DB and schema by running the provided SQL file:

   - Using psql:
     `psql -U postgres -h localhost -p 5432 -f backend/heatmap/database/aa.sql`

   - Or via pgAdmin: open `aa.sql` and run it.

3. Update credentials in `backend/heatmap/backend/exhibition-map-backend/heatmap_db.js:1` to match your local Postgres user/password if needed.

This script creates the `heatmap_db` database, required tables (`buildings`, `current_status`, and related tables), and seeds initial data.

## 3) Organizer Dashboard Database (local PostgreSQL)

Used by Organizer Dashboard microservices under `backend/Organizer_Dashboard-main/backend/*`.

- Connection env: root `.env:66` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- Pool config: `backend/Organizer_Dashboard-main/backend/db/db.js:1`
- Schema SQL: `backend/Organizer_Dashboard-main/backend/db/script.sql:1`
- Sample data: `backend/Organizer_Dashboard-main/backend/db/insertData.sql:1`

Steps:

1. Create the database and schema:
   `psql -U postgres -h localhost -p 5432 -f backend/Organizer_Dashboard-main/backend/db/script.sql`

2. Seed with example data:
   `psql -U postgres -h localhost -p 5432 -f backend/Organizer_Dashboard-main/backend/db/insertData.sql`

3. Verify/update DB credentials in your root `.env` to match your local Postgres instance.

## 4) Optional: Crowd History Database for `server.js` (local PostgreSQL)

The root `server.js` (API for simulated crowd data) persists data to a local Postgres database (defaults to `peraverse`). If you plan to run this server, create the database and table:

- Pool usage: `server.js:14`

SQL to create the DB and table:

```sql
-- Create database (run once)
-- In psql: CREATE DATABASE peraverse;

-- Then connect to it and create the table
create table if not exists crowd_history (
  id bigserial primary key,
  building_name text not null,
  current_count int not null,
  predicted_count int not null,
  timestamp text not null
);
```

Commands with psql:

- Create DB: `createdb -U postgres -h localhost -p 5432 peraverse` (or `psql -U postgres -c "CREATE DATABASE peraverse;"`)
- Create table: `psql -U postgres -h localhost -p 5432 -d peraverse -c "\i crowd_history.sql"` (or paste the SQL above into psql)

Update the following in `.env` if your local settings differ:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## Environment Files to Review

- Root: `.env:1` — ports, Supabase, and local Postgres connection for dashboard and optional `server.js`.
- Events: `backend/events/.env:1` — Supabase URL and Service Key for events/feedback API.

## Service Ports (for reference)

See `ecosystem.config.cjs:1` for pm2-managed services and ports. Defaults in `.env`:

- Events service: `3036`
- Heatmap service: `3897`
- Maps service: `3001`
- Main API (optional `server.js`): `5000`

## Quick Start (DB-only)

- Supabase: configure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`; if creating a new project, run the SQL in section 1.
- Heatmap: run `backend/heatmap/database/aa.sql`, update `heatmap_db.js` credentials.
- Organizer Dashboard: run `backend/Organizer_Dashboard-main/backend/db/script.sql` and `insertData.sql`, verify `.env` DB settings.
- Optional `server.js`: create `peraverse` and `crowd_history` as shown above.
