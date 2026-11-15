/**
 * Enterprise Navigation Sidebar Component
 */

import { Icons } from "../utils.js";
import { store } from "../store.js";

export function renderSidebar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const navItems = [
    { id: "triage", label: "Alert Triage Queue", icon: Icons.shield, badgeId: "sidebar-backlog-badge" },
    { id: "analytics", label: "Behavioral Analytics", icon: Icons.activity },
    { id: "models", label: "Model Benchmarks", icon: Icons.barChart },
    { id: "simulator", label: "Risk Simulator", icon: Icons.sliders },
    { id: "audit", label: "Audit Ledger", icon: Icons.fileText }
  ];

  const currentTab = store.getState().activeTab;

  container.innerHTML = `
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 flex-shrink-0 z-30 select-none">
      <div>
        <!-- Brand Header -->
        <div class="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div class="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-widest shadow-sm">
            SR
          </div>
          <div>
            <div class="text-sm font-bold text-white tracking-tight">SentinelRisk</div>
            <div class="text-[10px] text-slate-400 font-medium tracking-wide">DIGITAL BANKING FRAUD OPS</div>
          </div>
        </div>

        <!-- Navigation Section -->
        <div class="px-3 py-6">
          <div class="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Operations & Analytics
          </div>
          <nav class="space-y-1">
            ${navItems.map(item => `
              <button 
                data-tab="${item.id}"
                class="nav-tab-btn w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors text-left ${
                  currentTab === item.id 
                    ? "bg-slate-800 text-white font-semibold border-l-2 border-indigo-500" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }"
              >
                <div class="flex items-center gap-3">
                  <span class="${currentTab === item.id ? "text-indigo-400" : "text-slate-400"}">
                    ${item.icon}
                  </span>
                  <span>${item.label}</span>
                </div>
                ${item.badgeId ? `<span id="${item.badgeId}" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 hidden">0</span>` : ""}
              </button>
            `).join("")}
          </nav>
        </div>
      </div>

      <!-- Footer Info Box -->
      <div class="p-4 border-t border-slate-800">
        <div class="p-3 rounded bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1.5">
          <div class="flex items-center justify-between text-slate-300 font-medium">
            <span>Chronological Test</span>
            <span class="text-indigo-400 font-mono">110K Txns</span>
          </div>
          <div class="text-[10px] text-slate-400">
            Split: Jan 2019–Dec 2022 (Train) vs Dec 2022–Jan 2024 (Test)
          </div>
          <div class="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
            <span class="text-slate-400">Zero Target Leakage</span>
            <span class="text-emerald-400 font-semibold">Enforced</span>
          </div>
        </div>
      </div>
    </aside>
  `;

  // Attach tab switching click listeners
  container.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      store.setActiveTab(tabId);
    });
  });

  // Subscribe to tab changes to update active styles
  store.subscribe("tab_changed", (newTab) => {
    container.querySelectorAll(".nav-tab-btn").forEach(btn => {
      const tabId = btn.getAttribute("data-tab");
      const iconSpan = btn.querySelector("div > span:first-child");
      if (tabId === newTab) {
        btn.className = "nav-tab-btn w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-semibold bg-slate-800 text-white border-l-2 border-indigo-500 transition-colors text-left";
        if (iconSpan) iconSpan.className = "text-indigo-400";
      } else {
        btn.className = "nav-tab-btn w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors text-left";
        if (iconSpan) iconSpan.className = "text-slate-400";
      }
    });
  });

  // Subscribe to KPIs to update backlog badge
  store.subscribe("kpis_updated", (kpis) => {
    const badge = document.getElementById("sidebar-backlog-badge");
    if (badge && kpis) {
      const urgentCount = (kpis.risk_breakdown?.Critical?.count || 186) + (kpis.risk_breakdown?.High?.count || 801);
      badge.textContent = urgentCount.toLocaleString();
      badge.classList.remove("hidden");
    }
  });
}
