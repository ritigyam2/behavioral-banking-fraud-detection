# Dashboard

This directory contains the Flask API and the built frontend for the behavioural fraud risk assessment project.

## Structure

- `backend/` — Flask routes, SQLite data access, analytics, and the rule-based what-if risk simulator
- `static/` — built frontend assets served by Flask

The React and Vite source code is maintained in the repository's `frontend/` directory.

## Setup

Follow the data requirements and installation instructions in the [repository README](../README.md). The dashboard needs the prepared `behavior_fraud_test_featured.csv` file in the repository root to initialize its local SQLite database.

From the repository root, start the API with:

```bash
python dashboard/backend/server.py
```

Then open:

```
http://127.0.0.1:5000
```

The dashboard is an academic prototype and is not intended for real transaction decisions.
