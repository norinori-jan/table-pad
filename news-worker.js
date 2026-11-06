const ALLOWED_ORIGIN = "https://norinori-jan.github.io";
const MIN_INTERVAL_MS = 5000;
const UPSTREAM_BACKOFF_MS = 60000;
const GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

function cors(origin) {
  const allowed = origin === ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed ? ALLOWED_ORIGIN : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "Retry-After, X-Upstream-Bytes",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}
function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);
    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) return new Response(null, { status: 403, headers });
      return new Response(null, { status: 204, headers });
    }
    if (origin !== ALLOWED_ORIGIN) return json({ error: "origin_denied", message: "許可されていない接続元です。" }, 403, headers);
    if (request.method !== "POST") return json({ error: "method_not_allowed", message: "POST only" }, 405, headers);

    let input;
    try { input = await request.json(); }
    catch { return json({ error: "invalid_json", message: "リクエストJSONを読み取れません。" }, 400, headers); }

    const q = String(input.q || "world news").trim().slice(0, 120);
    const hours = Number(input.hours);
    const max = Number(input.max);
    if (!q || ![24, 48, 168].includes(hours) || ![10, 25, 50].includes(max)) {
      return json({ error: "invalid_parameters", message: "検索語・期間・件数を確認してください。" }, 400, headers);
    }

    const id = env.NEWS_RATE_LIMITER.idFromName("global-gdelt");
    const stub = env.NEWS_RATE_LIMITER.get(id);
    return stub.fetch("https://rate-limiter.internal/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-Origin": origin },
      body: JSON.stringify({ q, hours, max })
    });
  }
};

export class NewsRateLimiter {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const input = await request.json();
    const now = Date.now();
    const gate = await this.ctx.storage.transaction(async txn => {
      const blockedUntil = await txn.get("blockedUntil") || 0;
      if (blockedUntil > now) return { allowed: false, waitMs: blockedUntil - now, reason: "upstream_backoff" };
      const lastAt = await txn.get("lastRequestAt") || 0;
      const waitMs = MIN_INTERVAL_MS - (now - lastAt);
      if (waitMs > 0) return { allowed: false, waitMs, reason: "rate_limited" };
      await txn.put("lastRequestAt", now);
      return { allowed: true };
    });

    const origin = request.headers.get("X-Forwarded-Origin") || "";
    const headers = cors(origin);
    if (!gate.allowed) {
      return json({
        error: gate.reason,
        message: gate.reason === "upstream_backoff" ? `GDELTが混雑しているため、あと${Math.ceil(gate.waitMs / 1000)}秒待ってください。自動再試行は行いません。` : `GDELTへの要求間隔を空けるため、あと${(gate.waitMs / 1000).toFixed(1)}秒待ってください。`,
        retryAfterMs: gate.waitMs
      }, 429, { ...headers, "Retry-After": String(Math.ceil(gate.waitMs / 1000)) });
    }

    const upstream = new URL(GDELT_URL);
    upstream.searchParams.set("query", input.q);
    upstream.searchParams.set("mode", "ArtList");
    upstream.searchParams.set("format", "json");
    upstream.searchParams.set("maxrecords", String(input.max));
    upstream.searchParams.set("sort", "DateDesc");
    upstream.searchParams.set("timespan", input.hours + "h");

    let response;
    try {
      response = await fetch(upstream.toString(), {
        headers: { "User-Agent": "table-pad-news/1.0" },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
    } catch (error) {
      return json({ error: "upstream_network_error", message: "GDELTへの接続に失敗しました。", detail: String(error?.message || error) }, 502, headers);
    }

    const body = await response.text();
    const bytes = new TextEncoder().encode(body).length;
    if (!response.ok) {
      if (response.status === 429) {
        const retryHeader = Number(response.headers.get("Retry-After") || 0);
        const waitMs = Math.max(UPSTREAM_BACKOFF_MS, retryHeader > 0 ? retryHeader * 1000 : 0);
        await this.ctx.storage.put("blockedUntil", Date.now() + waitMs);
        return json({
          error: "upstream_429",
          message: `GDELTが429（Too Many Requests）を返しました。全端末で${Math.ceil(waitMs / 1000)}秒間、取得を停止します。`,
          retryAfterMs: waitMs,
          detail: body.slice(0, 1600)
        }, 429, { ...headers, "Retry-After": String(Math.ceil(waitMs / 1000)) });
      }
      return json({ error: "upstream_http_error", message: `GDELT HTTPエラー: ${response.status} ${response.statusText}`, detail: body.slice(0, 1600) }, 502, headers);
    }

    let data;
    try { data = JSON.parse(body); }
    catch {
      return json({
        error: "gdelt_rate_or_format_message",
        message: "GDELTからニュースJSONではない応答が返されました。取得内容は保存していません。",
        detail: body.slice(0, 1600)
      }, 502, headers);
    }
    if (!data || !Array.isArray(data.articles)) {
      return json({ error: "gdelt_invalid_format", message: "GDELT応答にarticles配列がありません。", detail: body.slice(0, 1600) }, 502, headers);
    }

    // Return only fields consumed by table-pad; omit images, social metadata and article text.
    const compact = {
      articles: data.articles.slice(0, input.max).map(article => ({
        title: String(article.title || "").slice(0, 500),
        url: String(article.url || "").slice(0, 2000),
        domain: String(article.domain || "").slice(0, 200),
        seendate: String(article.seendate || "").slice(0, 40)
      })).filter(article => article.url)
    };
    const compactBody = JSON.stringify(compact);
    const compactBytes = new TextEncoder().encode(compactBody).length;
    return new Response(compactBody, {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "X-Upstream-Bytes": String(bytes), "X-Response-Bytes": String(compactBytes) }
    });
  }
}
