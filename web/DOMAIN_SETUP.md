# Domain & hosting notes

## Current status (2026-08-11)

- Firebase Hosting for `precommitment-game` is **disabled** (site returns 404).
- Custom domains `beforeyes.online` and `www.beforeyes.online` were **removed** from Firebase Hosting.
- Firebase **Auth + Firestore** remain active (needed by the app on any host).

## Move to Vercel

1. Deploy the Vite app from `web/` to Vercel (`npm run build`, output `dist`).
2. In Vercel → Project → Domains, add `beforeyes.online` (and `www` if you want).
3. In Hostinger DNS, **remove Firebase records** and use Vercel’s DNS values (usually A/CNAME they show).
4. In Firebase Console → Authentication → Settings → Authorized domains, keep:
   - `beforeyes.online`
   - `www.beforeyes.online`
   - your `*.vercel.app` preview domain  
   (Auth domains for beforeyes were already added earlier.)

## Re-enable Firebase Hosting later (if needed)

```bash
cd web
npm run build
npx firebase-tools@latest deploy --only hosting --project precommitment-game
```
