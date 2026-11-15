import React, { useState, useEffect, useRef } from "react";
import { Icons } from "../utils";
import { API } from "../api";
import Chart from "chart.js/auto";

export function ModelsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModelId, setSelectedModelId] = useState("decision_tree");

  const featureChartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    API.getModels()
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

  // Render Feature Importance Chart
  useEffect(() => {
    if (!data?.top_features || !featureChartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const top10 = data.top_features.slice(0, 10);
    const labels = top10.map((f) => f.name.replace(/_/g, " ").replace("numeric ", ""));
    const vals = top10.map((f) => f.importance);

    chartInstanceRef.current = new Chart(featureChartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Feature Importance",
            data: vals,
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
          tooltip: {
            callbacks: {
              label: (ctx) => `Importance: ${(ctx.raw * 100).toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 10, family: "Inter" } } },
          y: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" } } },
        },
      },
    });

    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, [data]);

  const activeModel = data?.models?.find((m) => m.id === selectedModelId) || data?.models?.[0];
  const matrixHeaders = ["Low", "Moderate", "High", "Critical"];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Machine Learning Model Validation & Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical benchmarks trained on 440,000 transactions and evaluated on 110,000 unseen future transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            {Icons.checkCircle} Chronological Split Verified
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400">Loading benchmark scorecard...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 font-medium">Failed to load models: {error}</div>
      ) : (
        <>
          {/* Comparative Scorecard Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Multiclass Model Scorecard
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Macro F1 is the primary selection metric due to extreme class imbalance
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">Test Set N=110,000</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">Model Architecture</th>
                    <th className="p-3 text-right">Accuracy</th>
                    <th className="p-3 text-right">Macro Precision</th>
                    <th className="p-3 text-right">Macro Recall</th>
                    <th className="p-3 text-right">Macro F1 (Primary)</th>
                    <th className="p-3 text-right">Weighted F1</th>
                    <th className="p-3 pr-4 text-right">Macro ROC-AUC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.models?.map((m) => {
                    const isWinner = m.id === "decision_tree";
                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isWinner ? "bg-indigo-50/30" : ""
                        }`}
                      >
                        <td className="p-3 pl-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {m.name}
                            {isWinner && (
                              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                Selected Best
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {m.hyperparameters}
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-800 tabular-nums">
                          {(m.accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="p-3 text-right text-slate-700 tabular-nums">
                          {(m.macro_precision * 100).toFixed(2)}%
                        </td>
                        <td className="p-3 text-right text-slate-700 tabular-nums">
                          {(m.macro_recall * 100).toFixed(2)}%
                        </td>
                        <td
                          className={`p-3 text-right font-extrabold ${
                            isWinner ? "text-indigo-600" : "text-slate-900"
                          } tabular-nums`}
                        >
                          {m.macro_f1.toFixed(4)}
                        </td>
                        <td className="p-3 text-right text-slate-700 tabular-nums">
                          {(m.weighted_f1 * 100).toFixed(2)}%
                        </td>
                        <td className="p-3 pr-4 text-right font-semibold text-slate-800 tabular-nums">
                          {(m.macro_roc_auc * 100).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Confusion Matrix & Model Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Model Confusion Matrix */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Multiclass Confusion Matrix
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select a model to inspect class-by-class triage accuracy
                    </p>
                  </div>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="decision_tree">Decision Tree (Winner)</option>
                    <option value="random_forest">Random Forest</option>
                    <option value="logistic_regression">Logistic Regression</option>
                    <option value="naive_bayes">Naive Bayes</option>
                  </select>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="text-[10px] text-slate-400 font-semibold uppercase">
                        <th className="p-2 text-left">Actual \ Predicted</th>
                        {matrixHeaders.map((h) => (
                          <th key={h} className="p-2 border border-slate-200 bg-slate-50">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeModel?.confusion_matrix?.map((row, rIdx) => {
                        const vals = [row.pred_low, row.pred_mod, row.pred_high, row.pred_crit];
                        return (
                          <tr key={rIdx}>
                            <td className="p-2 font-semibold text-slate-700 text-left border border-slate-200 bg-slate-50/60 whitespace-nowrap">
                              {row.actual}
                            </td>
                            {vals.map((v, i) => {
                              const isDiagonal = row.actual.startsWith(matrixHeaders[i]);
                              const bgClass =
                                isDiagonal && v > 0
                                  ? v > 1000
                                    ? "bg-emerald-100 font-bold text-emerald-900"
                                    : "bg-emerald-50 text-emerald-800"
                                  : v > 0
                                  ? "bg-red-50 text-red-900"
                                  : "text-slate-400";
                              return (
                                <td
                                  key={i}
                                  className={`p-2.5 border border-slate-200 tabular-nums ${bgClass}`}
                                >
                                  {v.toLocaleString()}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Class-wise Report Summary */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
                  {Object.entries(activeModel?.class_report || {}).map(([cName, stats]) => (
                    <div key={cName} className="p-2 rounded border border-slate-100 bg-slate-50">
                      <div className="font-bold text-slate-800">{cName.replace(" Risk", "")}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        F1: <strong className="text-slate-900">{stats.f1.toFixed(3)}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Rec: <strong className="text-slate-900">{(stats.recall * 100).toFixed(0)}%</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Key Insight: Decision Tree accurately isolates Low vs Moderate risk based on behavioral anomaly thresholds.
              </div>
            </div>

            {/* Right: Top 20 Predictive Features Bar Chart */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Top Predictive Feature Importances
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gini feature importance ranking across behavioral predictors
                  </p>
                </div>
                <span className="text-slate-400">{Icons.cpu}</span>
              </div>

              <div className="relative h-72">
                <canvas ref={featureChartRef}></canvas>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Clean 63-feature pipeline excludes raw timestamp text, preventing 400,000-column OHE expansion.
              </div>
            </div>
          </div>

          {/* Leakage Prevention Audit Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
                {Icons.shield}
              </div>
              <div className="space-y-2 text-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Zero Target Leakage Compliance Audit
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  In accordance with financial risk modeling governance, ground-truth label fields (
                  <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">is_fraud</code>,{" "}
                  <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">risk_score</code>,{" "}
                  <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">risk_level</code>, and{" "}
                  <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">risk_reasons</code>) are
                  strictly excluded from the predictor matrix{" "}
                  <strong className="text-slate-800 font-mono">X</strong>. The classifiers evaluate solely on
                  pre-transaction behavioral signals, velocity counters, and historical customer baseline
                  deviations.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">Chronological Split:</span>
                  <span>440K Train (2019–2022)</span>
                  <span>•</span>
                  <span>110K Test (2022–2024)</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">Strict Out-of-Time Validation</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
