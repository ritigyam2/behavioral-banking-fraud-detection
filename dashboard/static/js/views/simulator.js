/**
 * What-If Risk Simulator View Component
 * Interactive sandbox allowing risk analysts to test behavioral fraud parameters in real-time.
 */

import { formatINR, getRiskBadge, Icons } from "../utils.js";
import { API } from "../api.js";
import { Toast } from "../components/toast.js";

export function renderSimulatorView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- View Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 tracking-tight">Interactive What-If Risk Simulator</h2>
          <p class="text-xs text-slate-500 mt-0.5">Test hypothetical transactions against the behavioral fraud detection engine in real-time.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">Preset Scenarios:</span>
          <button id="sim-preset-normal" class="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors">
            Routine POS
          </button>
          <button id="sim-preset-midnight" class="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-red-700 shadow-xs transition-colors">
            Midnight Drain
          </button>
          <button id="sim-preset-burst" class="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-orange-700 shadow-xs transition-colors">
            ATM Burst
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Form Controls (7 cols) -->
        <div class="lg:col-span-7 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Transaction & Customer Parameters</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Adjust variables to test multi-trigger non-linear risk escalation</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            <!-- Amount -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Transaction Amount (₹)</label>
              <input type="number" id="sim-amount" value="1250" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono" />
              <span class="text-[10px] text-slate-400">Current attempted payment</span>
            </div>

            <!-- Available Balance -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Available Account Balance (₹)</label>
              <input type="number" id="sim-balance" value="18500" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono" />
              <span class="text-[10px] text-slate-400">Liquid funds before transaction</span>
            </div>

            <!-- Prior Historical Average -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Customer Historical Avg Amount (₹)</label>
              <input type="number" id="sim-prior-avg" value="1400" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono" />
              <span class="text-[10px] text-slate-400">Customer 30-day baseline</span>
            </div>

            <!-- Hour of Transaction -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Transaction Hour (0–23)</label>
              <input type="number" id="sim-hour" min="0" max="23" value="14" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono" />
              <span class="text-[10px] text-slate-400">Off-hour window is 22:00–05:00</span>
            </div>

            <!-- Channel -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Current Channel</label>
              <select id="sim-channel" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500">
                <option value="Mobile_App" selected>Mobile App</option>
                <option value="Net_Banking">Net Banking</option>
                <option value="UPI">UPI</option>
                <option value="POS_Terminal">POS Terminal</option>
                <option value="ATM">ATM Withdrawal</option>
              </select>
            </div>

            <!-- Usual Channel -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Customer Usual Channel</label>
              <select id="sim-usual-channel" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500">
                <option value="Mobile_App" selected>Mobile App</option>
                <option value="Net_Banking">Net Banking</option>
                <option value="UPI">UPI</option>
                <option value="POS_Terminal">POS Terminal</option>
                <option value="ATM">ATM Withdrawal</option>
              </select>
            </div>

            <!-- State -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Transaction State</label>
              <select id="sim-state" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500">
                <option value="Maharashtra" selected>Maharashtra</option>
                <option value="Telangana">Telangana</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi">Delhi</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>

            <!-- Usual State -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Customer Usual State</label>
              <select id="sim-usual-state" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500">
                <option value="Maharashtra" selected>Maharashtra</option>
                <option value="Telangana">Telangana</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi">Delhi</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>

            <!-- 1h Velocity -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Transactions in Prior 1 Hour</label>
              <input type="number" id="sim-vel-1h" min="0" value="0" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono" />
              <span class="text-[10px] text-slate-400">Burst threshold: &ge; 3</span>
            </div>

            <!-- KYC Status -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Customer KYC Status</label>
              <select id="sim-kyc" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500">
                <option value="Verified" selected>Verified</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed / Expired</option>
              </select>
            </div>

          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Runs real-time behavioral feature derivation</span>
            <button 
              id="sim-run-btn"
              class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              ${Icons.cpu} Evaluate Risk Score
            </button>
          </div>
        </div>

        <!-- Right: Results Card (5 cols) -->
        <div class="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between" id="sim-results-card">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Evaluation Verdict</h3>
              <span id="sim-badge"></span>
            </div>

            <!-- Score Display -->
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
              <div class="text-[11px] text-slate-500 font-medium">Computed Continuous Risk Score</div>
              <div class="text-4xl font-extrabold text-slate-900 mt-1 tabular-nums" id="sim-score">
                —<span class="text-sm font-normal text-slate-400"> / 100</span>
              </div>
              <div class="mt-2 score-meter-track">
                <div id="sim-score-meter" class="score-meter-fill bg-indigo-600" style="width: 0%"></div>
              </div>
              <div class="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Anomaly Index: <strong id="sim-anomaly-idx" class="text-slate-800 font-mono">0.0</strong></span>
                <span id="sim-active-flags" class="font-semibold text-slate-700">0 flags active</span>
              </div>
            </div>

            <!-- Active Triggers List -->
            <div class="space-y-2 mb-4">
              <div class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Active Behavioral Signals</div>
              <div id="sim-triggers-container" class="space-y-1.5 text-xs">
                <div class="p-3 rounded border border-slate-200 bg-slate-50 text-slate-400 text-center">
                  Click "Evaluate Risk Score" to run model
                </div>
              </div>
            </div>

            <!-- Operational Decision Recommendation -->
            <div>
              <div class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Operational Protocol Recommendation</div>
              <div id="sim-recommendation-box" class="p-3 rounded bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                Awaiting simulation execution...
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            Simulated output is for risk triage assistance and follows Decision Tree thresholds.
          </div>
        </div>

      </div>

    </div>
  `;

  attachSimulatorEvents();
}

function attachSimulatorEvents() {
  const runBtn = document.getElementById("sim-run-btn");
  runBtn?.addEventListener("click", executeSimulation);

  // Preset handlers
  document.getElementById("sim-preset-normal")?.addEventListener("click", () => {
    setSimValues({
      amount: 450,
      balance: 24000,
      priorAvg: 500,
      hour: 13,
      channel: "POS_Terminal",
      usualChannel: "POS_Terminal",
      state: "Maharashtra",
      usualState: "Maharashtra",
      vel1h: 0,
      kyc: "Verified"
    });
    executeSimulation();
  });

  document.getElementById("sim-preset-midnight")?.addEventListener("click", () => {
    setSimValues({
      amount: 48000,
      balance: 50000,
      priorAvg: 2000,
      hour: 2,
      channel: "UPI",
      usualChannel: "POS_Terminal",
      state: "Maharashtra",
      usualState: "Maharashtra",
      vel1h: 2,
      kyc: "Verified"
    });
    executeSimulation();
  });

  document.getElementById("sim-preset-burst")?.addEventListener("click", () => {
    setSimValues({
      amount: 20000,
      balance: 22000,
      priorAvg: 3000,
      hour: 23,
      channel: "ATM",
      usualChannel: "Mobile_App",
      state: "Delhi",
      usualState: "Maharashtra",
      vel1h: 4,
      kyc: "Pending"
    });
    executeSimulation();
  });
}

function setSimValues(v) {
  if (v.amount !== undefined) document.getElementById("sim-amount").value = v.amount;
  if (v.balance !== undefined) document.getElementById("sim-balance").value = v.balance;
  if (v.priorAvg !== undefined) document.getElementById("sim-prior-avg").value = v.priorAvg;
  if (v.hour !== undefined) document.getElementById("sim-hour").value = v.hour;
  if (v.channel !== undefined) document.getElementById("sim-channel").value = v.channel;
  if (v.usualChannel !== undefined) document.getElementById("sim-usual-channel").value = v.usualChannel;
  if (v.state !== undefined) document.getElementById("sim-state").value = v.state;
  if (v.usualState !== undefined) document.getElementById("sim-usual-state").value = v.usualState;
  if (v.vel1h !== undefined) document.getElementById("sim-vel-1h").value = v.vel1h;
  if (v.kyc !== undefined) document.getElementById("sim-kyc").value = v.kyc;
}

async function executeSimulation() {
  const payload = {
    transaction_amount: Number(document.getElementById("sim-amount")?.value || 1000),
    account_balance: Number(document.getElementById("sim-balance")?.value || 10000),
    customer_avg_amount_prior: Number(document.getElementById("sim-prior-avg")?.value || 1500),
    customer_median_amount_prior: Number(document.getElementById("sim-prior-avg")?.value || 1500) * 0.9,
    transaction_hour: Number(document.getElementById("sim-hour")?.value || 14),
    channel: document.getElementById("sim-channel")?.value || "Mobile_App",
    usual_channel_prior: document.getElementById("sim-usual-channel")?.value || "Mobile_App",
    state: document.getElementById("sim-state")?.value || "Maharashtra",
    usual_state_prior: document.getElementById("sim-usual-state")?.value || "Maharashtra",
    txn_count_prior_1h: Number(document.getElementById("sim-vel-1h")?.value || 0),
    kyc_status: document.getElementById("sim-kyc")?.value || "Verified"
  };

  try {
    const res = await API.postSimulate(payload);
    renderSimResults(res);
  } catch (err) {
    Toast.show(`Simulation failed: ${err.message}`, "error");
  }
}

function renderSimResults(res) {
  const badge = document.getElementById("sim-badge");
  const score = document.getElementById("sim-score");
  const meter = document.getElementById("sim-score-meter");
  const anomalyIdx = document.getElementById("sim-anomaly-idx");
  const activeFlags = document.getElementById("sim-active-flags");
  const triggersContainer = document.getElementById("sim-triggers-container");
  const recBox = document.getElementById("sim-recommendation-box");

  if (badge) badge.innerHTML = getRiskBadge(res.predicted_risk_level);
  if (score) score.innerHTML = `${res.predicted_risk_score.toFixed(1)}<span class="text-sm font-normal text-slate-400"> / 100</span>`;
  if (anomalyIdx) anomalyIdx.textContent = res.behavioral_anomaly_score.toFixed(1);
  if (activeFlags) activeFlags.textContent = `${res.active_flags_count} flag${res.active_flags_count === 1 ? '' : 's'} active`;

  if (meter) {
    meter.style.width = `${Math.min(100, Math.max(3, res.predicted_risk_score))}%`;
    meter.className = `score-meter-fill ${
      res.predicted_risk_level === 'Critical' ? 'bg-red-600' :
      res.predicted_risk_level === 'High' ? 'bg-orange-600' :
      res.predicted_risk_level === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-600'
    }`;
  }

  if (triggersContainer) {
    if (res.triggers && res.triggers.length > 0) {
      triggersContainer.innerHTML = res.triggers.map(t => `
        <div class="p-2 rounded border border-amber-200 bg-amber-50/70 text-amber-900 flex items-center gap-2">
          <span class="text-amber-600 flex-shrink-0">${Icons.alertTriangle}</span>
          <span class="font-medium">${t.desc}</span>
        </div>
      `).join("");
    } else {
      triggersContainer.innerHTML = `
        <div class="p-2.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-2">
          <span class="text-emerald-600">${Icons.checkCircle}</span>
          <span>No anomalies detected. Routine customer transaction.</span>
        </div>
      `;
    }
  }

  if (recBox) {
    recBox.textContent = res.recommendation;
    if (res.predicted_risk_level === "Critical") {
      recBox.className = "p-3 rounded bg-red-50 border border-red-200 text-xs font-bold text-red-900";
    } else if (res.predicted_risk_level === "High") {
      recBox.className = "p-3 rounded bg-orange-50 border border-orange-200 text-xs font-bold text-orange-900";
    } else if (res.predicted_risk_level === "Moderate") {
      recBox.className = "p-3 rounded bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900";
    } else {
      recBox.className = "p-3 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900";
    }
  }
}
