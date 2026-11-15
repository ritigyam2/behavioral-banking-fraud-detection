/**
 * Compliance Audit Ledger View Component
 * Provides an auditable regulatory trail of analyst actions and triage decisions.
 */

import { Icons } from "../utils.js";
import { API } from "../api.js";

export function renderAuditView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- View Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 tracking-tight">Compliance & Forensic Audit Ledger</h2>
          <p class="text-xs text-slate-500 mt-0.5">Immutable regulatory record of all triage dispositions, account blocks, and AML escalations.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="refresh-audit-btn" class="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors">
            ${Icons.refresh} Refresh Log
          </button>
        </div>
      </div>

      <!-- Audit Ledger Table -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Disposition Event Log</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Chronologically ordered by audit execution timestamp</p>
          </div>
          <span class="text-xs font-mono text-slate-500">Audit Storage: SQLite</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              <tr>
                <th class="p-3 pl-4">Timestamp</th>
                <th class="p-3">Transaction</th>
                <th class="p-3">Customer</th>
                <th class="p-3">Action Type</th>
                <th class="p-3 text-center">Status Transition</th>
                <th class="p-3">Investigating Analyst</th>
                <th class="p-3 pr-4">Forensic Justification / Notes</th>
              </tr>
            </thead>
            <tbody id="audit-table-body" class="divide-y divide-slate-100">
              <tr>
                <td colspan="7" class="p-8 text-center text-slate-400">Loading audit records...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  document.getElementById("refresh-audit-btn")?.addEventListener("click", loadAuditData);

  loadAuditData();
}

async function loadAuditData() {
  const tbody = document.getElementById("audit-table-body");
  if (!tbody) return;

  try {
    const logs = await API.getAuditLog(100);
    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No triage actions recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let badgeStyle = "bg-slate-100 text-slate-800";
      if (l.new_status === "Approved") badgeStyle = "bg-emerald-50 text-emerald-800 border border-emerald-200";
      else if (l.new_status === "Blocked") badgeStyle = "bg-red-50 text-red-800 border border-red-200";
      else if (l.new_status === "Escalated") badgeStyle = "bg-amber-50 text-amber-800 border border-amber-200";

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-3 pl-4 font-mono text-slate-500 whitespace-nowrap">${l.timestamp}</td>
          <td class="p-3 font-mono font-medium text-slate-900 whitespace-nowrap">${l.transaction_id}</td>
          <td class="p-3 font-mono text-slate-600 whitespace-nowrap">${l.customer_id}</td>
          <td class="p-3 font-semibold text-slate-800 whitespace-nowrap">${l.action}</td>
          <td class="p-3 text-center whitespace-nowrap">
            <span class="text-slate-400 font-mono text-[11px]">${l.previous_status} &rarr; </span>
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${badgeStyle}">${l.new_status}</span>
          </td>
          <td class="p-3 text-slate-700 whitespace-nowrap font-medium">${l.analyst}</td>
          <td class="p-3 pr-4 text-slate-600 italic font-serif">
            ${l.notes ? `"${l.notes}"` : '<span class="text-slate-400 not-italic font-sans">No notes recorded</span>'}
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-red-600">Error loading audit log: ${err.message}</td></tr>`;
  }
}
