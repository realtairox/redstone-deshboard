// Netlify Function: historical
import redstone from 'redstone-api';

function rangeToHours(range) {
  if (!range) return 24;
  if (range.endsWith('h')) return parseInt(range) || 24;
  if (range.endsWith('d')) return (parseInt(range) || 1) * 24;
  return 24;
}

export async function handler(event) {
  try {
    const symbol = event.queryStringParameters?.symbol || 'BTC';
    const range = rangeToHours(event.queryStringParameters?.range || '24h');

    const end = new Date();
    const start = new Date(end.getTime() - range * 3600 * 1000);

    const series = await redstone.getHistoricalPrice(symbol, {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      interval: 10 * 60 * 1000 // 10-minute interval
    });

    const data = (series || []).map(p => ({ value: p.value, timestamp: p.timestamp }));

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || 'Failed to fetch history' })
    };
  }
      }
