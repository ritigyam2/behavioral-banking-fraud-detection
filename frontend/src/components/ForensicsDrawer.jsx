import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime, RiskBadge, StatusBadge, Icons } from "../utils";
import { API } from "../api";
import { Toast } from "./Toast";

export function ForensicsDrawer({ txnId, isOpen, onClose, onActionSuccess }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !txnId) {
      setData(null);
      setError(null);
      setNotes("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    API.getTransactionDetail(txnId)
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
  }, [isOpen, txnId]);

  const handleCopy = () => {
    if (txnId) {
      navigator.clipboard.writeText(txnId);
      Toast.show(`Copied ${txnId} to clipboard`, "info", 2000);
    }
  };

  const handleAction = async (actionType) => {
    if (!txnId || actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await API.postTransactionAction(txnId, actionType, notes.trim());
      Toast.show(`Transaction ${txnId} marked as ${actionType.toUpperCase()}`, "success");
      setData(updated);
      setNotes("");
      onActionSuccess?.(updated);
    } catch (err) {
      Toast.show(`Failed to update transaction: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const riskScore = Number(data?.risk_score || 0);
  const anomalyScore = Number(data?.behavioral_anomaly_score || 0);
  const amount = Number(data?.transaction_amount || 0);
  const balance = Number(data?.account_balance || 0);
  const priorAvg = Number(data?.customer_avg_amount_prior || 0);
  const priorMedian = Number(data?.customer_median_amount_prior || 0);
  const amountRatio = Number(data?.amount_ratio_prior || 0);
  const balanceUsage = Number(data?.balance_usage_ratio || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900 font-mono">
                  {txnId || "TXN000000000"}
                </h2>
                <button
                  onClick={handleCopy}
                  title="Copy Transaction ID"
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {Icons.copy}
                </button>
                {data && <StatusBadge status={data.triage_status} />}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>{data ? formatDateTime(data.transaction_datetime) : "—"}</span>
                <span>•</span>
                <span className="font-mono text-slate-700 font-medium">
                  {data?.customer_id || "CUST000000"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200/50 transition-colors"
            >
              {Icons.x}
            </button>
          </div>

          {/* Content Body (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading transaction forensics...</div>
            ) : error ? (
              <div className="p-6 text-red-600">Failed to load transaction forensics: {error}</div>
            ) : data ? (
              <>
                {/* Risk Gauge Card */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Risk Severity Assessment
                    </span>
                    <RiskBadge level={data.risk_level} />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                      {riskScore.toFixed(1)}
                      <span className="text-sm font-normal text-slate-400"> / 100</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Behavioral Anomaly Index:{" "}
                      <strong className="text-slate-800">{anomalyScore.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="mt-3 score-meter-track">
                    <div
                      className={`score-meter-fill ${
                        riskScore >= 75
                          ? "bg-red-600"
                          : riskScore >= 55
                          ? "bg-orange-500"
                          : riskScore >= 25
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, riskScore))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Low (0–24)</span>
                    <span>Moderate (25–54)</span>
                    <span>High (55–74)</span>
                    <span>Critical (75–100)</span>
                  </div>
                </div>

                {/* Behavioral Anomalies */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Triggered Behavioral Anomalies
                  </div>
                  {data.triggers_list && data.triggers_list.length > 0 ? (
                    <div className="space-y-2">
                      {data.triggers_list.map((tr, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded border ${
                            tr.severity === "critical"
                              ? "bg-red-50/60 border-red-200 text-red-900"
                              : "bg-amber-50/60 border-amber-200 text-amber-900"
                          } flex items-start gap-2.5`}
                        >
                          <span
                            className={`mt-0.5 ${
                              tr.severity === "critical" ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {Icons.alertTriangle}
                          </span>
                          <div>
                            <div className="font-semibold text-xs leading-tight">{tr.title}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              Automated signal matched against customer baseline historical patterns.
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                      No statistical anomalies triggered. Transaction aligns with customer profile.
                    </div>
                  )}
                </div>

                {/* Financial Baseline Deviations */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Financial Baseline Deviations
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-400">Transaction Amount</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                        {formatINR(amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Available Bal: {formatINR(balance)}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-400">Amount vs Prior Avg</div>
                      <div
                        className={`text-sm font-bold ${
                          amountRatio >= 3.0
                            ? "text-red-600"
                            : amountRatio >= 1.5
                            ? "text-amber-600"
                            : "text-slate-900"
                        } mt-0.5 tabular-nums`}
                      >
                        {amountRatio.toFixed(2)}x
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Customer Avg: {formatINR(priorAvg)}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-400">Balance Drain Ratio</div>
                      <div
                        className={`text-sm font-bold ${
                          balanceUsage >= 0.8
                            ? "text-red-600"
                            : balanceUsage >= 0.5
                            ? "text-amber-600"
                            : "text-slate-900"
                        } mt-0.5 tabular-nums`}
                      >
                        {(balanceUsage * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Single txn account impact
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-400">Historical Median</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                        {formatINR(priorMedian)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Z-Score: {(data.amount_zscore_behavior || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Velocity & Context Profile */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Velocity & Contextual Shifts
                  </div>
                  <div className="p-3 rounded border border-slate-200 bg-white space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Transaction Velocity (Past 1h / 24h / 7d)</span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {data.txn_count_prior_1h || 0} / {data.txn_count_prior_24h || 0} /{" "}
                        {data.txn_count_prior_7d || 0}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Channel Shift</span>
                      <span className="font-medium text-slate-800">
                        {data.channel ? data.channel.replace("_", " ") : "—"}{" "}
                        {data.usual_channel_prior && (
                          <span className="text-slate-400 font-normal">
                            (Usual: {data.usual_channel_prior.replace("_", " ")})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Geographic Location</span>
                      <span className="font-medium text-slate-800">
                        {data.state || "—"}{" "}
                        {data.usual_state_prior && (
                          <span className="text-slate-400 font-normal">
                            (Usual: {data.usual_state_prior})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Customer KYC & Credit Score</span>
                      <span className="font-medium text-slate-800">
                        {data.kyc_status || "Verified"} • Score: {data.credit_score || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Customer History */}
                {data.customer_recent_transactions &&
                  data.customer_recent_transactions.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        Prior Transactions from this Customer
                      </div>
                      <div className="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden bg-white">
                        {data.customer_recent_transactions.map((pt) => (
                          <div
                            key={pt.transaction_id}
                            className="p-2.5 flex items-center justify-between text-[11px] hover:bg-slate-50"
                          >
                            <div>
                              <span className="font-mono text-slate-700 font-medium">
                                {pt.transaction_id}
                              </span>
                              <span className="text-slate-400 ml-2">
                                {formatDateTime(pt.transaction_datetime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 tabular-nums">
                                {formatINR(pt.transaction_amount)}
                              </span>
                              <RiskBadge level={pt.risk_level} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Audit Trail History */}
                {data.audit_history && data.audit_history.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Analyst Audit Ledger
                    </div>
                    <div className="space-y-2">
                      {data.audit_history.map((entry, idx) => (
                        <div key={idx} className="p-2.5 rounded border border-slate-200 bg-slate-50/70">
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                            <span>
                              {entry.action} by {entry.analyst}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {entry.timestamp}
                            </span>
                          </div>
                          {entry.notes && (
                            <div className="text-[11px] text-slate-600 mt-1 italic font-serif">
                              "{entry.notes}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Action Disposition Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Analyst Investigation Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Record forensic rationale, customer contact logs, or AML justification..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={actionLoading || !data}
                onClick={() => handleAction("approve")}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {Icons.check} Approve Txn
              </button>
              <button
                disabled={actionLoading || !data}
                onClick={() => handleAction("escalate")}
                className="w-full py-2 px-3 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {Icons.alertTriangle} Escalate AML
              </button>
              <button
                disabled={actionLoading || !data}
                onClick={() => handleAction("block")}
                className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {Icons.x} Block & Freeze
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
