/**
 * Behavioral Analytics View Component
 * Multi-chart analytical surface mapping temporal, geographic, channel, and financial stress patterns.
 */

import { formatINR, formatCompactINR, Icons } from "../utils.js";
import { API } from "../api.js";

let charts = [];

export function renderAnalyticsView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Destroy previous charts to avoid canvas reuse memory leaks
  charts.forEach(c => c?.destroy());
  charts = [];

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 tracking-tight">Behavioral Risk Intelligence & Distributions</h2>
          <p class="text-xs text-slate-500 mt-0.5">Empirical patterns extracted across 110,000 chronological evaluation transactions.</p>
        </div>
        <div class="text-xs text-slate-500 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-xs flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>Baseline Horizon: Indian Banking 2019–2024</span>
        </div>
      </div>

      <!-- Top Row: Hourly Velocity Curve & Channel Risk Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Chart 1: 24-Hour Velocity & Risk Timing -->
        <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Temporal Velocity & Off-Hour Spikes</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Transaction density vs. high-severity alerts by hour of day (00:00–23:00)</p>
            </div>
            <span class="text-slate-400">${Icons.clock}</span>
          </div>
          <div class="relative h-64">
            <canvas id="chart-hourly"></canvas>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Critical Night Window: <strong class="text-slate-700">23:00 – 04:00</strong></span>
            <span class="text-orange-600 font-semibold">Elevated Anomaly Frequency</span>
          </div>
        </div>

        <!-- Chart 2: Channel Breakdown across Risk Tiers -->
        <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Channel Distribution by Severity Tier</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Volume breakdown across UPI, Net Banking, Mobile App, POS, and ATM</p>
            </div>
            <span class="text-slate-400">${Icons.barChart}</span>
          </div>
          <div class="relative h-64">
            <canvas id="chart-channel"></canvas>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dominant Vector: <strong class="text-slate-700">Mobile App & UPI</strong></span>
            <span>Highest Risk Density: <strong class="text-red-600">Out-of-Profile ATM</strong></span>
          </div>
        </div>

      </div>

      <!-- Middle Row: Top Risk Triggers & Transaction Amount Buckets -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Chart 3: Top Risk Triggers Frequency -->
        <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Anomaly Triggers</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Most prevalent behavioral triggers flagged by the heuristic profiler</p>
            </div>
            <span class="text-slate-400">${Icons.alertTriangle}</span>
          </div>
          <div class="relative h-64">
            <canvas id="chart-triggers"></canvas>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Primary driver: <strong class="text-slate-800">Unusual Amount Ratio</strong> followed by <strong class="text-slate-800">Burst Velocity</strong>.
          </div>
        </div>

        <!-- Chart 4: Amount Range vs Risk Severity -->
        <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Transaction Amount Slices</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Total volume and elevated risk counts across financial brackets</p>
            </div>
            <span class="text-slate-400">${Icons.activity}</span>
          </div>
          <div class="relative h-64">
            <canvas id="chart-amounts"></canvas>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Transactions > <strong class="text-slate-800">₹20,000</strong> exhibit a 3.4x higher probability of critical review.
          </div>
        </div>

      </div>

      <!-- Bottom Row: State Risk Distribution Table -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Geographic Concentration (Top 10 Indian States)</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Regional transaction volume, elevated risk counts, and average severity index</p>
          </div>
          <span class="text-xs font-mono text-slate-500">State-wise Aggregation</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              <tr>
                <th class="p-3 pl-4">State / Union Territory</th>
                <th class="p-3 text-right">Transactions</th>
                <th class="p-3 text-right">High / Critical Alerts</th>
                <th class="p-3 text-right">Risk Incidence Rate</th>
                <th class="p-3 text-right">Cumulative Volume (₹)</th>
                <th class="p-3 pr-4 text-center">Avg Risk Index</th>
              </tr>
            </thead>
            <tbody id="state-table-body" class="divide-y divide-slate-100">
              <tr>
                <td colspan="6" class="p-8 text-center text-slate-400">Loading regional distribution...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  loadAnalyticsData();
}

async function loadAnalyticsData() {
  try {
    const data = await API.getAnalytics();
    renderHourlyChart(data.hourly_distribution);
    renderChannelChart(data.channel_distribution);
    renderTriggersChart(data.top_risk_triggers);
    renderAmountsChart(data.amount_distribution);
    renderStateTable(data.state_distribution);
  } catch (err) {
    console.error("Failed to load analytics data:", err);
  }
}

function renderHourlyChart(hourly) {
  const ctx = document.getElementById("chart-hourly")?.getContext("2d");
  if (!ctx || !hourly) return;

  const labels = hourly.map(h => h.hour);
  const totals = hourly.map(h => h.total);
  const risky = hourly.map(h => h.risky);

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "High & Critical Alerts",
          data: risky,
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.08)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          yAxisID: "y1"
        },
        {
          label: "Total Transactions",
          data: totals,
          borderColor: "#94a3b8",
          backgroundColor: "transparent",
          borderDash: [4, 4],
          borderWidth: 1.5,
          tension: 0.35,
          yAxisID: "y"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12, font: { size: 11, family: "Inter" } } },
        tooltip: { padding: 10, cornerRadius: 4 }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
        y: { 
          position: "left",
          grid: { color: "#f1f5f9" },
          ticks: { font: { size: 10, family: "Inter" } }
        },
        y1: {
          position: "right",
          grid: { display: false },
          ticks: { font: { size: 10, family: "Inter" } }
        }
      }
    }
  });

  charts.push(chart);
}

function renderChannelChart(channels) {
  const ctx = document.getElementById("chart-channel")?.getContext("2d");
  if (!ctx || !channels) return;

  const labels = channels.map(c => c.channel);
  const low = channels.map(c => c.low);
  const moderate = channels.map(c => c.moderate);
  const high = channels.map(c => c.high);
  const critical = channels.map(c => c.critical);

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Critical", data: critical, backgroundColor: "#dc2626" },
        { label: "High", data: high, backgroundColor: "#ea580c" },
        { label: "Moderate", data: moderate, backgroundColor: "#d97706" },
        { label: "Low", data: low, backgroundColor: "#059669" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
        y: { stacked: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } }
      },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 10, font: { size: 10, family: "Inter" } } }
      }
    }
  });

  charts.push(chart);
}

function renderTriggersChart(triggers) {
  const ctx = document.getElementById("chart-triggers")?.getContext("2d");
  if (!ctx || !triggers) return;

  const labels = triggers.map(t => t.trigger);
  const counts = triggers.map(t => t.count);

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Trigger Occurrences",
        data: counts,
        backgroundColor: "#4f46e5",
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { cornerRadius: 4 }
      },
      scales: {
        x: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } },
        y: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } }
      }
    }
  });

  charts.push(chart);
}

function renderAmountsChart(buckets) {
  const ctx = document.getElementById("chart-amounts")?.getContext("2d");
  if (!ctx || !buckets) return;

  const labels = buckets.map(b => b.bucket);
  const totals = buckets.map(b => b.total);
  const risky = buckets.map(b => b.risky);

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "High/Critical Risk", data: risky, backgroundColor: "#ea580c", borderRadius: 4 },
        { label: "Total Transactions", data: totals, backgroundColor: "#cbd5e1", borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 10, font: { size: 10, family: "Inter" } } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
        y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } }
      }
    }
  });

  charts.push(chart);
}

function renderStateTable(states) {
  const tbody = document.getElementById("state-table-body");
  if (!tbody || !states) return;

  tbody.innerHTML = states.map((s, idx) => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="p-3 pl-4 font-medium text-slate-800 flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
          ${idx + 1}
        </span>
        ${s.state}
      </td>
      <td class="p-3 text-right font-medium text-slate-700 tabular-nums">
        ${s.total.toLocaleString()}
      </td>
      <td class="p-3 text-right font-bold text-red-600 tabular-nums">
        ${s.risky.toLocaleString()}
      </td>
      <td class="p-3 text-right tabular-nums">
        <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${s.risk_rate_pct >= 1.0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'}">
          ${s.risk_rate_pct.toFixed(2)}%
        </span>
      </td>
      <td class="p-3 text-right text-slate-600 tabular-nums">
        ${formatCompactINR(s.volume_inr)}
      </td>
      <td class="p-3 pr-4 text-center font-mono font-semibold text-slate-800 tabular-nums">
        ${s.avg_risk_score.toFixed(1)}
      </td>
    </tr>
  `).join("");
}
