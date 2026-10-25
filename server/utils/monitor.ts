import { logServerError } from "./logger";

export const finite = (n: unknown): number | null => {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
};

export const monitorCache = (seconds = 60) => ({
  "cache-control": `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
});

export const monitor =
  <T, R>(cache: number, url: string | null, map: (d: T | null) => R) =>
  async () => {
    let body: R | null;
    try {
      body = map(url ? await fetchJson<T>(url) : null);
    } catch (error) {
      // A malformed upstream payload must not 500 the route — log it and fall
      // back to the handler's null shape (clients already tolerate null data).
      logServerError("monitor:handler", error, { url });
      try {
        body = map(null);
      } catch {
        body = null;
      }
    }
    return Response.json(body, { headers: monitorCache(cache) });
  };

export async function fetchJson<T>(url: string, timeoutMs = 1800): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "3kh0.net/1.0",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
