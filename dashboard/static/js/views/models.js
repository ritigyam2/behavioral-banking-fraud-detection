/**
 * Model Benchmarks & Validation View Component
 * Evaluates Decision Tree, Random Forest, Logistic Regression, and Naive Bayes
 * displays multiclass confusion matrices, feature importances, and leakage audit controls.
 */

import { Icons } from "../utils.js";
import { API } from "../api.js";

let featureChart = null;

export function renderModelsView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (featureChart) {
    featureChart.destroy();
    featureChart = null;
  }

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- View Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 tracking-tight">Machine Learning Model Validation & Comparison</h2>
          <p class="text-xs text-slate-500 mt-0.5">Empirical benchmarks trained on 440,000 transactions and evaluated on 110,000 unseen future transactions.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            ${Icons.checkCircle} Chronological Split Verified
          </span>
        </div>
      </div>

      <!-- Comparative Scorecard Table -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Multiclass Model Scorecard</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Macro F1 is the primary selection metric due to extreme class imbalance</p>
          </div>
          <span class="text-xs font-mono text-slate-500">Test Set N=110,000</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              <tr>
                <th class="p-3 pl-4">Model Architecture</th>
                <th class="p-3 text-right">Accuracy</th>
                <th class="p-3 text-right">Macro Precision</th>
                <th class="p-3 text-right">Macro Recall</th>
                <th class="p-3 text-right">Macro F1 (Primary)</th>
                <th class="p-3 text-right">Weighted F1</th>
                <th class="p-3 pr-4 text-right">Macro ROC-AUC</th>
              </tr>
            </thead>
            <tbody id="models-scorecard-body" class="divide-y divide-slate-100">
              <tr>
                <td colspan="7" class="p-8 text-center text-slate-400">Loading benchmark scorecard...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Interactive Confusion Matrix & Model Inspector -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Left: Model Confusion Matrix -->
        <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Multiclass Confusion Matrix</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">Select a model to inspect class-by-class triage accuracy</p>
              </div>
              <select id="model-matrix-select" class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none">
                <option value="decision_tree" selected>Decision Tree (Winner)</option>
                <option value="random_forest">Random Forest</option>
                <option value="logistic_regression">Logistic Regression</option>
                <option value="naive_bayes">Naive Bayes</option>
              </select>
            </div>

            <!-- Matrix Container -->
            <div id="confusion-matrix-container" class="mt-2">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Key Insight: Decision Tree accurately isolates Low vs Moderate risk based on behavioral anomaly thresholds.
          </div>
        </div>

        <!-- Right: Top 20 Predictive Features Bar Chart -->
        <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Predictive Feature Importances</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Gini feature importance ranking across behavioral predictors</p>
            </div>
            <span class="text-slate-400">${Icons.cpu}</span>
          </div>

          <div class="relative h-72">
            <canvas id="chart-feature-importance"></canvas>
          </div>

          <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Clean 63-feature pipeline excludes raw timestamp text, preventing 400,000-column OHE expansion.
          </div>
        </div>

      </div>

      <!-- Leakage Prevention Audit Card -->
      <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div class="flex items-start gap-4">
          <div class="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
            ${Icons.shield}
          </div>
          <div class="space-y-2 text-xs">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Zero Target Leakage Compliance Audit</h3>
            <p class="text-slate-600 leading-relaxed">
              In accordance with financial risk modeling governance, ground-truth label fields (<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">is_fraud</code>, <code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">risk_score</code>, <code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">risk_level</code>, and <code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">risk_reasons</code>) are strictly excluded from the predictor matrix <strong class="text-slate-800 font-mono">X</strong>. 
              The classifiers evaluate solely on pre-transaction behavioral signals, velocity counters, and historical customer baseline deviations.
            </p>
            <div class="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span class="font-medium text-slate-700">Chronological Split:</span>
              <span>440K Train (2019–2022)</span>
              <span>•</span>
              <span>110K Test (2022–2024)</span>
              <span>•</span>
              <span class="text-emerald-700 font-semibold">Strict Out-of-Time Validation</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  loadModelsData();
}

async function loadModelsData() {
  try {
    const data = await API.getModels();
    renderScorecard(data.models);
    renderMatrix(data.models, "decision_tree");
    renderFeatureChart(data.top_features);

    // Attach selector listener
    const select = document.getElementById("model-matrix-select");
    select?.addEventListener("change", () => {
      renderMatrix(data.models, select.value);
    });
  } catch (err) {
    console.error("Failed to load model benchmarks:", err);
  }
}

function renderScorecard(models) {
  const tbody = document.getElementById("models-scorecard-body");
  if (!tbody || !models) return;

  tbody.innerHTML = models.map((m, idx) => {
    const isWinner = m.id === "decision_tree";
    return `
      <tr class="hover:bg-slate-50 transition-colors ${isWinner ? 'bg-indigo-50/30' : ''}">
        <td class="p-3 pl-4 whitespace-nowrap">
          <div class="font-bold text-slate-900 flex items-center gap-2">
            ${m.name}
            ${isWinner ? `<span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">Selected Best</span>` : ''}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${m.hyperparameters}</div>
        </td>
        <td class="p-3 text-right font-medium text-slate-800 tabular-nums">${(m.accuracy * 100).toFixed(2)}%</td>
        <td class="p-3 text-right text-slate-700 tabular-nums">${(m.macro_precision * 100).toFixed(2)}%</td>
        <td class="p-3 text-right text-slate-700 tabular-nums">${(m.macro_recall * 100).toFixed(2)}%</td>
        <td class="p-3 text-right font-extrabold ${isWinner ? 'text-indigo-600' : 'text-slate-900'} tabular-nums">
          ${m.macro_f1.toFixed(4)}
        </td>
        <td class="p-3 text-right text-slate-700 tabular-nums">${(m.weighted_f1 * 100).toFixed(2)}%</td>
        <td class="p-3 pr-4 text-right font-semibold text-slate-800 tabular-nums">${(m.macro_roc_auc * 100).toFixed(2)}%</td>
      </tr>
    `;
  }).join("");
}

function renderMatrix(models, modelId) {
  const container = document.getElementById("confusion-matrix-container");
  if (!container || !models) return;

  const model = models.find(m => m.id === modelId) || models[0];
  const matrix = model.confusion_matrix || [];

  const headers = ["Low", "Moderate", "High", "Critical"];

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-center border-collapse">
        <thead>
          <tr class="text-[10px] text-slate-400 font-semibold uppercase">
            <th class="p-2 text-left">Actual \\ Predicted</th>
            ${headers.map(h => `<th class="p-2 border border-slate-200 bg-slate-50">${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          ${matrix.map(row => {
            const vals = [row.pred_low, row.pred_mod, row.pred_high, row.pred_crit];
            const maxVal = Math.max(...vals);
            return `
              <tr>
                <td class="p-2 font-semibold text-slate-700 text-left border border-slate-200 bg-slate-50/60 whitespace-nowrap">
                  ${row.actual}
                </td>
                ${vals.map((v, i) => {
                  const isDiagonal = (row.actual.startsWith(headers[i]));
                  const bgClass = isDiagonal && v > 0 
                    ? (v > 1000 ? 'bg-emerald-100 font-bold text-emerald-900' : 'bg-emerald-50 text-emerald-800')
                    : (v > 0 ? 'bg-red-50 text-red-900' : 'text-slate-400');
                  return `
                    <td class="p-2.5 border border-slate-200 tabular-nums ${bgClass}">
                      ${v.toLocaleString()}
                    </td>
                  `;
                }).join("")}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>

    <!-- Class-wise Report Summary -->
    <div class="mt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
      ${Object.entries(model.class_report || {}).map(([cName, stats]) => `
        <div class="p-2 rounded border border-slate-100 bg-slate-50">
          <div class="font-bold text-slate-800">${cName.replace(' Risk', '')}</div>
          <div class="text-[10px] text-slate-500 mt-1">F1: <strong class="text-slate-900">${stats.f1.toFixed(3)}</strong></div>
          <div class="text-[10px] text-slate-500">Rec: <strong class="text-slate-900">${(stats.recall*100).toFixed(0)}%</strong></div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderFeatureChart(features) {
  const ctx = document.getElementById("chart-feature-importance")?.getContext("2d");
  if (!ctx || !features) return;

  const top12 = features.slice(0, 10);
  const labels = top12.map(f => f.name.replace(/_/g, " ").replace("numeric ", ""));
  const vals = top12.map(f => f.importance);

  featureChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Feature Importance",
        data: vals,
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
        tooltip: {
          callbacks: {
            label: (ctx) => `Importance: ${(ctx.raw * 100).toFixed(2)}%`
          }
        }
      },
      scales: {
        x: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } },
        y: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } }
      }
    }
  });
}
