function hoursToMs(h) { return h * 3600 * 1000; }

export async function handler(event) {
  try {
    const symbol = (event.queryStringParameters.symbol || "BTC").toUpperCase();
    const range = event.queryStringParameters.range || "24h";
    const hours = range.endsWith("d") ? (parseInt(range) || 1) * 24 : (parseInt(range) || 24);

    const end = Date.now();
    const start = end - hoursToMs(hours);

    const url = `https://api.redstone.finance/prices/history/${symbol}?fromTimestamp=${start}&toTimestamp=${end}&interval=600000&provider=redstone&ts=${Date.now()}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });
    if (!res.ok) throw new Error("RedStone history API error");

    const arr = await res.json();

    const data = (Array.isArray(arr) ? arr : []).map(d => ({
      timestamp: d.timestamp,
      value: d.value
    }));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ data })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
}
