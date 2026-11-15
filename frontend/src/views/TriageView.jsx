import React, { useState, useEffect, useCallback, useRef } from "react";
import { formatINR, formatDateTime, toTitleCase, RiskBadge, StatusBadge, Icons } from "../utils";
import { KPICards } from "../components/KPICards";
import { API } from "../api";
import { Toast } from "../components/Toast";

export function TriageView({ kpis, onOpenDrawer, refreshKpis, searchTerm }) {
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [severity, setSeverity] = useState("all");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("risk_score");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const debouncedMinMaxRef = useRef({ min: "", max: "" });

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.getTransactions({
        severity,
        channel,
        triage_status: status,
        state,
        search: searchTerm || "",
        min_amount: minAmount,
        max_amount: maxAmount,
        sort_by: sortBy,
        sort_dir: "DESC",
        page,
        limit,
      });

      setTransactions(res.transactions || []);
      setTotalCount(res.total_count || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [severity, channel, status, state, searchTerm, minAmount, maxAmount, sortBy, page, limit]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Reset page to 1 when filters change
  const handleSeverityChange = (sev) => {
    setSeverity(sev);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSeverity("all");
    setChannel("all");
    setStatus("all");
    setState("all");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("risk_score");
    setPage(1);
    setSelectedIds(new Set());
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allPageIds = transactions.map((t) => t.transaction_id);
      setSelectedIds(new Set(allPageIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleRowSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await API.postBulkAction(ids, action, `Bulk triage disposition: ${action}`);
      Toast.show(`Successfully marked ${ids.length} transactions as ${action.toUpperCase()}`, "success");
      setSelectedIds(new Set());
      loadTransactions();
      refreshKpis?.();
    } catch (err) {
      Toast.show(`Bulk action failed: ${err.message}`, "error");
    }
  };

  const allSelected =
    transactions.length > 0 &&
    transactions.every((t) => selectedIds.has(t.transaction_id));

  // Compute pagination bounds
  const startRec = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endRec = Math.min(totalCount, page * limit);

  // Pagination window
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  const pageNumbers = [];
  for (let p = startPage; p <= endPage; p++) {
    pageNumbers.push(p);
  }

  return (
    <div className="space-y-4">
      {/* Top Operational Metrics Bar */}
      <KPICards kpis={kpis} />

      {/* Filters & Action Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        {/* Severity Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleSeverityChange("all")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                severity === "all"
                  ? "font-semibold bg-slate-800 text-white shadow-xs"
                  : "font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Risk Tiers
            </button>
            <button
              onClick={() => handleSeverityChange("Critical")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                severity === "Critical"
                  ? "font-semibold bg-slate-800 text-white shadow-xs"
                  : "font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block mr-1"></span>
              Critical (186)
            </button>
            <button
              onClick={() => handleSeverityChange("High")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                severity === "High"
                  ? "font-semibold bg-slate-800 text-white shadow-xs"
                  : "font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-600 inline-block mr-1"></span>
              High (801)
            </button>
            <button
              onClick={() => handleSeverityChange("Moderate")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                severity === "Moderate"
                  ? "font-semibold bg-slate-800 text-white shadow-xs"
                  : "font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block mr-1"></span>
              Moderate (7,885)
            </button>
            <button
              onClick={() => handleSeverityChange("Low")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                severity === "Low"
                  ? "font-semibold bg-slate-800 text-white shadow-xs"
                  : "font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block mr-1"></span>
              Low (101K)
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                Toast.show("Refreshing transaction queue...", "info", 1500);
                loadTransactions();
              }}
              className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {Icons.refresh} Refresh
            </button>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Channel */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Channels</option>
              <option value="Mobile_App">Mobile App</option>
              <option value="Net_Banking">Net Banking</option>
              <option value="POS_Terminal">POS Terminal</option>
              <option value="ATM">ATM Withdrawal</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Escalated">Escalated</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              State
            </label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All States</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Telangana">Telangana</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Delhi">Delhi</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="West Bengal">West Bengal</option>
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Min Amount (₹)
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setPage(1);
              }}
              placeholder="Min ₹"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Max Amount (₹)
            </label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setPage(1);
              }}
              placeholder="Max ₹"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sort Column */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="risk_score">Risk Score (High to Low)</option>
              <option value="transaction_amount">Amount (High to Low)</option>
              <option value="transaction_datetime">Time (Newest First)</option>
              <option value="behavioral_anomaly_score">Anomaly Score</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Action Bar */}
        {selectedIds.size > 0 && (
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-md flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span className="font-semibold text-indigo-950">
                {selectedIds.size} transaction{selectedIds.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("approve")}
                className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold rounded shadow-xs transition-colors"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkAction("escalate")}
                className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-semibold rounded shadow-xs transition-colors"
              >
                Bulk Escalate
              </button>
              <button
                onClick={() => handleBulkAction("block")}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded shadow-xs transition-colors"
              >
                Bulk Block
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-slate-800 ml-2"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Data Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px] select-none">
              <tr>
                <th className="p-3 pl-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">Transaction</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date / Time</th>
                <th className="p-3">Channel / Type</th>
                <th className="p-3">State</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Anomaly</th>
                <th className="p-3 text-center">Risk Score</th>
                <th className="p-3">Risk Tier</th>
                <th className="p-3">Primary Trigger</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan="13" className="p-12 text-center text-slate-400">
                    Loading filtered transactions...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="13" className="p-12 text-center text-red-600 font-medium">
                    Error loading transactions: {error}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="13" className="p-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="text-slate-400 flex justify-center">{Icons.search}</div>
                      <div className="font-semibold text-slate-700">
                        No transactions match your filters
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Try clearing search keywords, broadening risk tiers, or clearing amount filters.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isSelected = selectedIds.has(t.transaction_id);
                  const riskScore = Number(t.risk_score || 0);
                  const anomalyScore = Number(t.behavioral_anomaly_score || 0);
                  const amount = Number(t.transaction_amount || 0);
                  const primaryTrigger = toTitleCase(
                    (t.risk_reasons || "").split("|")[0]
                  );

                  return (
                    <tr
                      key={t.transaction_id}
                      onClick={() => onOpenDrawer(t.transaction_id)}
                      className={`table-row-interactive hover:bg-slate-50 border-b border-slate-100 ${
                        isSelected ? "table-row-selected" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 pl-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelect(t.transaction_id, e)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Transaction ID */}
                      <td className="p-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {t.transaction_id}
                      </td>

                      {/* Customer ID */}
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                        {t.customer_id}
                      </td>

                      {/* Date / Time */}
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(t.transaction_datetime)}
                      </td>

                      {/* Channel / Type */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {(t.channel || "").replace("_", " ")}
                        </div>
                        <div className="text-[10px] text-slate-400">{t.transaction_type || ""}</div>
                      </td>

                      {/* State */}
                      <td className="p-3 text-slate-700 whitespace-nowrap">{t.state || "—"}</td>

                      {/* Amount (₹) */}
                      <td className="p-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                        {formatINR(amount)}
                      </td>

                      {/* Behavioral Anomaly */}
                      <td className="p-3 text-center whitespace-nowrap tabular-nums font-mono text-slate-600">
                        {anomalyScore.toFixed(2)}
                      </td>

                      {/* Risk Score */}
                      <td
                        className={`p-3 text-center whitespace-nowrap tabular-nums font-bold ${
                          riskScore >= 75
                            ? "text-red-600"
                            : riskScore >= 55
                            ? "text-orange-600"
                            : riskScore >= 25
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {riskScore.toFixed(1)}
                      </td>

                      {/* Risk Tier Badge */}
                      <td className="p-3 whitespace-nowrap">
                        <RiskBadge level={t.risk_level} />
                      </td>

                      {/* Primary Trigger */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {primaryTrigger}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge status={t.triage_status} />
                      </td>

                      {/* Action Inspector Link */}
                      <td
                        className="p-3 pr-4 text-center whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDrawer(t.transaction_id);
                        }}
                      >
                        <button
                          className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50 transition-colors"
                          title="Inspect Forensics"
                        >
                          {Icons.arrowUpRight}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-500">
            Showing <strong className="text-slate-800 tabular-nums">{startRec.toLocaleString()}</strong> to{" "}
            <strong className="text-slate-800 tabular-nums">{endRec.toLocaleString()}</strong> of{" "}
            <strong className="text-slate-800 tabular-nums">{totalCount.toLocaleString()}</strong> records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {Icons.chevronLeft}
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-indigo-600 text-white font-semibold"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {Icons.chevronRight}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
