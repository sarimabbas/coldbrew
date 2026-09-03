interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

type Cask = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  homepage: string | null;
  logoUrl: string | null;
  ranking: number | null;
  installCount: string | null;
  installPercent: string | null;
};

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

async function handleTrpc(request: Request, env: Env, procedure: string) {
  const input = await parseInput(request);

  if (procedure === "getCasks") {
    const query = input?.query ?? "";
    const skip = Number(input?.skip ?? 0);
    const take = Math.min(Number(input?.take ?? 200), 200);
    const { results } = await env.DB.prepare(
      `SELECT * FROM "Cask"
       WHERE (? = '' OR name LIKE ? COLLATE NOCASE OR id LIKE ? COLLATE NOCASE)
       ORDER BY ranking IS NULL, ranking ASC LIMIT ? OFFSET ?`,
    )
      .bind(query, `%${query}%`, `%${query}%`, take, skip)
      .all<Cask>();
    return json(results);
  }

  if (procedure === "getLastUpdated") {
    const row = await env.DB.prepare(
      'SELECT "updatedAt" FROM "Cask" ORDER BY "updatedAt" DESC LIMIT 1',
    ).first<{ updatedAt: string }>();
    return json(row?.updatedAt ?? null);
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

async function refreshCasks(env: Env) {
  const [analyticsResponse, detailsResponse] = await Promise.all([
    fetch("https://formulae.brew.sh/api/analytics/cask-install/365d.json"),
    fetch("https://formulae.brew.sh/api/cask.json"),
  ]);
  if (!analyticsResponse.ok || !detailsResponse.ok) {
    throw new Error("Homebrew API refresh failed");
  }
  const analytics = (await analyticsResponse.json()) as {
    items?: Array<{ cask: string; count: string; percent: string; number: number }>;
  };
  const details = (await detailsResponse.json()) as Array<{
    token: string;
    homepage?: string;
    name?: string[];
  }>;
  const detailMap = new Map(details.map((item) => [item.token, item]));
  const rows = (analytics.items ?? []).map((item) => {
    const detail = detailMap.get(item.cask);
    return {
      id: item.cask,
      name: detail?.name?.[0] ?? null,
      homepage: detail?.homepage ?? null,
      logoUrl: detail?.homepage ? `https://logo.clearbit.com/${detail.homepage}` : null,
      ranking: item.number,
      installCount: item.count,
      installPercent: item.percent,
    };
  });
  // Updating the entire Homebrew catalog in one run can exhaust D1's daily
  // rows-written allowance, especially because indexed columns cost extra
  // writes. Rotate through a bounded slice so the full catalog is refreshed
  // approximately once a week while keeping each daily run predictable.
  const refreshBatchSize = 4_000;
  const batchCount = Math.max(1, Math.ceil(rows.length / refreshBatchSize));
  const utcDay = Math.floor(Date.now() / 86_400_000);
  const batchIndex = utcDay % batchCount;
  const rowsToRefresh = rows.slice(
    batchIndex * refreshBatchSize,
    (batchIndex + 1) * refreshBatchSize,
  );

  const upsert = `
    INSERT INTO "Cask" (id, name, homepage, "logoUrl", ranking, "installCount", "installPercent", "createdAt", "updatedAt")
    SELECT
      json_extract(value, '$.id'), json_extract(value, '$.name'),
      json_extract(value, '$.homepage'), json_extract(value, '$.logoUrl'),
      json_extract(value, '$.ranking'), json_extract(value, '$.installCount'),
      json_extract(value, '$.installPercent'), datetime('now'), datetime('now')
    FROM json_each(?) WHERE true
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, homepage = excluded.homepage, "logoUrl" = excluded."logoUrl",
      ranking = excluded.ranking,
      "installCount" = excluded."installCount", "installPercent" = excluded."installPercent",
      "updatedAt" = datetime('now')
    WHERE
      name IS NOT excluded.name OR homepage IS NOT excluded.homepage OR
      "logoUrl" IS NOT excluded."logoUrl" OR ranking IS NOT excluded.ranking OR
      "installCount" IS NOT excluded."installCount" OR
      "installPercent" IS NOT excluded."installPercent"`;
  for (let offset = 0; offset < rowsToRefresh.length; offset += 250) {
    await env.DB.prepare(upsert)
      .bind(JSON.stringify(rowsToRefresh.slice(offset, offset + 250)))
      .run();
  }
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/trpc/")) {
        return handleTrpc(request, env, decodeURIComponent(url.pathname.slice(10)));
      }
      if (url.pathname === "/api/download") return download(request, env);
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
    ctx.waitUntil(refreshCasks(env));
  },
};
