import React, { useRef, useEffect } from "react";
import { Icons } from "../utils";

export function Navbar({ onSearch, searchTerm, setSearchTerm }) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch?.(searchTerm);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Context & Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE EVALUATION
          </span>
          <span className="text-xs text-slate-500 hidden md:inline">
            Indian Banking Dataset (2019–2024) • 110,000 Records
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-64 lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {Icons.search}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Txn ID, Customer ID... (Press /)"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right: System Status & User Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pr-4 border-r border-slate-200">
          <span className="font-medium text-slate-700">Model Engine:</span>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 font-semibold">
            Behavioral Profiler v2.4
          </span>
        </div>

        {/* Quick Analyst Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold tracking-wider">
            AS
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">A. Sharma</div>
            <div className="text-[11px] text-slate-500 leading-tight">Lead Fraud Investigator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
