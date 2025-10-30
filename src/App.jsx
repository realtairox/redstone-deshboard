import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const DEFAULT_SYMBOLS = "BTC,ETH,SOL,AR";

// fetch helper: force fresh data every call
async function jget(path) {
  const bust = path.includes("?") ? "&t=" + Date.now() : "?t=" + Date.now();
  const res = await fetch(path + bust, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) throw new Error("Network error");
  return res.json();
}
const fmt = (n) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(n);

export default function App() {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [prices, setPrices] = useState({ data: {}, at: 0 });
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");
  const [isLive, setIsLive] = useState(false);

  const firstSymbol = useMemo(
    () => symbols.split(",")[0]?.trim().toUpperCase() || "BTC",
    [symbols]
  );

  const loadPrices = async () => {
    try {
      setErr("");
      const r = await jget(
        `/.netlify/functions/prices?symbols=${encodeURIComponent(symbols)}`
      );
      setPrices(r);
      setIsLive(true);
    } catch (e) {
      setErr(e.message || "Failed to load prices");
      setIsLive(false);
    }
  };

  const loadHistory = async (sym) => {
    try {
      const r = await jget(
        `/.netlify/functions/historical?symbol=${encodeURIComponent(sym)}&range=24h`
      );
      setHistory(r.data || []);
    } catch (_) {}
  };

  // initial + 10s interval refresh
  useEffect(() => {
    loadPrices();
    loadHistory(firstSymbol);
    const p = setInterval(loadPrices, 10000);
    const h = setInterval(() => loadHistory(firstSymbol), 10000);
    return () => { clearInterval(p); clearInterval(h); };
  }, [symbols, firstSymbol]);

  const lastUpdated = prices.at ? new Date(prices.at).toLocaleTimeString() : "—";

  const cards = Object.entries(prices.data || {}).map(([sym, obj]) => (
    <div key={sym} className="rounded-2xl p-4 bg-zinc-900/80 ring-1 ring-zinc-800 shadow">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span>USD • RedStone</span>
        <span className={`inline-block w-2 h-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-zinc-600"}`} />
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-wide">
        {sym}
        <span className="text-zinc-400 text-base ml-2">{fmt(Number(obj?.value ?? obj))}</span>
      </div>
      <div className="text-xs text-zinc-500 mt-1">
        {obj?.timestamp ? new Date(obj.timestamp).toLocaleTimeString() : ""}
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen text-zinc-100 bg-zinc-950">
      <header className="max-w-6xl mx-auto px-4 py-6 text-center md:text-left">
        <h1 className="text-3xl font-bold">RedStone Live Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Real-time oracle price feeds (demo) • Deployed on Netlify Functions
        </p>
        {err && <div className="text-red-400 mt-2">Error: {err}</div>}
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
        {/* Controls */}
        <section className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            className="w-full md:w-96 rounded-xl bg-zinc-900 px-4 py-3 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
            placeholder="BTC,ETH,SOL,AR"
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
          />
          <button
            onClick={() => { loadPrices(); loadHistory(firstSymbol); }}
            className="rounded-xl px-4 py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[.98] transition"
          >
            Refresh
          </button>
          <div className="text-sm text-zinc-400">Last update: {lastUpdated}</div>
        </section>

        {/* Price cards */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.length ? cards : (
            <div className="text-sm text-zinc-400">Waiting for live prices…</div>
          )}
        </section>

        {/* 24h chart */}
        <section className="rounded-2xl p-4 bg-zinc-900/80 ring-1 ring-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">24h Trend • {firstSymbol}</h2>
            <div className="text-xs text-zinc-400">Data: RedStone</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  minTickGap={32}
                  tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip
                  formatter={(v) => fmt(Number(v))}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Line type="monotone" dataKey="value" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Tip: change the first symbol to switch the chart. Auto refresh: 10s.
          </div>
        </section>
      </main>
    </div>
  );
}
