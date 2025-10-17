# Fortune

Sophisticated finance-inspired onboarding built with React, Vite, and Supabase Auth. The landing experience mirrors the premium look and feel of operators like Revolut while handling secure sign in, sign up (with first and last name), and session-aware routing into a branded dashboard.

## Features

- Supabase email/password authentication with persisted sessions
- Sign-up flow capturing first and last names (stored as Supabase user metadata)
- Responsive, finance-grade UI that adapts gracefully from desktop to mobile
- Dashboard shell with example insights, ready for real data wiring
- Financial account creation and cashflow scheduling UI powered by Supabase tables

## Getting started

1. Install dependencies (already done if you ran `npm install`):

   ```bash
   npm install
   ```

2. Configure Supabase environment variables in an `.env.local` (or `.env`) file at the project root:

   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   Ensure email/password authentication is enabled in the Supabase dashboard. Metadata captured during sign up is stored on the user object as `first_name` and `last_name`.

3. Start the local dev server:

   ```bash
   npm run dev
   ```

   The login surface will appear at `http://localhost:5173`. Authenticated users are routed to the dashboard view automatically.

4. Build for production when you are ready:

   ```bash
   npm run build
   ```

## Database schema

Create the tables below inside your Supabase project before using the account experience:

```sql
create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'savings', 'assets')),
  starting_balance numeric(18,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_account_movements (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.financial_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(18,2) not null,
  repeats_every text not null check (repeats_every in ('none', 'daily', 'weekly', 'fortnite', 'montly', 'yearly')),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.financial_accounts enable row level security;
alter table public.financial_account_movements enable row level security;

create policy "accounts are visible to owners" on public.financial_accounts
  for select using (auth.uid() = user_id);
create policy "accounts can be inserted by owners" on public.financial_accounts
  for insert with check (auth.uid() = user_id);
create policy "accounts deletable by owners" on public.financial_accounts
  for delete using (auth.uid() = user_id);

create policy "movements visible to owners" on public.financial_account_movements
  for select using (auth.uid() = user_id);
create policy "movements insertable by owners" on public.financial_account_movements
  for insert with check (auth.uid() = user_id);
create policy "movements deletable by owners" on public.financial_account_movements
  for delete using (auth.uid() = user_id);
```

The UI creates an account row plus an initial movement matching the starting balance, and lets you append additional movements with any repeat cadence (use `'none'` for one-off cashflows).

If you provisioned the tables before the `'none'` cadence or delete policies were added, run the statements below to update your schema:

```sql
alter table public.financial_account_movements
  drop constraint if exists financial_account_movements_repeats_every_check;

alter table public.financial_account_movements
  add constraint financial_account_movements_repeats_every_check
    check (repeats_every in ('none', 'daily', 'weekly', 'fortnite', 'montly', 'yearly'));

create policy if not exists "accounts deletable by owners" on public.financial_accounts
  for delete using (auth.uid() = user_id);

create policy if not exists "movements deletable by owners" on public.financial_account_movements
  for delete using (auth.uid() = user_id);
```
