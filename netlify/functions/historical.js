export async function handler(event) {
  try {
    const { symbol = "BTC", range = "24h" } = event.queryStringParameters;
    const res = await fetch(`https://api.redstone.finance/prices/history?symbol=${symbol}&range=${range}`);
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
