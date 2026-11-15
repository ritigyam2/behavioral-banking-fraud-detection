import React, { useState } from "react";
import { RiskBadge, Icons } from "../utils";
import { API } from "../api";
import { Toast } from "../components/Toast";

export function SimulatorView() {
  const [amount, setAmount] = useState(1250);
  const [balance, setBalance] = useState(18500);
  const [priorAvg, setPriorAvg] = useState(1400);
  const [hour, setHour] = useState(14);
  const [channel, setChannel] = useState("Mobile_App");
  const [usualChannel, setUsualChannel] = useState("Mobile_App");
  const [state, setState] = useState("Maharashtra");
  const [usualState, setUsualState] = useState("Maharashtra");
  const [vel1h, setVel1h] = useState(0);
  const [kyc, setKyc] = useState("Verified");

  const [simResult, setSimResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const applyPreset = (preset) => {
    if (preset === "normal") {
      setAmount(450);
      setBalance(24000);
      setPriorAvg(500);
      setHour(13);
      setChannel("POS_Terminal");
      setUsualChannel("POS_Terminal");
      setState("Maharashtra");
      setUsualState("Maharashtra");
      setVel1h(0);
      setKyc("Verified");
    } else if (preset === "midnight") {
      setAmount(48000);
      setBalance(50000);
      setPriorAvg(2000);
      setHour(2);
      setChannel("UPI");
      setUsualChannel("POS_Terminal");
      setState("Maharashtra");
      setUsualState("Maharashtra");
      setVel1h(2);
      setKyc("Verified");
    } else if (preset === "burst") {
      setAmount(20000);
      setBalance(22000);
      setPriorAvg(3000);
      setHour(23);
      setChannel("ATM");
      setUsualChannel("Mobile_App");
      setState("Delhi");
      setUsualState("Maharashtra");
      setVel1h(4);
      setKyc("Pending");
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    const payload = {
      transaction_amount: Number(amount),
      account_balance: Number(balance),
      customer_avg_amount_prior: Number(priorAvg),
      customer_median_amount_prior: Number(priorAvg) * 0.9,
      transaction_hour: Number(hour),
      channel,
      usual_channel_prior: usualChannel,
      state,
      usual_state_prior: usualState,
      txn_count_prior_1h: Number(vel1h),
      kyc_status: kyc,
    };

    try {
      const res = await API.postSimulate(payload);
      setSimResult(res);
    } catch (err) {
      Toast.show(`Simulation failed: ${err.message}`, "error");
    } finally {
      setEvaluating(false);
    }
  };

  const score = Number(simResult?.predicted_risk_score || 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Interactive What-If Risk Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Test hypothetical transactions against the behavioral fraud detection engine in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Preset Scenarios:</span>
          <button
            onClick={() => {
              applyPreset("normal");
            }}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors"
          >
            Routine POS
          </button>
          <button
            onClick={() => {
              applyPreset("midnight");
            }}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-red-700 shadow-xs transition-colors"
          >
            Midnight Drain
          </button>
          <button
            onClick={() => {
              applyPreset("burst");
            }}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-orange-700 shadow-xs transition-colors"
          >
            ATM Burst
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Transaction & Customer Parameters
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Adjust variables to test multi-trigger non-linear risk escalation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Amount */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Transaction Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Current attempted payment</span>
            </div>

            {/* Available Balance */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Available Account Balance (₹)
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Liquid funds before transaction</span>
            </div>

            {/* Prior Historical Average */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Historical Avg Amount (₹)
              </label>
              <input
                type="number"
                value={priorAvg}
                onChange={(e) => setPriorAvg(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Customer 30-day baseline</span>
            </div>

            {/* Hour of Transaction */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Transaction Hour (0–23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Off-hour window is 22:00–05:00</span>
            </div>

            {/* Channel */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Mobile_App">Mobile App</option>
                <option value="Net_Banking">Net Banking</option>
                <option value="UPI">UPI</option>
                <option value="POS_Terminal">POS Terminal</option>
                <option value="ATM">ATM Withdrawal</option>
              </select>
            </div>

            {/* Usual Channel */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Usual Channel</label>
              <select
                value={usualChannel}
                onChange={(e) => setUsualChannel(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Mobile_App">Mobile App</option>
                <option value="Net_Banking">Net Banking</option>
                <option value="UPI">UPI</option>
                <option value="POS_Terminal">POS Terminal</option>
                <option value="ATM">ATM Withdrawal</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Telangana">Telangana</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi">Delhi</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>

            {/* Usual State */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Usual State</label>
              <select
                value={usualState}
                onChange={(e) => setUsualState(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Telangana">Telangana</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi">Delhi</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>

            {/* 1h Velocity */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Transactions in Prior 1 Hour
              </label>
              <input
                type="number"
                min="0"
                value={vel1h}
                onChange={(e) => setVel1h(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Burst threshold: &ge; 3</span>
            </div>

            {/* KYC Status */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer KYC Status</label>
              <select
                value={kyc}
                onChange={(e) => setKyc(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed / Expired</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Runs real-time behavioral feature derivation
            </span>
            <button
              disabled={evaluating}
              onClick={handleEvaluate}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {Icons.cpu} {evaluating ? "Evaluating..." : "Evaluate Risk Score"}
            </button>
          </div>
        </div>

        {/* Right: Results Card (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Evaluation Verdict
              </h3>
              {simResult && <RiskBadge level={simResult.predicted_risk_level} />}
            </div>

            {/* Score Display */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
              <div className="text-[11px] text-slate-500 font-medium">Computed Continuous Risk Score</div>
              <div className="text-4xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {simResult ? (
                  <>
                    {score.toFixed(1)}
                    <span className="text-sm font-normal text-slate-400"> / 100</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div className="mt-2 score-meter-track">
                <div
                  className={`score-meter-fill ${
                    simResult?.predicted_risk_level === "Critical"
                      ? "bg-red-600"
                      : simResult?.predicted_risk_level === "High"
                      ? "bg-orange-600"
                      : simResult?.predicted_risk_level === "Moderate"
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{
                    width: simResult ? `${Math.min(100, Math.max(3, score))}%` : "0%",
                  }}
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>
                  Anomaly Index:{" "}
                  <strong className="text-slate-800 font-mono">
                    {simResult ? simResult.behavioral_anomaly_score.toFixed(1) : "0.0"}
                  </strong>
                </span>
                <span className="font-semibold text-slate-700">
                  {simResult
                    ? `${simResult.active_flags_count} flag${
                        simResult.active_flags_count === 1 ? "" : "s"
                      } active`
                    : "0 flags active"}
                </span>
              </div>
            </div>

            {/* Active Triggers List */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Active Behavioral Signals
              </div>
              <div className="space-y-1.5 text-xs">
                {simResult?.triggers && simResult.triggers.length > 0 ? (
                  simResult.triggers.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded border border-amber-200 bg-amber-50/70 text-amber-900 flex items-center gap-2"
                    >
                      <span className="text-amber-600 flex-shrink-0">{Icons.alertTriangle}</span>
                      <span className="font-medium">{t.desc}</span>
                    </div>
                  ))
                ) : simResult ? (
                  <div className="p-2.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-2">
                    <span className="text-emerald-600">{Icons.checkCircle}</span>
                    <span>No anomalies detected. Routine customer transaction.</span>
                  </div>
                ) : (
                  <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-400 text-center">
                    Click "Evaluate Risk Score" to run model
                  </div>
                )}
              </div>
            </div>

            {/* Operational Decision Recommendation */}
            <div>
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Operational Protocol Recommendation
              </div>
              <div
                className={`p-3 rounded border text-xs font-semibold ${
                  simResult?.predicted_risk_level === "Critical"
                    ? "bg-red-50 border-red-200 text-red-900"
                    : simResult?.predicted_risk_level === "High"
                    ? "bg-orange-50 border-orange-200 text-orange-900"
                    : simResult?.predicted_risk_level === "Moderate"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : simResult
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                {simResult?.recommendation || "Awaiting simulation execution..."}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            Simulated output is for risk triage assistance and follows Decision Tree thresholds.
          </div>
        </div>
      </div>
    </div>
  );
}
