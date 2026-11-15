import React, { useState, useEffect, useRef } from "react";
import { formatCompactINR, Icons } from "../utils";
import { API } from "../api";
import Chart from "chart.js/auto";

export function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hourlyRef = useRef(null);
  const channelRef = useRef(null);
  const triggersRef = useRef(null);
  const amountsRef = useRef(null);

  const chartsInstancesRef = useRef([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    API.getAnalytics()
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize charts when data is available
  useEffect(() => {
    if (!data) return;

    // Destroy existing chart instances
    chartsInstancesRef.current.forEach((c) => c?.destroy());
    chartsInstancesRef.current = [];

    // Chart 1: Hourly Velocity & Risk Timing
    if (hourlyRef.current && data.hourly_distribution) {
      const labels = data.hourly_distribution.map((h) => h.hour);
      const totals = data.hourly_distribution.map((h) => h.total);
      const risky = data.hourly_distribution.map((h) => h.risky);

      const chart1 = new Chart(hourlyRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "High & Critical Alerts",
              data: risky,
              borderColor: "#dc2626",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              fill: true,
              tension: 0.35,
              borderWidth: 2,
              yAxisID: "y1",
            },
            {
              label: "Total Transactions",
              data: totals,
              borderColor: "#94a3b8",
              backgroundColor: "transparent",
              borderDash: [4, 4],
              borderWidth: 1.5,
              tension: 0.35,
              yAxisID: "y",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "top", labels: { boxWidth: 12, font: { size: 11, family: "Inter" } } },
            tooltip: { padding: 10, cornerRadius: 4 },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
            y: {
              position: "left",
              grid: { color: "#f1f5f9" },
              ticks: { font: { size: 10, family: "Inter" } },
            },
            y1: {
              position: "right",
              grid: { display: false },
              ticks: { font: { size: 10, family: "Inter" } },
            },
          },
        },
      });
      chartsInstancesRef.current.push(chart1);
    }

    // Chart 2: Channel Breakdown
    if (channelRef.current && data.channel_distribution) {
      const labels = data.channel_distribution.map((c) => c.channel);
      const low = data.channel_distribution.map((c) => c.low);
      const moderate = data.channel_distribution.map((c) => c.moderate);
      const high = data.channel_distribution.map((c) => c.high);
      const critical = data.channel_distribution.map((c) => c.critical);

      const chart2 = new Chart(channelRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Critical", data: critical, backgroundColor: "#dc2626" },
            { label: "High", data: high, backgroundColor: "#ea580c" },
            { label: "Moderate", data: moderate, backgroundColor: "#d97706" },
            { label: "Low", data: low, backgroundColor: "#059669" },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
            y: { stacked: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } },
          },
          plugins: {
            legend: { position: "top", labels: { boxWidth: 10, font: { size: 10, family: "Inter" } } },
          },
        },
      });
      chartsInstancesRef.current.push(chart2);
    }

    // Chart 3: Top Triggers
    if (triggersRef.current && data.top_risk_triggers) {
      const labels = data.top_risk_triggers.map((t) => t.trigger);
      const counts = data.top_risk_triggers.map((t) => t.count);

      const chart3 = new Chart(triggersRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Trigger Occurrences",
              data: counts,
              backgroundColor: "#4f46e5",
              borderRadius: 4,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { cornerRadius: 4 },
          },
          scales: {
            x: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } },
            y: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
          },
        },
      });
      chartsInstancesRef.current.push(chart3);
    }

    // Chart 4: Amounts Slices
    if (amountsRef.current && data.amount_distribution) {
      const labels = data.amount_distribution.map((b) => b.bucket);
      const totals = data.amount_distribution.map((b) => b.total);
      const risky = data.amount_distribution.map((b) => b.risky);

      const chart4 = new Chart(amountsRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "High/Critical Risk", data: risky, backgroundColor: "#ea580c", borderRadius: 4 },
            { label: "Total Transactions", data: totals, backgroundColor: "#cbd5e1", borderRadius: 4 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { boxWidth: 10, font: { size: 10, family: "Inter" } } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
            y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } },
          },
        },
      });
      chartsInstancesRef.current.push(chart4);
    }

    return () => {
      chartsInstancesRef.current.forEach((c) => c?.destroy());
      chartsInstancesRef.current = [];
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Behavioral Risk Intelligence & Distributions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical patterns extracted across 110,000 chronological evaluation transactions.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>Baseline Horizon: Indian Banking 2019–2024</span>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400">Loading behavioral analytics distributions...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 font-medium">Failed to load analytics: {error}</div>
      ) : (
        <>
          {/* Top Row: Hourly Velocity Curve & Channel Risk Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1 */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Temporal Velocity & Off-Hour Spikes
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Transaction density vs. high-severity alerts by hour of day (00:00–23:00)
                  </p>
                </div>
                <span className="text-slate-400">{Icons.clock}</span>
              </div>
              <div className="relative h-64">
                <canvas ref={hourlyRef}></canvas>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Critical Night Window: <strong className="text-slate-700">23:00 – 04:00</strong>
                </span>
                <span className="text-orange-600 font-semibold">Elevated Anomaly Frequency</span>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Channel Distribution by Severity Tier
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Volume breakdown across UPI, Net Banking, Mobile App, POS, and ATM
                  </p>
                </div>
                <span className="text-slate-400">{Icons.barChart}</span>
              </div>
              <div className="relative h-64">
                <canvas ref={channelRef}></canvas>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Dominant Vector: <strong className="text-slate-700">Mobile App & UPI</strong>
                </span>
                <span>
                  Highest Risk Density: <strong className="text-red-600">Out-of-Profile ATM</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: Top Risk Triggers & Transaction Amount Buckets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3 */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Top Anomaly Triggers
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Most prevalent behavioral triggers flagged by the heuristic profiler
                  </p>
                </div>
                <span className="text-slate-400">{Icons.alertTriangle}</span>
              </div>
              <div className="relative h-64">
                <canvas ref={triggersRef}></canvas>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Primary driver: <strong className="text-slate-800">Unusual Amount Ratio</strong> followed by{" "}
                <strong className="text-slate-800">Burst Velocity</strong>.
              </div>
            </div>

            {/* Chart 4 */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Transaction Amount Slices
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Total volume and elevated risk counts across financial brackets
                  </p>
                </div>
                <span className="text-slate-400">{Icons.activity}</span>
              </div>
              <div className="relative h-64">
                <canvas ref={amountsRef}></canvas>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Transactions &gt; <strong className="text-slate-800">₹20,000</strong> exhibit a 3.4x higher
                probability of critical review.
              </div>
            </div>
          </div>

          {/* Bottom Row: State Risk Distribution Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Geographic Concentration (Top 10 Indian States)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Regional transaction volume, elevated risk counts, and average severity index
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">State-wise Aggregation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">State / Union Territory</th>
                    <th className="p-3 text-right">Transactions</th>
                    <th className="p-3 text-right">High / Critical Alerts</th>
                    <th className="p-3 text-right">Risk Incidence Rate</th>
                    <th className="p-3 text-right">Cumulative Volume (₹)</th>
                    <th className="p-3 pr-4 text-center">Avg Risk Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.state_distribution?.map((s, idx) => (
                    <tr key={s.state} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 pl-4 font-medium text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        {s.state}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700 tabular-nums">
                        {s.total.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-red-600 tabular-nums">
                        {s.risky.toLocaleString()}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            s.risk_rate_pct >= 1.0
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {s.risk_rate_pct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-600 tabular-nums">
                        {formatCompactINR(s.volume_inr)}
                      </td>
                      <td className="p-3 pr-4 text-center font-mono font-semibold text-slate-800 tabular-nums">
                        {s.avg_risk_score.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
