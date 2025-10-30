import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const DEFAULT_SYMBOLS = "BTC,ETH,SOL,AR";

async function jget(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

function fmt(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(n);
}

export default function App() {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [prices, setPrices] = useState({ data: {}, at: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const firstSymbol = useMemo(
    () => symbols.split(",")[0]?.trim().toUpperCase() || "BTC",
    [symbols]
  );

  async function loadPrices() {
    try {
      setErr("");
      const r = await jget(
        `/.netlify/functions/prices?symbols=${encodeURIComponent(symbols)}`
      );
      setPrices(r);
    } catch (e) {
      setErr(e.message || "Failed to load prices");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(sym) {
    try {
      const r = await jget(
        `/.netlify/functions/historical?symbol=${encodeURIComponent(sym)}&range=24h`
      );
      setHistory(r.data || []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadPrices();
    loadHistory(firstSymbol);
    const t = setInterval(loadPrices, 10000); // refresh every 10s
    return () => clearInterval(t);
  }, [symbols]);

  const lastUpdated =
    prices.at ? new Date(prices.at).toLocaleString() : "—";

  const cards = Object.entries(prices.data || {}).map(([sym, obj]) => (
    <div key={sym} className="rounded-2xl p-4 bg-zinc-900/80 ring-1 ring-zinc-800 shadow">
      <div className="text-xs text-zinc-400">USD • RedStone</div>
      <div className="mt-1 text-2xl font-semibold tracking-wide">
        {sym}
        <span className="text-zinc-400 text-base ml-2">{fmt(obj.value)}</span>
      </div>
      <div className="text-xs text-zinc-500 mt-1">
        {obj.timestamp ? new Date(obj.timestamp).toLocaleTimeString() : ""}
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen text-zinc-100 bg-zinc-950">
      <header className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">RedStone Live Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Real-time oracle price feeds (demo) • Deployed on Netlify Functions
        </p>
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
            onClick={loadPrices}
            className="rounded-xl px-4 py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[.98] transition"
          >
            Refresh
          </button>
          <div className="text-sm text-zinc-400">Last update: {lastUpdated}</div>
        </section>

        {/* Price cards */}
        {loading ? (
          <div className="text-sm text-zinc-400">Loading live prices…</div>
        ) : err ? (
          <div className="text-sm text-red-400">Error: {err}</div>
        ) : (
          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards}
          </section>
        )}

        {/* 24h chart */}
        <section className="rounded-2xl p-4 bg-zinc-900/80 ring-1 ring-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">
              24h Trend • {firstSymbol}
            </h2>
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
                  formatter={(v) =>
                    new Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 6,
                    }).format(v)
                  }
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Line type="monotone" dataKey="value" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Tip: change the first symbol in the input to switch the chart.
          </div>
        </section>

        <footer className="text-xs text-zinc-500">
          Community demo • Prices fetched via Netlify Functions that call RedStone REST.
        </footer>
      </main>
    </div>
  );
}
