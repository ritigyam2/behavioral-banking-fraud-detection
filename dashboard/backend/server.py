"""
Flask Server for Behavioral Fraud Risk Assessment Web Dashboard
Exposes RESTful APIs and serves the static production frontend.
"""

import os
import sys

# Ensure backend directory is in sys.path for direct script execution
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from flask import Flask, jsonify, request, send_from_directory

try:
    from .data_engine import (
        init_db,
        get_kpis,
        query_transactions,
        get_transaction_by_id,
        update_transaction_action,
        bulk_update_actions,
        get_audit_trail
    )
    from .analytics_engine import get_analytics
    from .ml_engine import get_model_benchmarks, simulate_transaction_risk
except ImportError:
    from data_engine import (
        init_db,
        get_kpis,
        query_transactions,
        get_transaction_by_id,
        update_transaction_action,
        bulk_update_actions,
        get_audit_trail
    )
    from analytics_engine import get_analytics
    from ml_engine import get_model_benchmarks, simulate_transaction_risk

STATIC_FOLDER = os.path.abspath(os.path.join(CURRENT_DIR, "..", "static"))

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="")

# Initialize database on module load / startup
try:
    init_db()
except Exception as e:
    print(f"[Warning] DB Initialization error: {e}")

@app.after_request
def add_security_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    return response

# Serve Frontend SPA
@app.route("/")
def index():
    return send_from_directory(STATIC_FOLDER, "index.html")

# Serve Frontend Built Assets
@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory(os.path.join(STATIC_FOLDER, "assets"), filename)

# API Health Check
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "engine": "Behavioral Fraud Risk Engine v2.4",
        "dataset": "Indian Banking Transactions (2019-2024)",
        "scope": "Chronological Evaluation Set (110,000 transactions)"
    })

# KPIs & Operational Counts
@app.route("/api/kpis", methods=["GET"])
def kpis_endpoint():
    try:
        data = get_kpis()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Transaction Triage Queue (Search, Filter, Paginate)
@app.route("/api/transactions", methods=["GET"])
def transactions_endpoint():
    try:
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 25, type=int)
        sort_by = request.args.get("sort_by", "risk_score")
        sort_dir = request.args.get("sort_dir", "DESC")

        filters = {
            "severity": request.args.get("severity"),
            "channel": request.args.get("channel"),
            "state": request.args.get("state"),
            "triage_status": request.args.get("triage_status"),
            "search": request.args.get("search"),
            "min_amount": request.args.get("min_amount"),
            "max_amount": request.args.get("max_amount"),
        }

        result = query_transactions(filters, page=page, limit=limit, sort_by=sort_by, sort_dir=sort_dir)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Detailed Transaction Forensic Sheet
@app.route("/api/transactions/<txn_id>", methods=["GET"])
def transaction_detail(txn_id):
    try:
        data = get_transaction_by_id(txn_id)
        if not data:
            return jsonify({"success": False, "error": "Transaction not found"}), 404
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Analyst Action (Approve, Escalate, Block)
@app.route("/api/transactions/<txn_id>/action", methods=["POST"])
def transaction_action(txn_id):
    try:
        body = request.get_json() or {}
        action = body.get("action", "approve")
        analyst = body.get("analyst", "A. Sharma (Lead)")
        notes = body.get("notes", "")

        updated = update_transaction_action(txn_id, action, analyst=analyst, notes=notes)
        if not updated:
            return jsonify({"success": False, "error": "Failed to update transaction"}), 400

        return jsonify({"success": True, "data": updated})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Bulk Triage Action
@app.route("/api/transactions/bulk-action", methods=["POST"])
def bulk_action():
    try:
        body = request.get_json() or {}
        txn_ids = body.get("transaction_ids", [])
        action = body.get("action", "approve")
        analyst = body.get("analyst", "A. Sharma (Lead)")
        notes = body.get("notes", "Bulk triage disposition")

        updated_ids = bulk_update_actions(txn_ids, action, analyst=analyst, notes=notes)
        return jsonify({"success": True, "updated_count": len(updated_ids), "transaction_ids": updated_ids})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Behavioral Analytics Distributions
@app.route("/api/analytics", methods=["GET"])
def analytics_endpoint():
    try:
        data = get_analytics()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ML Model Evaluation Suite
@app.route("/api/models", methods=["GET"])
def models_endpoint():
    try:
        data = get_model_benchmarks()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# What-If Risk Simulator
@app.route("/api/simulate", methods=["POST"])
def simulate_endpoint():
    try:
        body = request.get_json() or {}
        result = simulate_transaction_risk(body)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Audit Log
@app.route("/api/audit-log", methods=["GET"])
def audit_endpoint():
    try:
        limit = request.args.get("limit", 50, type=int)
        data = get_audit_trail(limit=limit)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
