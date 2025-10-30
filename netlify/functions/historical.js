// Fetch 24h history from RedStone REST (no npm package)
function hoursToMs(h) { return h * 3600 * 1000; }

export async function handler(event) {
  try {
    const symbol = (event.queryStringParameters?.symbol || "BTC").toUpperCase();
    const range = event.queryStringParameters?.range || "24h";
    const hours = range.endsWith("d") ? (parseInt(range) || 1) * 24 : (parseInt(range) || 24);

    const end = Date.now();
    const start = end - hoursToMs(hours);
    const params = new URLSearchParams({
      symbol,
      fromTimestamp: String(start),
      toTimestamp: String(end),
      interval: String(10 * 60 * 1000) // 10 minutes
    });

    const url = "https://api.redstone.finance/prices/history?" + params.toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error("RedStone history API error");
    const arr = await res.json();

    const data = Array.isArray(arr) ? arr.map(p => ({ value: p.value, timestamp: p.timestamp })) : [];
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Failed to fetch history" }) };
  }
}
