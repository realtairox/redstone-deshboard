// Tries both RedStone history endpoints and normalizes to [{timestamp,value}]
function hoursToMs(h) { return h * 3600 * 1000; }

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function normalize(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(p => ({
      timestamp: Number(p.timestamp ?? p.time ?? p.ts ?? 0),
      value: Number(p.value ?? p.price ?? p.v ?? p.p ?? NaN),
    }))
    .filter(p => Number.isFinite(p.timestamp) && Number.isFinite(p.value));
}

export async function handler(event) {
  try {
    const symbol = (event.queryStringParameters.symbol || "BTC").toUpperCase();
    const range = event.queryStringParameters.range || "24h";
    const hours = range.endsWith("d") ? (parseInt(range) || 1) * 24 : (parseInt(range) || 24);

    const end = Date.now();
    const start = end - hoursToMs(hours);
    const intervalMs = 10 * 60 * 1000; // 10 min

    // Query-style endpoint
    const q = new URLSearchParams({
      symbol,
      fromTimestamp: String(start),
      toTimestamp: String(end),
      interval: String(intervalMs),
      provider: "redstone",
      ts: String(Date.now()),
    });
    const url1 = "https://api.redstone.finance/prices/history?" + q.toString();

    // Fallback: path-style endpoint
    const url2 =
      `https://api.redstone.finance/prices/history/${symbol}` +
      `?fromTimestamp=${start}&toTimestamp=${end}&interval=${intervalMs}&provider=redstone&ts=${Date.now()}`;

    let data = normalize(await fetchJson(url1));
    if (data.length === 0) data = normalize(await fetchJson(url2));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ data }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
