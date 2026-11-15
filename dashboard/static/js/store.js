/**
 * Central State Store & Event Bus for SentinelRisk Dashboard
 */

class Store {
  constructor() {
    this.state = {
      activeTab: "triage", // triage | analytics | models | simulator | audit
      filters: {
        severity: "all",
        channel: "all",
        state: "all",
        triage_status: "all",
        search: "",
        min_amount: "",
        max_amount: "",
        page: 1,
        limit: 25,
        sort_by: "risk_score",
        sort_dir: "DESC"
      },
      selectedTxnIds: new Set(),
      activeDrawerTxnId: null,
      activeDrawerData: null,
      drawerOpen: false,
      kpis: null,
      transactionsData: null,
      loading: {
        kpis: false,
        transactions: false,
        analytics: false,
        models: false,
        detail: false
      }
    };
    this.listeners = new Map();
  }

  getState() {
    return this.state;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) {
        this.listeners.set(event, arr.filter(cb => cb !== callback));
      }
    };
  }

  emit(event, payload) {
    const arr = this.listeners.get(event);
    if (arr) {
      arr.forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[Store Error] Listener failed for ${event}:`, e);
        }
      });
    }
  }

  setActiveTab(tab) {
    if (this.state.activeTab !== tab) {
      this.state.activeTab = tab;
      this.emit("tab_changed", tab);
    }
  }

  setFilters(partialFilters) {
    this.state.filters = {
      ...this.state.filters,
      ...partialFilters
    };
    this.emit("filters_changed", this.state.filters);
  }

  resetFilters() {
    this.state.filters = {
      severity: "all",
      channel: "all",
      state: "all",
      triage_status: "all",
      search: "",
      min_amount: "",
      max_amount: "",
      page: 1,
      limit: 25,
      sort_by: "risk_score",
      sort_dir: "DESC"
    };
    this.state.selectedTxnIds.clear();
    this.emit("filters_changed", this.state.filters);
    this.emit("selection_changed", this.state.selectedTxnIds);
  }

  toggleSelectTransaction(id) {
    if (this.state.selectedTxnIds.has(id)) {
      this.state.selectedTxnIds.delete(id);
    } else {
      this.state.selectedTxnIds.add(id);
    }
    this.emit("selection_changed", this.state.selectedTxnIds);
  }

  selectAllCurrentPage(txnIds) {
    const allSelected = txnIds.every(id => this.state.selectedTxnIds.has(id));
    if (allSelected) {
      txnIds.forEach(id => this.state.selectedTxnIds.delete(id));
    } else {
      txnIds.forEach(id => this.state.selectedTxnIds.add(id));
    }
    this.emit("selection_changed", this.state.selectedTxnIds);
  }

  clearSelection() {
    this.state.selectedTxnIds.clear();
    this.emit("selection_changed", this.state.selectedTxnIds);
  }

  openDrawer(txnId, txnData = null) {
    this.state.activeDrawerTxnId = txnId;
    this.state.activeDrawerData = txnData;
    this.state.drawerOpen = true;
    this.emit("drawer_opened", { txnId, txnData });
  }

  closeDrawer() {
    this.state.drawerOpen = false;
    this.state.activeDrawerTxnId = null;
    this.state.activeDrawerData = null;
    this.emit("drawer_closed", null);
  }

  setKPIs(data) {
    this.state.kpis = data;
    this.emit("kpis_updated", data);
  }
}

export const store = new Store();
