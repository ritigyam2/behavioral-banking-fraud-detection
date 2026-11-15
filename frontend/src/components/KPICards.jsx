import React from "react";
import { formatCompactINR, Icons } from "../utils";

export function KPICards({ kpis }) {
  const data = kpis || {
    total_transactions: 110000,
    total_volume_inr: 3280366781.36,
    risk_breakdown: {
      Critical: { count: 186, amount: 0 },
      High: { count: 801, amount: 0 },
      Moderate: { count: 7885, amount: 0 },
      Low: { count: 101128, amount: 0 },
    },
    ground_truth_fraud_cases: 987,
    urgent_backlog_cases: 987,
    triage_summary: { pending: 110000, approved: 0, blocked: 0, escalated: 0 },
  };

  const criticalCount = data.risk_breakdown?.Critical?.count || 186;
  const highCount = data.risk_breakdown?.High?.count || 801;
  const modCount = data.risk_breakdown?.Moderate?.count || 7885;
  const total = data.total_transactions || 110000;

  const urgentTotal = criticalCount + highCount;
  const fraudRate = (((data.ground_truth_fraud_cases || 987) / total) * 100).toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Volume Monitored */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <span>Transactions Audited</span>
          <span className="text-slate-400">{Icons.activity}</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {total.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700 tabular-nums">
              {formatCompactINR(data.total_volume_inr)}
            </span>
            <span>cumulative volume</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Evaluation Horizon</span>
          <span className="font-medium text-slate-600">2023–2024</span>
        </div>
      </div>

      {/* Card 2: High & Critical Risk Backlog */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <span>Urgent Triage Queue</span>
          <span className="text-red-500">{Icons.alertTriangle}</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-red-600 tabular-nums">
            {urgentTotal.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-red-700 font-semibold tabular-nums">
              {criticalCount} Critical
            </span>
            <span>•</span>
            <span className="text-orange-700 font-semibold tabular-nums">
              {highCount} High
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Action Required</span>
          <span className="font-semibold text-red-600">Priority 1 Review</span>
        </div>
      </div>

      {/* Card 3: Moderate Risk Queue */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <span>Moderate Risk Alerts</span>
          <span className="text-amber-500">{Icons.sliders}</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-amber-600 tabular-nums">
            {modCount.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700 tabular-nums">
              {((modCount / total) * 100).toFixed(2)}%
            </span>
            <span>of transaction stream</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Action Protocol</span>
          <span className="font-medium text-amber-700">Frictionless 2FA</span>
        </div>
      </div>

      {/* Card 4: Historical Ground Truth Baseline */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <span>Ground Truth Fraud</span>
          <span className="text-indigo-500">{Icons.shield}</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {fraudRate}%
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700 tabular-nums">
              {data.ground_truth_fraud_cases || 987} confirmed
            </span>
            <span>historical fraud cases</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Decoupled Predictor</span>
          <span className="font-medium text-emerald-600">Zero Target Leakage</span>
        </div>
      </div>
    </div>
  );
}
