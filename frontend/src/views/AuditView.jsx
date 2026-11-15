import React, { useState, useEffect } from "react";
import { Icons } from "../utils";
import { API } from "../api";
import { Toast } from "../components/Toast";

export function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.getAuditLog(100);
      setLogs(res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Compliance & Forensic Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable regulatory record of all triage dispositions, account blocks, and AML escalations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              Toast.show("Refreshing audit ledger...", "info", 1500);
              loadAuditData();
            }}
            className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {Icons.refresh} Refresh Log
          </button>
        </div>
      </div>

      {/* Audit Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Disposition Event Log
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronologically ordered by audit execution timestamp
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">Audit Storage: SQLite</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 pl-4">Timestamp</th>
                <th className="p-3">Transaction</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Action Type</th>
                <th className="p-3 text-center">Status Transition</th>
                <th className="p-3">Investigating Analyst</th>
                <th className="p-3 pr-4">Forensic Justification / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Loading audit records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-red-600 font-medium">
                    Error loading audit records: {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No triage actions recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l, idx) => {
                  let badgeStyle = "bg-slate-100 text-slate-800";
                  if (l.new_status === "Approved") {
                    badgeStyle = "bg-emerald-50 text-emerald-800 border border-emerald-200";
                  } else if (l.new_status === "Blocked") {
                    badgeStyle = "bg-red-50 text-red-800 border border-red-200";
                  } else if (l.new_status === "Escalated") {
                    badgeStyle = "bg-amber-50 text-amber-800 border border-amber-200";
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 pl-4 font-mono text-slate-500 whitespace-nowrap">
                        {l.timestamp}
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {l.transaction_id}
                      </td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                        {l.customer_id}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                        {l.action}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {l.previous_status} &rarr;{" "}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${badgeStyle}`}>
                          {l.new_status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 whitespace-nowrap font-medium">{l.analyst}</td>
                      <td className="p-3 pr-4 text-slate-600 italic font-serif">
                        {l.notes ? (
                          `"${l.notes}"`
                        ) : (
                          <span className="text-slate-400 not-italic font-sans">
                            No notes recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
