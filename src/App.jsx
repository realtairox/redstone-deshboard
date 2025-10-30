import React, { useEffect, useState } from "react";
import "./index.css";

async function jget(path) {
  const res = await fetch(`${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

export default function App() {
  const [data, setData] = useState({});
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [trend, setTrend] = useState([]);

  async function load() {
    try {
      setError("");
      const prices = await jget("/.netlify/functions/prices?symbols=BTC,ETH,SOL,AR");
      const hist = await jget("/.netlify/functions/historical?symbol=BTC&range=24h");
      setData(prices.data || {});
      setTrend(hist.data || []);
      setTime(new Date().toLocaleTimeString());
    } catch (err) {
      setError("Network error");
      console.error(err);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", background: "#000", color: "#fff", minHeight: "100vh", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>RedStone Live Dashboard</h1>
      <p style={{ textAlign: "center", opacity: 0.7 }}>
        Real-time oracle price feeds (demo) • Deployed on Netlify Functions
      </p>

      {error && <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>}

      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        {Object.entries(data).map(([sym, info]) => (
          <div key={sym} style={{ background: "#111", padding: 15, borderRadius: 10 }}>
            <h2>
              {sym} <span style={{ color: "#0f0" }}>•</span>
            </h2>
            <p style={{ fontSize: 18 }}>{info.value?.toFixed?.(6)}</p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              {new Date(info.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>24h Trend • BTC</h3>
        <div style={{ border: "1px dashed #444", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {trend.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No data yet...</p>
          ) : (
            <p style={{ opacity: 0.6 }}>Chart updates every 10s (live)</p>
          )}
        </div>
      </div>

      <p style={{ textAlign: "center", marginTop: 30, opacity: 0.6 }}>
        Last update: {time || "—"} <br />
        Tip: auto refresh every 10s.
      </p>
    </div>
  );
}
