export async function handler(event) {
  try {
    const symbols = (event.queryStringParameters.symbols || "BTC,ETH,SOL").split(",");
    const res = await fetch(`https://api.redstone.finance/prices?symbols=${symbols.join(",")}&provider=redstone`);
    const data = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ data, at: Date.now() }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
