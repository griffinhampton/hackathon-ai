# Jokester Merch — Next.js + Mux + Stripe + Supabase wireframe

This scaffold provides a minimal Next.js app with a centered three.js canvas and placeholder API routes for Stripe and Mux, plus a Supabase client helper.

Quick start (PowerShell):

```powershell
# install deps
npm install

# run dev
npm run dev
```

Environment variables (create a `.env.local`):

- NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
- NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
- SUPABASE_SERVICE_ROLE_KEY=<service-role-key> (server only)
- STRIPE_SECRET_KEY=<your-stripe-secret>
- MUX_TOKEN_ID=<mux-token-id>
- MUX_TOKEN_SECRET=<mux-token-secret>

Files added:

- `pages/index.js` — homepage with centered three.js canvas component
- `components/ThreeCanvas.js` — three.js scene (wireframe cube) mounted to a canvas
- `pages/api/stripe/checkout.js` — placeholder Stripe checkout API
- `pages/api/mux/upload.js` — placeholder Mux upload API
- `lib/supabase.js` — Supabase client helper

Next steps:

- Replace placeholder API logic with your real keys and flows.
- Add Supabase auth / DB flows as needed.
