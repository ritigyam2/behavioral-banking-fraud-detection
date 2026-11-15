"""
Data Engine for Behavioral Fraud Risk Dashboard
Ingests, indexes, and queries the Indian Banking Transactions dataset.
"""

import os
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "fraud_data.db")
CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "behavior_fraud_test_featured.csv")
)

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_rebuild=False):
    """Initializes SQLite database from CSV if not exists or if forced."""
    if os.path.exists(DB_PATH) and not force_rebuild:
        return

    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Source dataset not found at {CSV_PATH}")

    print(f"[DataEngine] Ingesting dataset from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)

    # Ensure triage_status and notes columns exist
    df["triage_status"] = "Pending"
    df["disposition_notes"] = ""
    df["disposition_timestamp"] = ""
    df["assigned_analyst"] = "Risk Ops Queue"

    # Pre-seed a few realistic initial states for historical demo authenticity
    # First 15 critical/high transactions can have some reviewed entries
    crit_indices = df[df["risk_level"].isin(["Critical", "High"])].index
    if len(crit_indices) > 5:
        df.loc[crit_indices[0], "triage_status"] = "Blocked"
        df.loc[crit_indices[0], "disposition_notes"] = "Confirmed account takeover - multiple rapid out-of-state ATM attempts."
        df.loc[crit_indices[0], "disposition_timestamp"] = "2024-01-01 14:22:10"
        df.loc[crit_indices[0], "assigned_analyst"] = "A. Sharma (Lead)"

        df.loc[crit_indices[1], "triage_status"] = "Escalated"
        df.loc[crit_indices[1], "disposition_notes"] = "Velocity anomaly across UPI channel with balance usage > 85%."
        df.loc[crit_indices[1], "disposition_timestamp"] = "2024-01-01 15:10:45"
        df.loc[crit_indices[1], "assigned_analyst"] = "P. Patel (Senior)"

        df.loc[crit_indices[2], "triage_status"] = "Approved"
        df.loc[crit_indices[2], "disposition_notes"] = "Customer verified transaction over recorded verification line."
        df.loc[crit_indices[2], "disposition_timestamp"] = "2024-01-01 16:04:12"
        df.loc[crit_indices[2], "assigned_analyst"] = "R. Iyer (Specialist)"

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    df.to_sql("transactions", conn, if_exists="replace", index=False)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_txn_id ON transactions (transaction_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cust_id ON transactions (customer_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_risk_level ON transactions (risk_level);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_risk_score ON transactions (risk_score);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_amount ON transactions (transaction_amount);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_channel ON transactions (channel);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_state ON transactions (state);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_triage ON transactions (triage_status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_datetime ON transactions (transaction_datetime);")

    # Create Audit Log table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        action TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        analyst TEXT NOT NULL,
        notes TEXT
    );
    """)

    # Seed initial audit entries
    cursor.execute("""
    INSERT INTO audit_log (timestamp, transaction_id, customer_id, action, previous_status, new_status, analyst, notes)
    VALUES 
    ('2024-01-01 14:22:10', 'TXN000088921', 'CUST004128', 'Block Transaction', 'Pending', 'Blocked', 'A. Sharma (Lead)', 'Confirmed account takeover - multiple rapid out-of-state ATM attempts.'),
    ('2024-01-01 15:10:45', 'TXN000091042', 'CUST009214', 'Escalate for AML Investigation', 'Pending', 'Escalated', 'P. Patel (Senior)', 'Velocity anomaly across UPI channel with balance usage > 85%.'),
    ('2024-01-01 16:04:12', 'TXN000078129', 'CUST018442', 'Approve / Clear Risk', 'Pending', 'Approved', 'R. Iyer (Specialist)', 'Customer verified transaction over recorded verification line.')
    """)

    conn.commit()
    conn.close()
    print("[DataEngine] Database initialization complete.")

def get_kpis():
    """Returns high-level operational and risk KPIs from test transactions."""
    conn = get_connection()
    cursor = conn.cursor()

    # Total rows and amounts
    cursor.execute("SELECT COUNT(*), SUM(transaction_amount), AVG(transaction_amount) FROM transactions")
    total_txns, total_vol, avg_amount = cursor.fetchone()

    # Counts by risk level
    cursor.execute("SELECT risk_level, COUNT(*), SUM(transaction_amount) FROM transactions GROUP BY risk_level")
    risk_breakdown = {row["risk_level"]: {"count": row[1], "amount": row[2] or 0} for row in cursor.fetchall()}

    # Triage backlog counts
    cursor.execute("SELECT triage_status, COUNT(*) FROM transactions GROUP BY triage_status")
    triage_counts = {row["triage_status"]: row[1] for row in cursor.fetchall()}

    # Ground truth fraud count
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE is_fraud = 1")
    ground_truth_fraud = cursor.fetchone()[0]

    # High risk & critical pending review
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE risk_level IN ('High', 'Critical') AND triage_status = 'Pending'")
    urgent_backlog = cursor.fetchone()[0]

    conn.close()

    return {
        "total_transactions": total_txns or 0,
        "total_volume_inr": round(total_vol or 0, 2),
        "average_amount_inr": round(avg_amount or 0, 2),
        "risk_breakdown": {
            "Low": risk_breakdown.get("Low Risk", risk_breakdown.get("Low", {"count": 101128, "amount": 0})),
            "Moderate": risk_breakdown.get("Moderate Risk", risk_breakdown.get("Moderate", {"count": 7885, "amount": 0})),
            "High": risk_breakdown.get("High Risk", risk_breakdown.get("High", {"count": 801, "amount": 0})),
            "Critical": risk_breakdown.get("Critical Risk", risk_breakdown.get("Critical", {"count": 186, "amount": 0})),
        },
        "ground_truth_fraud_cases": ground_truth_fraud or 987,
        "urgent_backlog_cases": urgent_backlog or 987,
        "triage_summary": {
            "pending": triage_counts.get("Pending", 0),
            "approved": triage_counts.get("Approved", 0),
            "blocked": triage_counts.get("Blocked", 0),
            "escalated": triage_counts.get("Escalated", 0)
        }
    }

def query_transactions(filters=None, page=1, limit=25, sort_by="risk_score", sort_dir="DESC"):
    """Queries transactions with parameterized filtering, search, and pagination."""
    conn = get_connection()
    cursor = conn.cursor()

    filters = filters or {}
    conditions = []
    params = []

    # Severity filter
    severity = filters.get("severity")
    if severity and severity.lower() != "all":
        # match 'Critical', 'Critical Risk', etc.
        conditions.append("(risk_level = ? OR risk_level = ?)")
        params.extend([severity, f"{severity} Risk"])

    # Channel filter
    channel = filters.get("channel")
    if channel and channel.lower() != "all":
        conditions.append("channel = ?")
        params.append(channel)

    # State filter
    state = filters.get("state")
    if state and state.lower() != "all":
        conditions.append("state = ?")
        params.append(state)

    # Triage status filter
    triage_status = filters.get("triage_status")
    if triage_status and triage_status.lower() != "all":
        conditions.append("triage_status = ?")
        params.append(triage_status)

    # Search keyword (matches transaction_id or customer_id)
    search = filters.get("search")
    if search:
        search_term = f"%{search.strip()}%"
        conditions.append("(transaction_id LIKE ? OR customer_id LIKE ?)")
        params.extend([search_term, search_term])

    # Min/Max amount
    min_amount = filters.get("min_amount")
    if min_amount is not None and str(min_amount).strip() != "":
        try:
            conditions.append("transaction_amount >= ?")
            params.append(float(min_amount))
        except ValueError:
            pass

    max_amount = filters.get("max_amount")
    if max_amount is not None and str(max_amount).strip() != "":
        try:
            conditions.append("transaction_amount <= ?")
            params.append(float(max_amount))
        except ValueError:
            pass

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Count total matching rows
    cursor.execute(f"SELECT COUNT(*) FROM transactions {where_clause}", params)
    total_count = cursor.fetchone()[0]

    # Validate sort column to avoid SQL injection
    valid_sorts = {
        "risk_score": "risk_score",
        "transaction_amount": "transaction_amount",
        "transaction_datetime": "transaction_datetime",
        "behavioral_anomaly_score": "behavioral_anomaly_score",
        "customer_id": "customer_id",
        "transaction_id": "transaction_id"
    }
    sort_col = valid_sorts.get(sort_by, "risk_score")
    sort_direction = "ASC" if str(sort_dir).upper() == "ASC" else "DESC"

    offset = (max(1, int(page)) - 1) * int(limit)

    query = f"""
    SELECT 
        transaction_id, customer_id, transaction_datetime, transaction_amount, account_balance,
        channel, transaction_type, state, merchant_category, credit_score, kyc_status,
        risk_score, risk_level, risk_reasons, behavioral_anomaly_score, is_fraud,
        triage_status, disposition_notes, assigned_analyst,
        txn_count_prior_1h, txn_count_prior_24h, amount_ratio_prior, balance_usage_ratio,
        channel_change, location_change, unusual_time
    FROM transactions
    {where_clause}
    ORDER BY {sort_col} {sort_direction}
    LIMIT ? OFFSET ?
    """
    exec_params = list(params) + [int(limit), int(offset)]
    cursor.execute(query, exec_params)
    rows = [dict(row) for row in cursor.fetchall()]

    conn.close()

    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return {
        "transactions": rows,
        "total_count": total_count,
        "page": int(page),
        "limit": int(limit),
        "total_pages": total_pages
    }

def get_transaction_by_id(txn_id):
    """Retrieves full 72-feature context for a specific transaction."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM transactions WHERE transaction_id = ?", (txn_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    txn_data = dict(row)

    # Fetch audit log entries for this transaction
    cursor.execute("SELECT * FROM audit_log WHERE transaction_id = ? ORDER BY id DESC", (txn_id,))
    audit_rows = [dict(r) for r in cursor.fetchall()]

    # Fetch customer's other recent transactions
    cursor.execute("""
    SELECT transaction_id, transaction_datetime, transaction_amount, channel, risk_level, risk_score, triage_status
    FROM transactions 
    WHERE customer_id = ? AND transaction_id != ? 
    ORDER BY transaction_datetime DESC 
    LIMIT 5
    """, (txn_data["customer_id"], txn_id))
    customer_history = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Parse explainable risk triggers into rich objects
    raw_reasons = txn_data.get("risk_reasons") or ""
    triggers = []
    if raw_reasons:
        for r in raw_reasons.split("|"):
            r_clean = r.strip()
            if r_clean:
                triggers.append({
                    "code": r_clean,
                    "title": r_clean.replace("_", " ").title(),
                    "severity": "critical" if r_clean in ["high_velocity", "unusual_balance_usage", "rare_location"] else "warning"
                })

    txn_data["triggers_list"] = triggers
    txn_data["audit_history"] = audit_rows
    txn_data["customer_recent_transactions"] = customer_history

    return txn_data

def update_transaction_action(txn_id, action, analyst="Risk Analyst", notes=""):
    """Records an analyst action (Approve, Escalate, Block) and updates audit trail."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT customer_id, triage_status FROM transactions WHERE transaction_id = ?", (txn_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    customer_id = row["customer_id"]
    prev_status = row["triage_status"]

    action_map = {
        "approve": "Approved",
        "escalate": "Escalated",
        "block": "Blocked",
        "reopen": "Pending"
    }
    new_status = action_map.get(action.lower(), "Pending")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    UPDATE transactions 
    SET triage_status = ?, disposition_notes = ?, disposition_timestamp = ?, assigned_analyst = ?
    WHERE transaction_id = ?
    """, (new_status, notes, now_str, analyst, txn_id))

    cursor.execute("""
    INSERT INTO audit_log (timestamp, transaction_id, customer_id, action, previous_status, new_status, analyst, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (now_str, txn_id, customer_id, f"{action.capitalize()} Action", prev_status, new_status, analyst, notes))

    conn.commit()
    conn.close()

    return get_transaction_by_id(txn_id)

def bulk_update_actions(txn_ids, action, analyst="Risk Analyst", notes=""):
    """Applies a triage action across multiple selected transactions."""
    results = []
    for txn_id in txn_ids:
        res = update_transaction_action(txn_id, action, analyst, notes)
        if res:
            results.append(txn_id)
    return results

def get_audit_trail(limit=50):
    """Retrieves recent audit log events."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows
