# React + Vite

This project persists booking data in [Supabase](https://supabase.com/). To run the app locally you will need a Supabase project with a `records` table that includes at least the following columns:

- `id` – `uuid` primary key with a default value of `gen_random_uuid()`
- `name` – `text`
- `type` – `text`
- `start` – `date`
- `end` – `date`

Create a `.env` file based on `.env.example` and populate the Supabase credentials for your project:

```bash
cp .env.example .env
```

Then edit `.env` and provide your Supabase REST API URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

When the environment variables are present the app will read, create, update, and delete bookings through Supabase's REST API. If the variables are missing the UI will indicate that Supabase is not configured.

## Deployment notes

If you deploy the app to Netlify (or another hosting provider), configure the same environment variables in your build settings instead of committing credentials to the repository. Netlify will expose them to the Vite build so the client can talk to Supabase without storing secrets in source control.
