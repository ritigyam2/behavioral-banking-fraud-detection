import React from "react";
import { Icons } from "../utils";

export function Sidebar({ activeTab, setActiveTab, kpis }) {
  const urgentCount =
    (kpis?.risk_breakdown?.Critical?.count || 186) +
    (kpis?.risk_breakdown?.High?.count || 801);

  const navItems = [
    {
      id: "triage",
      label: "Alert Triage Queue",
      icon: Icons.shield,
      badge: urgentCount > 0 ? urgentCount.toLocaleString() : null,
    },
    { id: "analytics", label: "Behavioral Analytics", icon: Icons.activity },
    { id: "models", label: "Model Benchmarks", icon: Icons.barChart },
    { id: "simulator", label: "Risk Simulator", icon: Icons.sliders },
    { id: "audit", label: "Audit Ledger", icon: Icons.fileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 flex-shrink-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-widest shadow-sm">
            SR
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">SentinelRisk</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">
              DIGITAL BANKING FRAUD OPS
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-6">
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Operations & Analytics
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors text-left ${
                    isActive
                      ? "bg-slate-800 text-white font-semibold border-l-2 border-indigo-500"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-indigo-400" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 rounded bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>Chronological Test</span>
            <span className="text-indigo-400 font-mono">110K Txns</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Split: Jan 2019–Dec 2022 (Train) vs Dec 2022–Jan 2024 (Test)
          </div>
          <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Zero Target Leakage</span>
            <span className="text-emerald-400 font-semibold">Enforced</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
