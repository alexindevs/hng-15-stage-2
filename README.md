# Ego Olisa Enterprises: mobile app (Expo)

Companion app for the Next.js site in `hng-15-stage-1`. It talks to the **same Supabase project** as the site.

## Run it (Expo Go on your phone)

```bash
npm install
cp .env.example .env      # then fill in the three values (same ones as the site's .env.local)
npx expo start            # scan the QR code with Expo Go (phone and laptop on the same Wi-Fi)
```

Restart `npx expo start` (add `-c` to clear cache) after editing `.env`.

| Variable | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | the site's `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the site's `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable/anon key only, never the secret key) |
| `EXPO_PUBLIC_SITE_URL` | deployed site URL (https) for product images and the checkout / booking hand-off |

`EXPO_PUBLIC_SITE_URL` must be reachable from the phone: the deployed https URL, or `http://<laptop-LAN-IP>:3000` while running `npm run dev` in the site repo. `localhost` will not work on a phone. With no Supabase values, login is disabled.

## Supabase setup needed for login

1. **Email login**: Authentication → Providers → Email enabled (optionally turn off "Confirm email" for quick testing).
2. **Google login** (through the site's `/api/auth/google`): the site must be reachable from the phone (`EXPO_PUBLIC_SITE_URL`), Google must be enabled in Supabase as for the website, and Authentication → URL Configuration → Redirect URLs must include `exp://**` (Expo Go) and `egoolisa://**` (APK).
3. **Cart sync**: run the new `cart_items` section at the bottom of `supabase/schema.sql` in the hng-15-stage-1 repo in the SQL editor (idempotent). Signed-in carts are stored via `/api/cart`.

## Build an installable APK

```bash
npm install -g eas-cli
eas login
eas init                                   # creates the EAS project and writes its id into app.json
eas build:configure                        # eas.json already exists; accept defaults if prompted
eas build -p android --profile preview     # preview profile produces an .apk
```

Set the env vars for the cloud build (the local `.env` is not uploaded if it is git-ignored):

```bash
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value "..." --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "..." --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SITE_URL --value "https://..." --visibility plaintext
```

When the build finishes, EAS prints a download URL / QR code for the APK; open it on the phone and install (allow "install unknown apps").

## Features (mirrors the website)

Home (carousel, categories, why us, latest arrivals, how it works, FAQ) · Shop (search, category, price, year, sort) · Vehicle detail with photos and related vehicles · Cart synced to your account · Checkout (card via Paystack, bank transfer, pay on delivery; guest or signed in) · Order status and payment retry · Book a viewing (date/slot, inspection fee options) · Viewing status and fee payment · Account (orders and viewings) · Gallery · About · Contact.

Card payments and viewing-fee payments open Paystack's hosted page in the in-app browser; when you close it the order/booking screen re-verifies the payment with the server.

## API (hng-15-stage-1, `src/app/api`)

All calls go to `EXPO_PUBLIC_SITE_URL/api/...`; signed-in calls send `Authorization: Bearer <Supabase access token>`.

| Endpoint | Used for |
| --- | --- |
| `GET /auth/google?redirect_to=` | start Google sign-in |
| `GET /auth/me` | verify session |
| `GET /products`, `GET /products/:slug` | shop, detail, gallery, home |
| `GET/PUT/DELETE /cart` (+ `/cart/:slug`) | cart persisted in Supabase |
| `POST /checkout`, `GET /orders`, `GET /orders/:ref`, `POST /orders/:ref/pay` | orders |
| `GET /bookings/availability`, `POST /bookings`, `GET /bookings`, `GET /bookings/:ref`, `POST /bookings/:ref/pay` | viewings |
| `POST /contact`, `GET /config` | contact form, business details |

The backend changes live in the `hng-15-stage-1` repo (run its updated `supabase/schema.sql` for the `cart_items` table and deploy it).

## Layout

- `src/lib/supabase.ts`: Supabase client, session persisted in AsyncStorage
- `src/context/AuthContext.tsx`: Google OAuth (PKCE) + email/password
- `src/context/CartContext.tsx`: cart, same shape and `eo-cart-v1` key as the site, persisted in AsyncStorage
- `src/lib/api.ts`: typed client for the Next.js API; `src/lib/products.ts`: product list (API, bundled catalogue only as an offline fallback)
- `src/theme.ts`: design tokens copied from the site's Tailwind theme
