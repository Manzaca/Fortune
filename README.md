# Fortune

Sophisticated finance-inspired onboarding built with React, Vite, and Supabase Auth. The landing experience mirrors the premium look and feel of operators like Revolut while handling secure sign in, sign up (with first and last name), and session-aware routing into a branded dashboard.

## Features

- Supabase email/password authentication with persisted sessions
- Sign-up flow capturing first and last names (stored as Supabase user metadata)
- Responsive, finance-grade UI that adapts gracefully from desktop to mobile
- Dashboard shell with example insights, ready for real data wiring

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
