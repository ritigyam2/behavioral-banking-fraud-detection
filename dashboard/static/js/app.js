/**
 * SentinelRisk Main Application Orchestrator
 */

import { store } from "./store.js";
import { API } from "./api.js";
import { renderNavbar } from "./components/navbar.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderKPICards } from "./components/kpi_cards.js";
import { renderDrawer } from "./components/drawer.js";
import { renderTriageView } from "./views/triage.js";
import { renderAnalyticsView } from "./views/analytics.js";
import { renderModelsView } from "./views/models.js";
import { renderSimulatorView } from "./views/simulator.js";
import { renderAuditView } from "./views/audit.js";

async function initApp() {
  console.log("[SentinelRisk] Initializing Dashboard Application Shell...");

  // Render static components
  renderNavbar("navbar-root");
  renderSidebar("sidebar-root");
  renderDrawer();

  // Initial fetch of KPIs
  try {
    const kpis = await API.getKPIs();
    store.setKPIs(kpis);
  } catch (err) {
    console.error("[SentinelRisk] Failed to load initial KPIs:", err);
  }

  // Subscribe to tab changes to switch main view
  store.subscribe("tab_changed", (tab) => {
    renderActiveView(tab);
  });

  // Render initial active tab (triage)
  renderActiveView(store.getState().activeTab);
}

function renderActiveView(tab) {
  const main = document.getElementById("main-view-content");
  if (!main) return;

  switch (tab) {
    case "analytics":
      renderAnalyticsView("main-view-content");
      break;
    case "models":
      renderModelsView("main-view-content");
      break;
    case "simulator":
      renderSimulatorView("main-view-content");
      break;
    case "audit":
      renderAuditView("main-view-content");
      break;
    case "triage":
    default:
      renderTriageView("main-view-content");
      renderKPICards("triage-kpi-container");
      break;
  }
}

// Start application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
