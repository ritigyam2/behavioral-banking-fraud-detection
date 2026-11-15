/**
 * Alert Triage Queue View Component
 * High-density data table with multi-dimensional filtering, bulk actions, and row drilldowns.
 */

import { formatINR, formatDateTime, getRiskBadge, getStatusBadge, Icons } from "../utils.js";
import { store } from "../store.js";
import { API } from "../api.js";
import { Toast } from "../components/toast.js";

export function renderTriageView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      
      <!-- Top Operational Metrics Bar -->
      <div id="triage-kpi-container"></div>

      <!-- Filters & Action Bar -->
      <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <!-- Severity Selector Pills -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="flex flex-wrap items-center gap-1.5" id="severity-pills-group">
            <button data-severity="all" class="severity-pill-btn px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-white shadow-xs">
              All Risk Tiers
            </button>
            <button data-severity="Critical" class="severity-pill-btn px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-red-600 inline-block mr-1"></span>Critical (186)
            </button>
            <button data-severity="High" class="severity-pill-btn px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-orange-600 inline-block mr-1"></span>High (801)
            </button>
            <button data-severity="Moderate" class="severity-pill-btn px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-amber-600 inline-block mr-1"></span>Moderate (7,885)
            </button>
            <button data-severity="Low" class="severity-pill-btn px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-emerald-600 inline-block mr-1"></span>Low (101K)
            </button>
          </div>

          <!-- Secondary Actions -->
          <div class="flex items-center gap-2">
            <button id="refresh-table-btn" class="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors">
              ${Icons.refresh} Refresh
            </button>
            <button id="reset-filters-btn" class="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors">
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Filter Dropdowns Row -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <!-- Channel -->
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Channel</label>
            <select id="filter-channel" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500">
              <option value="all">All Channels</option>
              <option value="Mobile_App">Mobile App</option>
              <option value="Net_Banking">Net Banking</option>
              <option value="POS_Terminal">POS Terminal</option>
              <option value="ATM">ATM Withdrawal</option>
            </select>
          </div>

          <!-- Triage Status -->
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select id="filter-status" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500">
              <option value="all">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Escalated">Escalated</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          <!-- State -->
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">State</label>
            <select id="filter-state" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500">
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

          <!-- Min Amount -->
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Min Amount (₹)</label>
            <input type="number" id="filter-min-amt" placeholder="Min ₹" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500" />
          </div>

          <!-- Max Amount -->
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Amount (₹)</label>
            <input type="number" id="filter-max-amt" placeholder="Max ₹" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500" />
          </div>

          <!-- Sort Column -->
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Sort By</label>
            <select id="filter-sort" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-500">
              <option value="risk_score">Risk Score (High to Low)</option>
              <option value="transaction_amount">Amount (High to Low)</option>
              <option value="transaction_datetime">Time (Newest First)</option>
              <option value="behavioral_anomaly_score">Anomaly Score</option>
            </select>
          </div>
        </div>

        <!-- Bulk Selection Action Bar (Shown when >= 1 item checked) -->
        <div id="bulk-actions-bar" class="hidden p-2.5 bg-indigo-50 border border-indigo-200 rounded-md flex items-center justify-between text-xs animate-fadeIn">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span class="font-semibold text-indigo-950" id="bulk-selected-count">0 transactions selected</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="bulk-approve-btn" class="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold rounded shadow-xs transition-colors">
              Bulk Approve
            </button>
            <button id="bulk-escalate-btn" class="px-3 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-semibold rounded shadow-xs transition-colors">
              Bulk Escalate
            </button>
            <button id="bulk-block-btn" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded shadow-xs transition-colors">
              Bulk Block
            </button>
            <button id="bulk-clear-btn" class="text-slate-500 hover:text-slate-800 ml-2">
              Deselect All
            </button>
          </div>
        </div>
      </div>

      <!-- Main Data Table Container -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px] select-none">
              <tr>
                <th class="p-3 pl-4 w-10 text-center">
                  <input type="checkbox" id="th-select-all" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </th>
                <th class="p-3">Transaction</th>
                <th class="p-3">Customer</th>
                <th class="p-3">Date / Time</th>
                <th class="p-3">Channel / Type</th>
                <th class="p-3">State</th>
                <th class="p-3 text-right">Amount (₹)</th>
                <th class="p-3 text-center">Anomaly</th>
                <th class="p-3 text-center">Risk Score</th>
                <th class="p-3">Risk Tier</th>
                <th class="p-3">Primary Trigger</th>
                <th class="p-3">Status</th>
                <th class="p-3 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody id="triage-table-body" class="divide-y divide-slate-100 font-normal">
              <tr>
                <td colspan="13" class="p-12 text-center text-slate-400">Loading transactions...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Pagination Footer -->
        <div class="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div class="text-slate-500" id="pagination-info">
            Showing <strong class="text-slate-800 tabular-nums">0</strong> to <strong class="text-slate-800 tabular-nums">0</strong> of <strong class="text-slate-800 tabular-nums">0</strong> records
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-slate-500">
              <span>Per page:</span>
              <select id="pagination-limit" class="px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs focus:outline-none">
                <option value="15">15</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div class="flex items-center gap-1" id="pagination-buttons">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Attach event listeners for controls
  attachTriageEvents();

  // Load and render table data
  loadTriageData();
}

function attachTriageEvents() {
  // Severity pill buttons
  document.querySelectorAll(".severity-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sev = btn.getAttribute("data-severity");
      
      // Update UI active styling
      document.querySelectorAll(".severity-pill-btn").forEach(b => {
        b.className = "severity-pill-btn px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200";
      });
      btn.className = "severity-pill-btn px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-white shadow-xs";

      store.setFilters({ severity: sev, page: 1 });
      loadTriageData();
    });
  });

  // Filter dropdown changes
  const channelSelect = document.getElementById("filter-channel");
  const statusSelect = document.getElementById("filter-status");
  const stateSelect = document.getElementById("filter-state");
  const sortSelect = document.getElementById("filter-sort");
  const limitSelect = document.getElementById("pagination-limit");
  const minAmtInput = document.getElementById("filter-min-amt");
  const maxAmtInput = document.getElementById("filter-max-amt");

  channelSelect?.addEventListener("change", () => {
    store.setFilters({ channel: channelSelect.value, page: 1 });
    loadTriageData();
  });
  statusSelect?.addEventListener("change", () => {
    store.setFilters({ triage_status: statusSelect.value, page: 1 });
    loadTriageData();
  });
  stateSelect?.addEventListener("change", () => {
    store.setFilters({ state: stateSelect.value, page: 1 });
    loadTriageData();
  });
  sortSelect?.addEventListener("change", () => {
    store.setFilters({ sort_by: sortSelect.value, page: 1 });
    loadTriageData();
  });
  limitSelect?.addEventListener("change", () => {
    store.setFilters({ limit: Number(limitSelect.value), page: 1 });
    loadTriageData();
  });

  // Debounced min/max amount handlers
  let amtDebounce;
  const onAmtChange = () => {
    clearTimeout(amtDebounce);
    amtDebounce = setTimeout(() => {
      store.setFilters({
        min_amount: minAmtInput?.value.trim() || "",
        max_amount: maxAmtInput?.value.trim() || "",
        page: 1
      });
      loadTriageData();
    }, 400);
  };
  minAmtInput?.addEventListener("input", onAmtChange);
  maxAmtInput?.addEventListener("input", onAmtChange);

  // Refresh & Reset buttons
  document.getElementById("refresh-table-btn")?.addEventListener("click", () => {
    Toast.show("Refreshing transaction queue...", "info", 1500);
    loadTriageData();
  });
  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    store.resetFilters();
    if (channelSelect) channelSelect.value = "all";
    if (statusSelect) statusSelect.value = "all";
    if (stateSelect) stateSelect.value = "all";
    if (sortSelect) sortSelect.value = "risk_score";
    if (minAmtInput) minAmtInput.value = "";
    if (maxAmtInput) maxAmtInput.value = "";
    document.querySelectorAll(".severity-pill-btn").forEach((b, idx) => {
      b.className = idx === 0 
        ? "severity-pill-btn px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-white shadow-xs"
        : "severity-pill-btn px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200";
    });
    loadTriageData();
  });

  // Bulk actions handlers
  document.getElementById("bulk-clear-btn")?.addEventListener("click", () => {
    store.clearSelection();
    updateBulkBar();
    renderSelectionCheckboxes();
  });
  document.getElementById("bulk-approve-btn")?.addEventListener("click", () => executeBulkAction("approve"));
  document.getElementById("bulk-escalate-btn")?.addEventListener("click", () => executeBulkAction("escalate"));
  document.getElementById("bulk-block-btn")?.addEventListener("click", () => executeBulkAction("block"));

  // Select all checkbox
  const thSelectAll = document.getElementById("th-select-all");
  thSelectAll?.addEventListener("change", () => {
    const currentTxnIds = store.getState().transactionsData?.transactions.map(t => t.transaction_id) || [];
    store.selectAllCurrentPage(currentTxnIds);
    updateBulkBar();
    renderSelectionCheckboxes();
  });

  // Listen to background updates
  store.subscribe("triage_updated", () => loadTriageData(false));
}

async function executeBulkAction(action) {
  const ids = Array.from(store.getState().selectedTxnIds);
  if (ids.length === 0) return;

  try {
    await API.postBulkAction(ids, action, `Bulk triage disposition: ${action}`);
    Toast.show(`Successfully updated ${ids.length} transactions as ${action.toUpperCase()}`, "success");
    store.clearSelection();
    updateBulkBar();
    loadTriageData();
  } catch (err) {
    Toast.show(`Bulk action failed: ${err.message}`, "error");
  }
}

function updateBulkBar() {
  const bulkBar = document.getElementById("bulk-actions-bar");
  const countSpan = document.getElementById("bulk-selected-count");
  const selectedCount = store.getState().selectedTxnIds.size;

  if (selectedCount > 0) {
    bulkBar?.classList.remove("hidden");
    if (countSpan) countSpan.textContent = `${selectedCount} transaction${selectedCount > 1 ? 's' : ''} selected`;
  } else {
    bulkBar?.classList.add("hidden");
  }
}

function renderSelectionCheckboxes() {
  const selected = store.getState().selectedTxnIds;
  document.querySelectorAll(".row-select-checkbox").forEach(cb => {
    const id = cb.getAttribute("data-id");
    cb.checked = selected.has(id);
    const tr = cb.closest("tr");
    if (tr) {
      if (selected.has(id)) tr.classList.add("table-row-selected");
      else tr.classList.remove("table-row-selected");
    }
  });

  const currentTxnIds = store.getState().transactionsData?.transactions.map(t => t.transaction_id) || [];
  const thSelectAll = document.getElementById("th-select-all");
  if (thSelectAll && currentTxnIds.length > 0) {
    thSelectAll.checked = currentTxnIds.every(id => selected.has(id));
  }
}

export async function loadTriageData(showLoading = true) {
  const tbody = document.getElementById("triage-table-body");
  if (!tbody) return;

  if (showLoading) {
    tbody.innerHTML = `<tr><td colspan="13" class="p-8 text-center text-slate-400">Loading filtered transactions...</td></tr>`;
  }

  const filters = store.getState().filters;

  try {
    const data = await API.getTransactions(filters);
    store.state.transactionsData = data;

    renderTableRows(data.transactions);
    renderPagination(data);
    updateBulkBar();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="13" class="p-8 text-center text-red-600">Error loading transactions: ${err.message}</td></tr>`;
  }
}

function renderTableRows(transactions) {
  const tbody = document.getElementById("triage-table-body");
  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13" class="p-12 text-center text-slate-500">
          <div class="max-w-xs mx-auto space-y-2">
            <div class="text-slate-400 flex justify-center">${Icons.search}</div>
            <div class="font-semibold text-slate-700">No transactions match your filters</div>
            <div class="text-slate-400 text-[11px]">Try clearing search keywords, broadening risk tiers, or clearing amount filters.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const selectedIds = store.getState().selectedTxnIds;

  tbody.innerHTML = transactions.map(t => {
    const isSelected = selectedIds.has(t.transaction_id);
    const riskScore = Number(t.risk_score || 0);
    const anomalyScore = Number(t.behavioral_anomaly_score || 0);
    const amount = Number(t.transaction_amount || 0);
    const primaryReason = (t.risk_reasons || "").split("|")[0].replace("_", " ").title() || "None";

    return `
      <tr class="table-row-interactive hover:bg-slate-50 border-b border-slate-100 ${isSelected ? 'table-row-selected' : ''}" data-id="${t.transaction_id}">
        <!-- Checkbox -->
        <td class="p-3 pl-4 text-center" onclick="event.stopPropagation()">
          <input 
            type="checkbox" 
            class="row-select-checkbox rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            data-id="${t.transaction_id}"
            ${isSelected ? 'checked' : ''}
          />
        </td>

        <!-- Transaction ID -->
        <td class="p-3 font-mono font-medium text-slate-900 whitespace-nowrap">
          ${t.transaction_id}
        </td>

        <!-- Customer ID -->
        <td class="p-3 font-mono text-slate-600 whitespace-nowrap">
          ${t.customer_id}
        </td>

        <!-- Date / Time -->
        <td class="p-3 text-slate-500 whitespace-nowrap">
          ${formatDateTime(t.transaction_datetime)}
        </td>

        <!-- Channel / Type -->
        <td class="p-3 whitespace-nowrap">
          <div class="font-medium text-slate-800">${(t.channel || '').replace('_', ' ')}</div>
          <div class="text-[10px] text-slate-400">${t.transaction_type || ''}</div>
        </td>

        <!-- State -->
        <td class="p-3 text-slate-700 whitespace-nowrap">
          ${t.state || '—'}
        </td>

        <!-- Amount (₹) -->
        <td class="p-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">
          ${formatINR(amount)}
        </td>

        <!-- Behavioral Anomaly -->
        <td class="p-3 text-center whitespace-nowrap tabular-nums font-mono text-slate-600">
          ${anomalyScore.toFixed(2)}
        </td>

        <!-- Risk Score -->
        <td class="p-3 text-center whitespace-nowrap tabular-nums font-bold ${riskScore >= 75 ? 'text-red-600' : riskScore >= 55 ? 'text-orange-600' : riskScore >= 25 ? 'text-amber-600' : 'text-emerald-600'}">
          ${riskScore.toFixed(1)}
        </td>

        <!-- Risk Tier Badge -->
        <td class="p-3 whitespace-nowrap">
          ${getRiskBadge(t.risk_level)}
        </td>

        <!-- Primary Trigger -->
        <td class="p-3 whitespace-nowrap">
          <span class="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ${primaryReason}
          </span>
        </td>

        <!-- Triage Status -->
        <td class="p-3 whitespace-nowrap">
          ${getStatusBadge(t.triage_status)}
        </td>

        <!-- Action Inspector Link -->
        <td class="p-3 pr-4 text-center whitespace-nowrap" onclick="event.stopPropagation()">
          <button 
            class="open-drawer-btn text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50 transition-colors"
            title="Inspect Forensics"
            data-id="${t.transaction_id}"
          >
            ${Icons.arrowUpRight}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Attach row click to open drawer
  tbody.querySelectorAll("tr").forEach(tr => {
    tr.addEventListener("click", () => {
      const txnId = tr.getAttribute("data-id");
      if (txnId) store.openDrawer(txnId);
    });
  });

  // Attach checkbox toggle
  tbody.querySelectorAll(".row-select-checkbox").forEach(cb => {
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      const id = cb.getAttribute("data-id");
      store.toggleSelectTransaction(id);
      updateBulkBar();
      renderSelectionCheckboxes();
    });
  });

  // Open drawer buttons
  tbody.querySelectorAll(".open-drawer-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (id) store.openDrawer(id);
    });
  });
}

function renderPagination(data) {
  const info = document.getElementById("pagination-info");
  const btnGroup = document.getElementById("pagination-buttons");
  if (!info || !btnGroup) return;

  const total = data.total_count || 0;
  const page = data.page || 1;
  const limit = data.limit || 25;
  const totalPages = data.total_pages || 1;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  info.innerHTML = `Showing <strong class="text-slate-800 tabular-nums">${start.toLocaleString()}</strong> to <strong class="text-slate-800 tabular-nums">${end.toLocaleString()}</strong> of <strong class="text-slate-800 tabular-nums">${total.toLocaleString()}</strong> records`;

  let buttonsHtml = `
    <button id="pg-prev" class="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" ${page <= 1 ? 'disabled' : ''}>
      ${Icons.chevronLeft}
    </button>
  `;

  // Render a clean window of 5 pages around active page
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let p = startPage; p <= endPage; p++) {
    buttonsHtml += `
      <button 
        data-page="${p}" 
        class="pg-btn px-2.5 py-1 rounded text-xs font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white font-semibold' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}"
      >
        ${p}
      </button>
    `;
  }

  buttonsHtml += `
    <button id="pg-next" class="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" ${page >= totalPages ? 'disabled' : ''}>
      ${Icons.chevronRight}
    </button>
  `;

  btnGroup.innerHTML = buttonsHtml;

  // Pagination click handlers
  document.getElementById("pg-prev")?.addEventListener("click", () => {
    if (page > 1) {
      store.setFilters({ page: page - 1 });
      loadTriageData();
    }
  });

  document.getElementById("pg-next")?.addEventListener("click", () => {
    if (page < totalPages) {
      store.setFilters({ page: page + 1 });
      loadTriageData();
    }
  });

  btnGroup.querySelectorAll(".pg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = Number(btn.getAttribute("data-page"));
      if (p !== page) {
        store.setFilters({ page: p });
        loadTriageData();
      }
    });
  });
}
