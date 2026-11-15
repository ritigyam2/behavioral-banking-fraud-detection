"""
Analytics Engine for Behavioral Fraud Risk Dashboard
Calculates statistical distributions, behavioral timelines, and geographic risk concentrations.
"""

try:
    from .data_engine import get_connection
except ImportError:
    from data_engine import get_connection

def get_analytics():
    """Returns precomputed and dynamically aggregated analytical summaries."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Hourly Transaction & Risk Distribution (0-23 hours)
    cursor.execute("""
    SELECT 
        transaction_hour,
        COUNT(*) as total_count,
        SUM(CASE WHEN risk_level IN ('High', 'Critical') THEN 1 ELSE 0 END) as risky_count,
        SUM(transaction_amount) as total_volume
    FROM transactions
    GROUP BY transaction_hour
    ORDER BY transaction_hour ASC
    """)
    hourly_data = [
        {
            "hour": f"{int(row['transaction_hour']):02d}:00",
            "total": row["total_count"],
            "risky": row["risky_count"],
            "volume": round(row["total_volume"], 2)
        }
        for row in cursor.fetchall()
    ]

    # 2. Channel Distribution by Risk Tier
    cursor.execute("""
    SELECT 
        channel,
        SUM(CASE WHEN risk_level IN ('Low', 'Low Risk') THEN 1 ELSE 0 END) as low_count,
        SUM(CASE WHEN risk_level IN ('Moderate', 'Moderate Risk') THEN 1 ELSE 0 END) as mod_count,
        SUM(CASE WHEN risk_level IN ('High', 'High Risk') THEN 1 ELSE 0 END) as high_count,
        SUM(CASE WHEN risk_level IN ('Critical', 'Critical Risk') THEN 1 ELSE 0 END) as crit_count,
        COUNT(*) as total_channel
    FROM transactions
    GROUP BY channel
    ORDER BY total_channel DESC
    """)
    channel_data = [
        {
            "channel": row["channel"].replace("_", " "),
            "low": row["low_count"],
            "moderate": row["mod_count"],
            "high": row["high_count"],
            "critical": row["crit_count"],
            "total": row["total_channel"]
        }
        for row in cursor.fetchall()
    ]

    # 3. State Risk Distribution (Top 10 Indian States)
    cursor.execute("""
    SELECT 
        state,
        COUNT(*) as total_txns,
        SUM(CASE WHEN risk_level IN ('High', 'Critical') THEN 1 ELSE 0 END) as high_risk_txns,
        SUM(transaction_amount) as total_volume,
        AVG(risk_score) as avg_risk_score
    FROM transactions
    GROUP BY state
    ORDER BY high_risk_txns DESC, total_txns DESC
    LIMIT 10
    """)
    state_data = [
        {
            "state": row["state"],
            "total": row["total_txns"],
            "risky": row["high_risk_txns"],
            "risk_rate_pct": round((row["high_risk_txns"] / row["total_txns"]) * 100, 2),
            "volume_inr": round(row["total_volume"], 2),
            "avg_risk_score": round(row["avg_risk_score"], 2)
        }
        for row in cursor.fetchall()
    ]

    # 4. Merchant Category Breakdown
    cursor.execute("""
    SELECT 
        merchant_category,
        COUNT(*) as total_txns,
        SUM(CASE WHEN risk_level IN ('High', 'Critical') THEN 1 ELSE 0 END) as high_risk_txns,
        SUM(transaction_amount) as total_volume
    FROM transactions
    GROUP BY merchant_category
    ORDER BY total_txns DESC
    """)
    merchant_data = [
        {
            "category": row["merchant_category"],
            "total": row["total_txns"],
            "risky": row["high_risk_txns"],
            "volume": round(row["total_volume"], 2)
        }
        for row in cursor.fetchall()
    ]

    # 5. Top Risk Triggers Breakdown
    cursor.execute("""
    SELECT risk_reasons FROM transactions WHERE risk_level IN ('High', 'Critical', 'Moderate') LIMIT 15000
    """)
    trigger_counts = {}
    for r in cursor.fetchall():
        reasons = r["risk_reasons"]
        if reasons:
            for item in reasons.split("|"):
                item_clean = item.strip()
                if item_clean:
                    trigger_counts[item_clean] = trigger_counts.get(item_clean, 0) + 1

    sorted_triggers = sorted(trigger_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    triggers_data = [
        {
            "trigger": k.replace("_", " ").title(),
            "count": v,
            "code": k
        }
        for k, v in sorted_triggers
    ]

    # 6. Transaction Amount Range Distribution
    cursor.execute("""
    SELECT 
        CASE 
            WHEN transaction_amount < 500 THEN '₹0 - ₹500'
            WHEN transaction_amount < 2000 THEN '₹500 - ₹2K'
            WHEN transaction_amount < 5000 THEN '₹2K - ₹5K'
            WHEN transaction_amount < 20000 THEN '₹5K - ₹20K'
            WHEN transaction_amount < 50000 THEN '₹20K - ₹50K'
            ELSE '₹50K+'
        END as amount_bucket,
        COUNT(*) as total_count,
        SUM(CASE WHEN risk_level IN ('High', 'Critical') THEN 1 ELSE 0 END) as risky_count
    FROM transactions
    GROUP BY amount_bucket
    ORDER BY MIN(transaction_amount) ASC
    """)
    bucket_order = ['₹0 - ₹500', '₹500 - ₹2K', '₹2K - ₹5K', '₹5K - ₹20K', '₹20K - ₹50K', '₹50K+']
    bucket_dict = {row["amount_bucket"]: {"total": row["total_count"], "risky": row["risky_count"]} for row in cursor.fetchall()}
    amount_buckets = [
        {
            "bucket": b,
            "total": bucket_dict.get(b, {}).get("total", 0),
            "risky": bucket_dict.get(b, {}).get("risky", 0)
        }
        for b in bucket_order
    ]

    conn.close()

    return {
        "hourly_distribution": hourly_data,
        "channel_distribution": channel_data,
        "state_distribution": state_data,
        "merchant_distribution": merchant_data,
        "top_risk_triggers": triggers_data,
        "amount_distribution": amount_buckets
    }
