// Fetch from RedStone REST (no npm package)
export async function handler(event) {
  try {
    const sysymbols (event.queryStringParameters?.symbols || "BTC,ETH")
      .split(",").map(s => s.trim()).filter(Boolean);

    const url = "https://api.redstone.finance/prices?symbols=" + encodeURIComponent(symbols.join(","));
    const res = await fetch(url);
    if (!res.ok) throw new Error("RedStone API error");
    const raw = await res.json();

    const data = {};
    if (Array.isArray(raw)) {
      for (const it of raw) {
        const sym = (it?.symbol || it?.id || "").toUpperCase();
        if (sym) data[sym] = { value: it.value, timestamp: it.timestamp ?? Date.now() };
      }
    } else if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw)) {
        data[k.toUpperCase()] = { value: v.value ?? v, timestamp: v.timestamp ?? Date.now() };
      }
    }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ data, at: Date.now() }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Failed to fetch prices" }) };
  }
}
