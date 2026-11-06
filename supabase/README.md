# Supabase, Brevo, and R2 setup

1. Apply `migrations/202611060001_church_state.sql` to the Supabase project.
2. Copy `.env.example` to `.env` and set the Supabase URL and publishable/secret keys. Keep the secret key server-side; only the publishable key belongs in `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Configure the Supabase Auth site URL as `APP_URL` and allow the invitation redirect `APP_URL/?setup=invite`.
4. Configure a verified Brevo sender and set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`.
5. Create a private R2 bucket and set the R2 variables. Add bucket CORS rules allowing the deployed app origin to use `PUT` with the `Content-Type` header. The app creates short-lived upload and download URLs.

When Supabase has no `church_state` row, the first server start imports the current `data/church-store.json` (if present) and seeds missing role/departments. Review that file and remove demo accounts/data before the first production start. Later saves use a revision check and fail rather than silently overwrite a concurrent update.

The existing application data model is stored as one private JSON document for compatibility with the current API. Keep the state reasonably small; migrate to normalized tables before the church data volume or concurrent write rate grows substantially.
