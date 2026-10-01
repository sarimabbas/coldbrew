# Coldbrew

- [Coldbrew](#coldbrew)
  - [Introduction](#introduction)
  - [Stack](#stack)
  - [Local development](#local-development)

## Introduction

A visual interface to quickly install your favorite macOS apps from Homebrew Cask

## Stack

- Cloudflare Workers
- Cloudflare D1
- Next.js
- Tailwind CSS
- Prisma
- TRPC
- TypeScript

## Local development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Catalogue storage and cost

The production Worker serves browsing, substring search and the last-update
stamp from a daily Homebrew snapshot in the `CATALOG` KV namespace. These paths
never query D1, including on cold cache misses. The first page slices only 200
items from the ranked snapshot; searches stop once their requested page is full.
Only casks present in Homebrew's current catalogue are searchable. Existing saved
selections are retained, including historical casks.

A Worker isolate reuses its parsed snapshot for 15 minutes, and public GET
responses are cached for 15 minutes at the edge (5 minutes in the browser).
Session and authorization responses are never placed in this public cache.
The daily 10:00 UTC cron refresh writes two KV keys (`catalog` and `updatedAt`)
and performs no D1 work. A failed or empty upstream refresh keeps the previous
snapshot. KV updates may take about 15 minutes to become visible through caches.

D1 stores sessions, their selections, and metadata for selected casks. New
selections upsert only the selected cask; there is no scheduled database-wide
catalogue update. D1 usage therefore depends on saved-session activity, rather
than page loads or searches. This removes catalogue usage, but is not a hard
account-wide quota cap for arbitrary session traffic.

Before the first deployment, populate both KV keys from a Homebrew snapshot;
subsequent refreshes run on the cron schedule. Run `pnpm test` with Node 22.13+
to verify zero D1 access on public catalogue paths, cache reuse, refresh behavior,
and saved-selection/Brewfile functionality against SQLite.
