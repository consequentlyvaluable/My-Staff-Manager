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

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

When the environment variables are present the app will read, create, update, and delete bookings through Supabase's REST API. If the variables are missing the UI will indicate that Supabase is not configured.
