import { Cask, loadCatalog, refreshCatalog, searchCatalog } from "./catalog";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CATALOG: KVNamespace;
}

const json = (data: unknown, status = 200) =>
  Response.json({ id: null, result: { type: "data", data } }, { status });

const error = (message: string, code = "INTERNAL_SERVER_ERROR", status = 500) =>
  Response.json(
    { id: null, error: { message, code: -32000, data: { code, httpStatus: status } } },
    { status },
  );

const parseInput = async (request: Request) => {
  if (request.method === "GET") {
    const raw = new URL(request.url).searchParams.get("input");
    return raw ? JSON.parse(raw) : null;
  }
  const body = await request.text();
  return body ? JSON.parse(body) : null;
};

const sessionWithCasks = async (db: D1Database, id: string) => {
  const session = await db
    .prepare('SELECT id, "createdAt", "updatedAt" FROM "Session" WHERE id = ? LIMIT 1')
    .bind(id)
    .first();
  if (!session) return null;
  const { results: casks } = await db
    .prepare(
      'SELECT c.* FROM "Cask" c JOIN "_CaskToSession" r ON r."A" = c.id WHERE r."B" = ? ORDER BY c.ranking ASC',
    )
    .bind(id)
    .all<Cask>();
  return { ...session, casks };
};

const authorized = async (db: D1Database, id: string, token: string) =>
  Boolean(
    await db
      .prepare('SELECT id FROM "Session" WHERE id = ? AND "accessToken" = ? LIMIT 1')
      .bind(id, token)
      .first(),
  );

async function publicCatalogResponse(request: Request, ctx: ExecutionContext, key: string, read: () => Promise<Response>) {
  const cacheKey = new Request(new URL(`/__catalog/${key}`, request.url));
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;
  const response = await read();
  response.headers.set("Cache-Control", "public, max-age=300, s-maxage=900");
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function handleTrpc(request: Request, env: Env, procedure: string, ctx: ExecutionContext) {
  const input = await parseInput(request);

  if (procedure === "getCasks" || procedure === "getLastUpdated") {
    if (request.method !== "GET") return error("Use GET for catalog queries", "METHOD_NOT_SUPPORTED", 405);
    if (procedure === "getLastUpdated") {
      return publicCatalogResponse(request, ctx, "updatedAt", async () =>
        json(await env.CATALOG.get("updatedAt", { cacheTtl: 900 })),
      );
    }
    const query = input?.query ?? "";
    const skip = input?.skip ?? 0;
    const take = input?.take ?? 200;
    if (typeof query !== "string" || query.length > 100 ||
        !Number.isSafeInteger(skip) || skip < 0 || skip > 10_000 ||
        !Number.isSafeInteger(take) || take < 1 || take > 200) {
      return error("Invalid catalog query or pagination", "BAD_REQUEST", 400);
    }
    const normalized = query.trim().toLowerCase();
    const key = `casks?query=${encodeURIComponent(normalized)}&skip=${skip}&take=${take}`;
    return publicCatalogResponse(request, ctx, key, async () =>
      json(searchCatalog(await loadCatalog(env.CATALOG), normalized, skip, take)),
    );
  }

  if (procedure === "getSession") return json(await sessionWithCasks(env.DB, input?.sessionId));

  if (procedure === "createNewSession") {
    const id = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO "Session" (id, "accessToken", "createdAt", "updatedAt") VALUES (?, ?, ?, ?)',
    )
      .bind(id, accessToken, now, now)
      .run();
    return json({ id, accessToken, createdAt: now, updatedAt: now });
  }

  if (procedure === "addCaskToSession" || procedure === "removeCaskFromSession") {
    if (!(await authorized(env.DB, input?.sessionId, input?.accessToken))) {
      return error("Access token not valid for this operation", "UNAUTHORIZED", 401);
    }
    if (procedure === "addCaskToSession") {
      const cask = (await loadCatalog(env.CATALOG)).casks.find((cask) => cask.id === input.caskId);
      if (!cask) return error("Cask is no longer available in Homebrew", "NOT_FOUND", 404);
      // Persist only selected casks. Browsing and the daily refresh never touch D1.
      await env.DB.prepare(`
        INSERT INTO "Cask" (id, name, homepage, "logoUrl", ranking, "installCount", "installPercent", "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name, homepage = excluded.homepage,
          "logoUrl" = excluded."logoUrl", ranking = excluded.ranking,
          "installCount" = excluded."installCount", "installPercent" = excluded."installPercent",
          "updatedAt" = excluded."updatedAt"
        WHERE name IS NOT excluded.name OR homepage IS NOT excluded.homepage OR
          "logoUrl" IS NOT excluded."logoUrl" OR ranking IS NOT excluded.ranking OR
          "installCount" IS NOT excluded."installCount" OR "installPercent" IS NOT excluded."installPercent"
      `).bind(cask.id, cask.name, cask.homepage, cask.logoUrl, cask.ranking,
        cask.installCount, cask.installPercent, cask.createdAt, cask.updatedAt).run();

      await env.DB.prepare(
        'INSERT OR IGNORE INTO "_CaskToSession" ("A", "B") VALUES (?, ?)',
      )
        .bind(input.caskId, input.sessionId)
        .run();
    } else {
      await env.DB.prepare('DELETE FROM "_CaskToSession" WHERE "A" = ? AND "B" = ?')
        .bind(input.caskId, input.sessionId)
        .run();
    }
    await env.DB.prepare('UPDATE "Session" SET "updatedAt" = ? WHERE id = ?')
      .bind(new Date().toISOString(), input.sessionId)
      .run();
    return json(await sessionWithCasks(env.DB, input.sessionId));
  }

  if (procedure === "copyCasksBetweenSessions") {
    if (
      !(await authorized(
        env.DB,
        input?.destinationSessionId,
        input?.destinationSessionAccessToken,
      ))
    ) {
      return error("Destination session not found", "NOT_FOUND", 404);
    }
    const source = await env.DB.prepare('SELECT id FROM "Session" WHERE id = ? LIMIT 1')
      .bind(input.sourceSessionId)
      .first();
    if (!source) return error("Source session not found", "NOT_FOUND", 404);
    await env.DB.prepare(
      'INSERT OR IGNORE INTO "_CaskToSession" ("A", "B") SELECT "A", ? FROM "_CaskToSession" WHERE "B" = ?',
    )
      .bind(input.destinationSessionId, input.sourceSessionId)
      .run();
    const now = new Date().toISOString();
    await env.DB.prepare('UPDATE "Session" SET "updatedAt" = ? WHERE id = ?')
      .bind(now, input.destinationSessionId)
      .run();
    const session = await env.DB.prepare(
      'SELECT id, "createdAt", "updatedAt" FROM "Session" WHERE id = ?',
    )
      .bind(input.destinationSessionId)
      .first();
    return json(session);
  }

  return error("No procedure found", "NOT_FOUND", 404);
}

async function download(request: Request, env: Env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session");
  if (!sessionId) return new Response("no session param", { status: 400 });
  const { results } = await env.DB.prepare(
    'SELECT c.id FROM "Cask" c JOIN "_CaskToSession" r ON r."A" = c.id WHERE r."B" = ? ORDER BY c.ranking ASC',
  )
    .bind(sessionId)
    .all<{ id: string }>();
  const brewfile = results.map((row) => `cask "${row.id}"`).join("\n");
  if (url.searchParams.has("file")) {
    return new Response(brewfile, {
      headers: {
        "content-type": "text/plain",
        "content-disposition": "attachment; filename=Brewfile",
      },
    });
  }
  return new Response(
    ["#!/bin/sh", "brew bundle --no-lock --file=/dev/stdin <<EOF", brewfile, "EOF"].join(
      "\n\n",
    ),
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/trpc/")) {
        return await handleTrpc(request, env, decodeURIComponent(url.pathname.slice(10)), ctx);
      }
      if (url.pathname === "/api/download") return await download(request, env);
      // Catalog refreshes are intentionally cron-only. Exposing this as a
      // public route allowed anyone to consume the account's D1 write quota.
      if (url.pathname === "/api/extract-background") return new Response("Not found", { status: 404 });
      return env.ASSETS.fetch(request);
    } catch (cause) {
      console.error(cause);
      return error(cause instanceof Error ? cause.message : "Unexpected error");
    }
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(refreshCatalog(env.CATALOG));
  },
};
