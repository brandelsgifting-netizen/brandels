This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Supabase authentication

Email/password and Google authentication use Supabase Auth. Copy `.env.example`
to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project API settings.
These public client settings are safe for browser use when Row Level Security is
enabled on database tables. Never expose a Supabase secret or service-role key.

To enable Google sign-in:

1. In Supabase, open **Authentication → Providers → Google** and enable Google.
2. In Google Cloud Console, create an OAuth web client and add your Supabase
   project callback (`https://<project-ref>.supabase.co/auth/v1/callback`) as
   an authorized redirect URI.
3. Paste the Google client ID and secret into the Supabase Google provider
   settings.
4. In Supabase **Authentication → URL Configuration**, set the site URL to
   `http://localhost:3000` and allow `http://localhost:3000/auth/callback`.
5. In Google Cloud, add `http://localhost:3000` as an authorized JavaScript
   origin.

Email sign-up uses Supabase email confirmation when that setting is enabled.
Configure production site and redirect URLs in Supabase before deployment.
Password reset returns to `/account/update-password`.

## Database setup

The database schema and row-level security policies are in
`supabase/migrations/`. In Supabase, open
**SQL Editor → New query**, paste and run the migrations in order:

1. `supabase/migrations/20261104220000_brandels_backend.sql`
2. `supabase/migrations/20261105010000_vendor_product_catalog.sql`
3. `supabase/migrations/20261105020000_named_recipient_groups.sql`
4. `supabase/migrations/20261106000000_remove_vendor_review.sql`
5. `supabase/migrations/20261106010000_vendor_orders_paystack.sql`

Run each migration once. They create profiles, vendor product listings and
media storage, named recipient groups, and customer cart/collection state, with
row-level security. The base schema retains the legacy vendor application table
for existing data, but the vendor product flow no longer uses application or
approval steps. Existing recipient contacts are preserved in a group named
“My recipients.” The latest migration moves product ownership to the signed-in
user; existing products remain attached to their original accounts.

The app's server routes persist vendor products, named recipient groups, and
the product page's saved collections/cart. Any signed-in user can create drafts
or publish products directly in the public catalog, edit their products, and
upload up to 10 images per product. Image uploads are sent to the
OpenAI Images API for product-photo cleanup, then stored in the
`vendor-product-images` Supabase Storage bucket. Add `OPENAI_API_KEY` to the
server environment (never a `NEXT_PUBLIC_` variable) and configure OpenAI
billing before using cleanup; uploaded images are sent to OpenAI for
processing. OpenAI usage can incur charges.

Product purchase uses Paystack. Set `PAYSTACK_SECRET_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` as server-only environment variables; never expose
either with a `NEXT_PUBLIC_` prefix. Configure a Paystack webhook pointing to
`/api/payments/paystack/webhook`, and set `PAYSTACK_WEBHOOK_SECRET` if your
Paystack dashboard provides a webhook signing secret. Checkout records an order
for the selected vendor, collects delivery details, and keeps optional design
and logo files private to the buyer and vendor. Payments are collected by
Brandels and vendor settlement is handled separately. Configure delivery fees,
refunds, and settlement operations before accepting live payments.

Delivery fees, refunds, vendor settlement, and full fulfilment operations still
need to be configured before accepting live payments.

After running the SQL, restart the development server and test with a newly
created account. The service-role key is used only by server-side payment
confirmation and must never be exposed to the browser.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
