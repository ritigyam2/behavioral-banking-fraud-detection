/**
 * Forensic Slide-Over Inspector Component
 * Displays deep behavioral evidence and allows analyst triage actions.
 */

import { formatINR, formatDateTime, getRiskBadge, getStatusBadge, Icons } from "../utils.js";
import { store } from "../store.js";
import { API } from "../api.js";
import { Toast } from "./toast.js";

export function renderDrawer() {
  let drawerRoot = document.getElementById("drawer-root");
  if (!drawerRoot) {
    drawerRoot = document.createElement("div");
    drawerRoot.id = "drawer-root";
    document.body.appendChild(drawerRoot);
  }

  drawerRoot.className = "fixed inset-0 z-50 overflow-hidden drawer-closed";
  drawerRoot.innerHTML = `
    <!-- Backdrop overlay -->
    <div id="drawer-backdrop" class="drawer-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>

    <!-- Slide-over panel -->
    <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
      <div id="drawer-panel" class="drawer-panel w-screen max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
        
        <!-- Drawer Header -->
        <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div class="flex items-center gap-3">
              <h2 id="drawer-txn-id" class="text-base font-bold text-slate-900 font-mono">TXN000000000</h2>
              <button id="drawer-copy-btn" title="Copy Transaction ID" class="text-slate-400 hover:text-slate-600 transition-colors">
                ${Icons.copy}
              </button>
              <span id="drawer-status-badge"></span>
            </div>
            <div class="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span id="drawer-datetime">—</span>
              <span>•</span>
              <span id="drawer-customer-id" class="font-mono text-slate-700 font-medium">CUST000000</span>
            </div>
          </div>
          <button id="drawer-close-btn" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200/50 transition-colors">
            ${Icons.x}
          </button>
        </div>

        <!-- Drawer Content Body (Scrollable) -->
        <div id="drawer-content" class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          <!-- Content injected dynamically -->
          <div class="py-12 text-center text-slate-400">Loading transaction forensics...</div>
        </div>

        <!-- Action Disposition Footer -->
        <div class="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Analyst Investigation Notes
            </label>
            <textarea 
              id="drawer-notes-input"
              rows="2"
              placeholder="Record forensic rationale, customer contact logs, or AML justification..."
              class="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <button 
              id="drawer-action-approve"
              class="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              ${Icons.check} Approve Txn
            </button>
            <button 
              id="drawer-action-escalate"
              class="w-full py-2 px-3 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              ${Icons.alertTriangle} Escalate AML
            </button>
            <button 
              id="drawer-action-block"
              class="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              ${Icons.x} Block & Freeze
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  // Close handlers
  const closeBtn = document.getElementById("drawer-close-btn");
  const backdrop = document.getElementById("drawer-backdrop");
  closeBtn?.addEventListener("click", () => store.closeDrawer());
  backdrop?.addEventListener("click", () => store.closeDrawer());

  // Copy button handler
  document.getElementById("drawer-copy-btn")?.addEventListener("click", () => {
    const txnId = document.getElementById("drawer-txn-id")?.textContent;
    if (txnId) {
      navigator.clipboard.writeText(txnId);
      Toast.show(`Copied ${txnId} to clipboard`, "info", 2000);
    }
  });

  // Action buttons
  document.getElementById("drawer-action-approve")?.addEventListener("click", () => handleAction("approve"));
  document.getElementById("drawer-action-escalate")?.addEventListener("click", () => handleAction("escalate"));
  document.getElementById("drawer-action-block")?.addEventListener("click", () => handleAction("block"));

  // Subscribe to drawer open event
  store.subscribe("drawer_opened", async ({ txnId, txnData }) => {
    drawerRoot.classList.remove("drawer-closed");
    drawerRoot.classList.add("drawer-open");

    // Populate initial metadata
    const txnIdElem = document.getElementById("drawer-txn-id");
    const statusElem = document.getElementById("drawer-status-badge");
    const dtElem = document.getElementById("drawer-datetime");
    const custElem = document.getElementById("drawer-customer-id");
    const notesInput = document.getElementById("drawer-notes-input");

    if (txnIdElem) txnIdElem.textContent = txnId;
    if (notesInput) notesInput.value = "";

    try {
      const fullData = await API.getTransactionDetail(txnId);
      populateDrawerContent(fullData);
    } catch (err) {
      const content = document.getElementById("drawer-content");
      if (content) content.innerHTML = `<div class="p-6 text-red-600">Failed to load transaction forensics: ${err.message}</div>`;
    }
  });

  // Subscribe to drawer close event
  store.subscribe("drawer_closed", () => {
    drawerRoot.classList.remove("drawer-open");
    drawerRoot.classList.add("drawer-closed");
  });
}

async function handleAction(actionType) {
  const txnId = document.getElementById("drawer-txn-id")?.textContent;
  const notes = document.getElementById("drawer-notes-input")?.value.trim();

  if (!txnId) return;

  try {
    const updated = await API.postTransactionAction(txnId, actionType, notes);
    Toast.show(`Transaction ${txnId} marked as ${actionType.toUpperCase()}`, "success");
    
    // Refresh drawer
    populateDrawerContent(updated);
    
    // Refresh triage list in background
    store.emit("triage_updated", null);
  } catch (err) {
    Toast.show(`Failed to update transaction: ${err.message}`, "error");
  }
}

function populateDrawerContent(data) {
  if (!data) return;

  const content = document.getElementById("drawer-content");
  const statusElem = document.getElementById("drawer-status-badge");
  const dtElem = document.getElementById("drawer-datetime");
  const custElem = document.getElementById("drawer-customer-id");

  if (statusElem) statusElem.innerHTML = getStatusBadge(data.triage_status);
  if (dtElem) dtElem.textContent = formatDateTime(data.transaction_datetime);
  if (custElem) custElem.textContent = data.customer_id;

  const riskScore = Number(data.risk_score || 0);
  const anomalyScore = Number(data.behavioral_anomaly_score || 0);
  const amount = Number(data.transaction_amount || 0);
  const balance = Number(data.account_balance || 0);
  const priorAvg = Number(data.customer_avg_amount_prior || 0);
  const priorMedian = Number(data.customer_median_amount_prior || 0);
  const amountRatio = Number(data.amount_ratio_prior || 0);
  const balanceUsage = Number(data.balance_usage_ratio || 0);

  content.innerHTML = `
    <!-- Top Risk Severity Gauge Card -->
    <div class="p-4 rounded-lg bg-slate-50 border border-slate-200">
      <div class="flex items-center justify-between mb-3">
        <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Risk Severity Assessment</span>
        ${getRiskBadge(data.risk_level)}
      </div>
      <div class="flex items-baseline gap-3">
        <div class="text-3xl font-extrabold text-slate-900 tabular-nums">
          ${riskScore.toFixed(1)}<span class="text-sm font-normal text-slate-400"> / 100</span>
        </div>
        <div class="text-xs text-slate-500">
          Behavioral Anomaly Index: <strong class="text-slate-800">${anomalyScore.toFixed(2)}</strong>
        </div>
      </div>
      <div class="mt-3 score-meter-track">
        <div 
          class="score-meter-fill ${riskScore >= 75 ? 'bg-red-600' : riskScore >= 55 ? 'bg-orange-500' : riskScore >= 25 ? 'bg-amber-500' : 'bg-emerald-500'}"
          style="width: ${Math.min(100, Math.max(2, riskScore))}%"
        ></div>
      </div>
      <div class="mt-2 flex justify-between text-[10px] text-slate-400 font-medium">
        <span>Low (0–24)</span>
        <span>Moderate (25–54)</span>
        <span>High (55–74)</span>
        <span>Critical (75–100)</span>
      </div>
    </div>

    <!-- Explainable Forensic Triggers -->
    <div>
      <div class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
        Triggered Behavioral Anomalies
      </div>
      ${data.triggers_list && data.triggers_list.length > 0 ? `
        <div class="space-y-2">
          ${data.triggers_list.map(tr => `
            <div class="p-2.5 rounded border ${tr.severity === 'critical' ? 'bg-red-50/60 border-red-200 text-red-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'} flex items-start gap-2.5">
              <span class="mt-0.5 ${tr.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}">
                ${Icons.alertTriangle}
              </span>
              <div>
                <div class="font-semibold text-xs leading-tight">${tr.title}</div>
                <div class="text-[11px] text-slate-600 mt-0.5">Automated signal matched against customer baseline historical patterns.</div>
              </div>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="p-3 rounded border border-slate-200 bg-slate-50 text-slate-500 text-xs">
          No statistical anomalies triggered. Transaction aligns with customer profile.
        </div>
      `}
    </div>

    <!-- Financial Stress & Deviation Analysis -->
    <div>
      <div class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
        Financial Baseline Deviations
      </div>
      <div class="grid grid-cols-2 gap-2.5">
        <div class="p-3 rounded border border-slate-200 bg-white">
          <div class="text-[11px] text-slate-400">Transaction Amount</div>
          <div class="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">${formatINR(amount)}</div>
          <div class="text-[10px] text-slate-500 mt-1">Available Bal: ${formatINR(balance)}</div>
        </div>
        <div class="p-3 rounded border border-slate-200 bg-white">
          <div class="text-[11px] text-slate-400">Amount vs Prior Avg</div>
          <div class="text-sm font-bold ${amountRatio >= 3.0 ? 'text-red-600' : amountRatio >= 1.5 ? 'text-amber-600' : 'text-slate-900'} mt-0.5 tabular-nums">
            ${amountRatio.toFixed(2)}x
          </div>
          <div class="text-[10px] text-slate-500 mt-1">Customer Avg: ${formatINR(priorAvg)}</div>
        </div>
        <div class="p-3 rounded border border-slate-200 bg-white">
          <div class="text-[11px] text-slate-400">Balance Drain Ratio</div>
          <div class="text-sm font-bold ${balanceUsage >= 0.8 ? 'text-red-600' : balanceUsage >= 0.5 ? 'text-amber-600' : 'text-slate-900'} mt-0.5 tabular-nums">
            ${(balanceUsage * 100).toFixed(1)}%
          </div>
          <div class="text-[10px] text-slate-500 mt-1">Single txn account impact</div>
        </div>
        <div class="p-3 rounded border border-slate-200 bg-white">
          <div class="text-[11px] text-slate-400">Historical Median</div>
          <div class="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">${formatINR(priorMedian)}</div>
          <div class="text-[10px] text-slate-500 mt-1">Z-Score: ${(data.amount_zscore_behavior || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>

    <!-- Velocity & Context Profile -->
    <div>
      <div class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
        Velocity & Contextual Shifts
      </div>
      <div class="p-3 rounded border border-slate-200 bg-white space-y-2">
        <div class="flex justify-between py-1 border-b border-slate-100">
          <span class="text-slate-500">Transaction Velocity (Past 1h / 24h / 7d)</span>
          <span class="font-bold text-slate-800 tabular-nums">
            ${data.txn_count_prior_1h || 0} / ${data.txn_count_prior_24h || 0} / ${data.txn_count_prior_7d || 0}
          </span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100">
          <span class="text-slate-500">Channel Shift</span>
          <span class="font-medium text-slate-800">
            ${data.channel ? data.channel.replace('_', ' ') : '—'} 
            ${data.usual_channel_prior ? `<span class="text-slate-400 font-normal">(Usual: ${data.usual_channel_prior.replace('_', ' ')})</span>` : ''}
          </span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100">
          <span class="text-slate-500">Geographic Location</span>
          <span class="font-medium text-slate-800">
            ${data.state || '—'} 
            ${data.usual_state_prior ? `<span class="text-slate-400 font-normal">(Usual: ${data.usual_state_prior})</span>` : ''}
          </span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-slate-500">Customer KYC & Credit Score</span>
          <span class="font-medium text-slate-800">
            ${data.kyc_status || 'Verified'} • Score: ${data.credit_score || '—'}
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Customer History -->
    ${data.customer_recent_transactions && data.customer_recent_transactions.length > 0 ? `
      <div>
        <div class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
          Prior Transactions from this Customer
        </div>
        <div class="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden bg-white">
          ${data.customer_recent_transactions.map(pt => `
            <div class="p-2.5 flex items-center justify-between text-[11px] hover:bg-slate-50">
              <div>
                <span class="font-mono text-slate-700 font-medium">${pt.transaction_id}</span>
                <span class="text-slate-400 ml-2">${formatDateTime(pt.transaction_datetime)}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-900 tabular-nums">${formatINR(pt.transaction_amount)}</span>
                ${getRiskBadge(pt.risk_level)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}

    <!-- Audit Trail History -->
    ${data.audit_history && data.audit_history.length > 0 ? `
      <div>
        <div class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
          Analyst Audit Ledger
        </div>
        <div class="space-y-2">
          ${data.audit_history.map(entry => `
            <div class="p-2.5 rounded border border-slate-200 bg-slate-50/70">
              <div class="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                <span>${entry.action} by ${entry.analyst}</span>
                <span class="text-[10px] text-slate-400 font-normal">${entry.timestamp}</span>
              </div>
              ${entry.notes ? `<div class="text-[11px] text-slate-600 mt-1 italic font-serif">"${entry.notes}"</div>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}
  `;
}
