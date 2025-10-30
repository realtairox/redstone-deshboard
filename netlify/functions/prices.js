// Netlify Function: prices
import redstone from 'redstone-api';

export async function handler(event) {
  try {
    const symbolsParam = (event.queryStringParameters?.symbols || 'BTC,ETH')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // RedStone: single-symbol => object, multi-symbol => map
    const prices = await redstone.getPrice(
      symbolsParam.length === 1 ? symbolsParam[0] : symbolsParam
    );

    const data = symbolsParam.length === 1
      ? { [symbolsParam[0]]: prices }
      : prices;

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data, at: Date.now() })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || 'Failed to fetch prices' })
    };
  }
      }
