export async function handler(event) {
  try {
    const symbols = (event.queryStringParameters.symbols || "BTC,ETH,SOL")
      .split(",").map(s => s.trim()).filter(Boolean);

    const url = "https://api.redstone.finance/prices?symbols="
      + encodeURIComponent(symbols.join(","))
      + "&provider=redstone&ts=" + Date.now();

    const res = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" } });
    if (!res.ok) throw new Error("RedStone API error");
    const raw = await res.json();

    const data = {};
    if (Array.isArray(raw)) {
      for (const it of raw) {
        const k = (it?.symbol || it?.id || "").toUpperCase();
        if (k) data[k] = { value: it.value, timestamp: it.timestamp ?? Date.now() };
      }
    } else if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw)) {
        data[k.toUpperCase()] = { value: v.value ?? v, timestamp: v.timestamp ?? Date.now() };
      }
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ data, at: Date.now() })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
