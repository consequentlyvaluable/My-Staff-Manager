<h1 align="center">Offyse – Staff Manager</h1>

An opinionated React + Tailwind dashboard for scheduling and managing employee activity. Authentication is powered by Supabase and now includes a glam "Forgot password" experience so team members can get back in fast.

## ✨ Features

- Responsive, dark-mode friendly scheduling dashboard
- Role-aware employee context sourced from Supabase
- Gorgeous password reset modal with guided messaging
- CRUD utilities for booking records with optimistic UI states

## 🧱 Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) for the SPA shell
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) Auth + PostgREST for authentication and data

## 🚀 Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create an environment file** (`.env.local`) with your Supabase credentials:

   ```bash
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   The app ships with demo credentials for local previews, but you should override them in production.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

4. **Build for production**

   ```bash
   npm run build
   ```

## 🛠️ Supabase Setup (Auth + Password Reset)

Follow these steps to provision the Supabase side so the "Forgot password" flow works end-to-end.

1. **Create a Supabase project** and note the `Project URL` and `anon` key from *Project Settings → API*.

2. **Enable email/password auth**
   - Navigate to *Authentication → Providers*.
   - Toggle on **Email** and keep "Confirm email" enabled (recommended).

3. **Configure URL settings**
   - Under *Authentication → URL Configuration*, set **Site URL** to your deployed frontend (e.g. `https://offyse.yourdomain.com`).
   - Add the same URL to **Redirect URLs**. The recovery link Supabase emails will return users here with an access token so the app can complete the reset.

4. **Style the password reset email** *(optional but recommended)*
   - In *Authentication → Email Templates*, customise the **Reset password** template with your branding and include the `{{ .SiteURL }}` link token.

5. **Create supporting tables** if you have not already:
   - `employee_profiles` with columns such as `id`, `user_id`, `email`, `employee_label`, and any metadata you surface in the UI.
   - `records` for schedule/booking entries referenced throughout the dashboard.
   - `Duferco Employees` (or your workforce lookup) with `label` + `sort_order`.
   - Enable Row-Level Security and create policies that restrict reads/writes to authenticated users as appropriate for your organisation.

6. **Grant PostgREST access**
   - For each table, grant `select/insert/update/delete` to the `authenticated` role where necessary using SQL or the Supabase UI so the anon key can call them from the browser.

7. **Test the recovery flow**
   - Invite or create a user from *Authentication → Users*.
   - Visit your deployed login page, open **Forgot password**, and submit their email.
   - Confirm the email arrives, click the link, and verify you land back on your app authenticated and prompted to set a new password by the change-password dialog.

Once these steps are complete, the login screen's new modal will call Supabase's `/auth/v1/recover` endpoint and Supabase will handle the magic-link email for you.

## 📄 License

MIT
