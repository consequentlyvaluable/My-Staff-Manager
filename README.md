# React + Vite

This project now persists booking data in [Supabase](https://supabase.com/). To run the app locally you will need a Supabase project with a `records` table that includes at least the following columns:

- `id` – `uuid` primary key with a default value of `gen_random_uuid()`
- `name` – `text`
- `type` – `text`
- `start` – `date`
- `end` – `date`

Create a `.env` file based on `.env.example` and populate the Supabase credentials:

```bash
cp .env.example .env
```

The provided `.env.example` file includes the hosted project that backs the demo:

```
VITE_SUPABASE_URL=https://qbjsccnnkwbrytywvruw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianNjY25ua3dicnl0eXd2cnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI5OTMsImV4cCI6MjA3NjI3ODk5M30.J4qLO8w4kkO1V2B0PibVhWuOBROxsUzLcCUPMhvwFXU
```

If you would prefer to use your own Supabase project, replace the values in your `.env` file with your project's REST URL and anon key.

When the environment variables are present the app will read, create, update, and delete bookings through Supabase's REST API. If the variables are missing the UI will indicate that Supabase is not configured.
