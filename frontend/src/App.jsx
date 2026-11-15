import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { ForensicsDrawer } from "./components/ForensicsDrawer";
import { ToastContainer } from "./components/Toast";
import { TriageView } from "./views/TriageView";
import { AnalyticsView } from "./views/AnalyticsView";
import { ModelsView } from "./views/ModelsView";
import { SimulatorView } from "./views/SimulatorView";
import { AuditView } from "./views/AuditView";
import { API } from "./api";

export function App() {
  const [activeTab, setActiveTab] = useState("triage");
  const [kpis, setKpis] = useState(null);
  const [drawerTxnId, setDrawerTxnId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchKpis = async () => {
    try {
      const data = await API.getKPIs();
      setKpis(data);
    } catch (err) {
      console.error("[SentinelRisk] Failed to load KPIs:", err);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleOpenDrawer = (txnId) => {
    setDrawerTxnId(txnId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerTxnId(null);
  };

  const handleGlobalSearch = (term) => {
    setSearchTerm(term);
    setActiveTab("triage");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} kpis={kpis} />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <Navbar
          onSearch={handleGlobalSearch}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Main Dashboard Content Area */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "triage" && (
            <TriageView
              kpis={kpis}
              onOpenDrawer={handleOpenDrawer}
              refreshKpis={fetchKpis}
              searchTerm={searchTerm}
            />
          )}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "models" && <ModelsView />}
          {activeTab === "simulator" && <SimulatorView />}
          {activeTab === "audit" && <AuditView />}
        </main>
      </div>

      {/* Forensic Slide-Over Drawer Container */}
      <ForensicsDrawer
        txnId={drawerTxnId}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onActionSuccess={() => {
          fetchKpis();
        }}
      />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default App;
