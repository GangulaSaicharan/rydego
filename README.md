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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production & DATABASE_URL

- **Set `DATABASE_URL`** in your production environment (e.g. Vercel, Railway). It must be available at build time if you run migrations during build.
- **If your DB password contains special characters** (e.g. `@`, `#`, `%`, `!`), they must be **URL-encoded** in `DATABASE_URL`, or the URL will be parsed incorrectly and you may see errors like `Can't reach database server at 3:5432`.
  - Example: password `Sai1!2@3#4$5%6^` → encode as `Sai1%212%403%234%245%256%5E` (`!`→`%21`, `@`→`%40`, `#`→`%23`, `$`→`%24`, `%`→`%25`, `^`→`%5E`).
  - Full URL example: `postgresql://postgres:Sai1%212%403%234%245%256%5E@db.xxxx.supabase.co:5432/postgres`
- After deploy, run migrations (and optionally seed) in your release step or locally against production: `npm run migrate:deploy` and optionally `npm run db:seed`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
