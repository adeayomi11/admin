# Golden Star FC

## Vercel and Neon setup

1. Your screenshot shows the `neon-fuchsia-clock` database connected to the Vercel project `admin`. In that project's environment settings, verify that `DATABASE_URL` is available and uses the Neon pooled connection string. Make sure it is available in every environment where the site is deployed.
2. In the Neon SQL Editor, run the contents of [`database.sql`](./database.sql) once to create the `players` table.
3. In Vercel project settings, add these environment variables:
   - `ADMIN_USERNAME`: a new admin username.
   - `ADMIN_PASSWORD`: a strong, unique admin password.
   - `SESSION_SECRET`: a randomly generated secret with at least 32 characters.
   Vercel's `DATABASE_URL` is also required. Do not put these secrets in browser code or commit them to the repository.
4. Redeploy after saving the environment variables. Registrations submitted on the site will then be stored in Neon, and an admin who signs in at `/admin.html` can view, add, edit, and delete records.

For local development, use `vercel dev` after adding the same variables to a local `.env.local` file. Do not commit `.env.local`.

The admin session is held in an HTTP-only, signed cookie. Player list and edit endpoints require that session; new player registrations are public by design.
