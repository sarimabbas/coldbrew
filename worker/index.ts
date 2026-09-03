import { neon } from "@neondatabase/serverless";

interface Env {
  ASSETS: Fetcher;
  DATABASE_URL: string;
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

const sessionWithCasks = async (sql: ReturnType<typeof neon>, id: string) => {
  const sessions = await sql.query(
    'SELECT id, "createdAt", "updatedAt" FROM "Session" WHERE id = $1 LIMIT 1',
    [id],
  );
  if (!sessions[0]) return null;
  const casks = await sql.query(
    'SELECT c.* FROM "Cask" c JOIN "_CaskToSession" r ON r."A" = c.id WHERE r."B" = $1 ORDER BY c.ranking ASC',
    [id],
  );
  return { ...sessions[0], casks };
};

const authorized = async (sql: ReturnType<typeof neon>, id: string, token: string) => {
  const rows = await sql.query(
    'SELECT id FROM "Session" WHERE id = $1 AND "accessToken" = $2 LIMIT 1',
    [id, token],
  );
  return Boolean(rows[0]);
};

async function handleTrpc(request: Request, env: Env, procedure: string) {
  const sql = neon(env.DATABASE_URL);
  const input = await parseInput(request);

  if (procedure === "getCasks") {
    const query = input?.query ?? "";
    const skip = Number(input?.skip ?? 0);
    const take = Math.min(Number(input?.take ?? 200), 200);
    const pattern = `%${query}%`;
    const rows = await sql.query(
      'SELECT * FROM "Cask" WHERE ($1 = \'\' OR name ILIKE $2 OR id ILIKE $2) ORDER BY ranking ASC NULLS LAST OFFSET $3 LIMIT $4',
      [query, pattern, skip, take],
    );
    return json(rows);
  }

  if (procedure === "getLastUpdated") {
    const rows = await sql.query('SELECT "updatedAt" FROM "Cask" ORDER BY "updatedAt" DESC LIMIT 1');
    return json(rows[0]?.updatedAt ?? null);
  }

  if (procedure === "getSession") return json(await sessionWithCasks(sql, input?.sessionId));

  if (procedure === "createNewSession") {
    const id = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    const rows = await sql.query(
      'INSERT INTO "Session" (id, "accessToken", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [id, accessToken],
    );
    return json(rows[0]);
  }

  if (procedure === "addCaskToSession" || procedure === "removeCaskFromSession") {
    if (!(await authorized(sql, input?.sessionId, input?.accessToken))) {
      return error("Access token not valid for this operation", "UNAUTHORIZED", 401);
    }
    if (procedure === "addCaskToSession") {
      await sql.query(
        'INSERT INTO "_CaskToSession" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [input.caskId, input.sessionId],
      );
    } else {
      await sql.query('DELETE FROM "_CaskToSession" WHERE "A" = $1 AND "B" = $2', [input.caskId, input.sessionId]);
    }
    await sql.query('UPDATE "Session" SET "updatedAt" = NOW() WHERE id = $1', [input.sessionId]);
    return json(await sessionWithCasks(sql, input.sessionId));
  }

  if (procedure === "copyCasksBetweenSessions") {
    if (!(await authorized(sql, input?.destinationSessionId, input?.destinationSessionAccessToken))) {
      return error("Destination session not found", "NOT_FOUND", 404);
    }
    await sql.query(
      'INSERT INTO "_CaskToSession" ("A", "B") SELECT "A", $2 FROM "_CaskToSession" WHERE "B" = $1 ON CONFLICT DO NOTHING',
      [input.sourceSessionId, input.destinationSessionId],
    );
    await sql.query('UPDATE "Session" SET "updatedAt" = NOW() WHERE id = $1', [input.destinationSessionId]);
    const rows = await sql.query('SELECT id, "createdAt", "updatedAt" FROM "Session" WHERE id = $1', [input.destinationSessionId]);
    return json(rows[0]);
  }

  return error("No procedure found", "NOT_FOUND", 404);
}

async function download(request: Request, env: Env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session");
  if (!sessionId) return new Response("no session param", { status: 400 });
  const sql = neon(env.DATABASE_URL);
  const rows = await sql.query(
    'SELECT c.id FROM "Cask" c JOIN "_CaskToSession" r ON r."A" = c.id WHERE r."B" = $1 ORDER BY c.ranking ASC',
    [sessionId],
  );
  const brewfile = rows.map((row) => `cask "${row.id}"`).join("\n");
  if (url.searchParams.has("file")) {
    return new Response(brewfile, { headers: { "content-type": "text/plain", "content-disposition": "attachment; filename=Brewfile" } });
  }
  return new Response(["#!/bin/sh", "brew bundle --no-lock --file=/dev/stdin <<EOF", brewfile, "EOF"].join("\n\n"));
}

async function refreshCasks(env: Env) {
  const [analyticsResponse, detailsResponse] = await Promise.all([
    fetch("https://formulae.brew.sh/api/analytics/cask-install/365d.json"),
    fetch("https://formulae.brew.sh/api/cask.json"),
  ]);
  const analytics = (await analyticsResponse.json()) as { items?: Array<{ cask: string; count: string; percent: string; number: number }> };
  const details = (await detailsResponse.json()) as Array<{ token: string; homepage?: string; name?: string[] }>;
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
  const sql = neon(env.DATABASE_URL);
  await sql.query(
    `INSERT INTO "Cask" (id, name, homepage, "logoUrl", ranking, "installCount", "installPercent", "createdAt", "updatedAt")
     SELECT x.id, x.name, x.homepage, x."logoUrl", x.ranking, x."installCount", x."installPercent", NOW(), NOW()
     FROM jsonb_to_recordset($1::jsonb) AS x(id text, name text, homepage text, "logoUrl" text, ranking int, "installCount" text, "installPercent" text)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, homepage = EXCLUDED.homepage, ranking = EXCLUDED.ranking,
       "installCount" = EXCLUDED."installCount", "installPercent" = EXCLUDED."installPercent", "updatedAt" = NOW()`,
    [JSON.stringify(rows)],
  );
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/trpc/")) return handleTrpc(request, env, decodeURIComponent(url.pathname.slice(10)));
      if (url.pathname === "/api/download") return download(request, env);
      if (url.pathname === "/api/extract-background") {
        await refreshCasks(env);
        return new Response("ok");
      }
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
