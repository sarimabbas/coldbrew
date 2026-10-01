export type Cask = {
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

type HomebrewCask = { token: string; homepage?: string; name?: string[] };
type Analytics = {
  items?: Array<{ cask: string; count: string; percent: string; number: number }>;
};
export type Catalog = { updatedAt: string; casks: Cask[] };

// Only current, installable casks belong in search. Analytics also contains
// removed casks and historical variants; it supplies ranking, not the catalog.
export function buildCatalog(details: HomebrewCask[], analytics: Analytics, updatedAt: string): Catalog {
  const rankings = new Map<string, NonNullable<Analytics["items"]>[number]>();
  for (const item of analytics.items ?? []) {
    if (!rankings.has(item.cask)) rankings.set(item.cask, item);
  }
  const casks = details.map((detail): Cask => {
    const rank = rankings.get(detail.token);
    return {
      id: detail.token,
      createdAt: updatedAt,
      updatedAt,
      name: detail.name?.[0] ?? null,
      homepage: detail.homepage ?? null,
      logoUrl: detail.homepage
        ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(detail.homepage)}&sz=128`
        : null,
      ranking: rank?.number ?? null,
      installCount: rank?.count ?? null,
      installPercent: rank?.percent ?? null,
    };
  });
  casks.sort((a, b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity) || a.id.localeCompare(b.id));
  return { updatedAt, casks };
}

// Reuse the parsed snapshot within an isolate. A cold miss reads KV, never D1.
let cached: { namespace: KVNamespace; expires: number; value: Promise<Catalog> } | undefined;
export function loadCatalog(namespace: KVNamespace): Promise<Catalog> {
  if (!cached || cached.namespace !== namespace || cached.expires <= Date.now()) {
    const value = namespace.get<Catalog>("catalog", { type: "json", cacheTtl: 900 }).then((catalog) => {
      if (!catalog) throw new Error("Catalog snapshot unavailable");
      return catalog;
    });
    const entry = { namespace, expires: Date.now() + 900_000, value };
    cached = entry;
    value.catch(() => { if (cached === entry) cached = undefined; });
  }
  return cached.value;
}

export function searchCatalog(catalog: Catalog, query: string, skip: number, take: number): Cask[] {
  if (!query) return catalog.casks.slice(skip, skip + take);
  const results: Cask[] = [];
  let matches = 0;
  for (const cask of catalog.casks) {
    if (!cask.id.toLowerCase().includes(query) && !cask.name?.toLowerCase().includes(query)) continue;
    if (matches++ < skip) continue;
    results.push(cask);
    if (results.length === take) break;
  }
  return results;
}

export async function refreshCatalog(namespace: KVNamespace) {
  const [analyticsResponse, detailsResponse] = await Promise.all([
    fetch("https://formulae.brew.sh/api/analytics/cask-install/365d.json"),
    fetch("https://formulae.brew.sh/api/cask.json"),
  ]);
  if (!analyticsResponse.ok || !detailsResponse.ok) throw new Error("Homebrew API refresh failed");
  const catalog = buildCatalog(
    await detailsResponse.json() as HomebrewCask[],
    await analyticsResponse.json() as Analytics,
    new Date().toISOString(),
  );
  if (!catalog.casks.length) throw new Error("Refusing to replace catalog with an empty snapshot");
  await namespace.put("catalog", JSON.stringify(catalog));
  await namespace.put("updatedAt", catalog.updatedAt);
  cached = { namespace, expires: Date.now() + 900_000, value: Promise.resolve(catalog) };
  console.log("Catalog refreshed", { casks: catalog.casks.length, updatedAt: catalog.updatedAt });
}
