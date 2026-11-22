# Behaviour-Based Digital Banking Fraud Risk Assessment

A project exploring transaction-level behavioural features and risk classification for Indian digital banking transactions. The repository contains model experiments and an analyst-style dashboard for reviewing transaction risk.

This is an academic prototype. It is not connected to a bank and should not be used to approve, decline, or block real transactions.

## Project Components

### Model experiments

The notebooks compare four classification approaches:

- Decision Tree
- Random Forest
- Logistic Regression
- Gaussian Naive Bayes

The experiments use engineered behavioural and transaction features to assign transactions to four risk levels: Low, Moderate, High, and Critical.

### Dashboard

The dashboard combines a React frontend with a Flask API and a local SQLite database. Its main views cover:

- Transaction queue, filtering, and review
- Transaction-level details and audit history
- Behavioural analytics
- Stored model benchmark results
- A what-if risk simulator

The what-if simulator in `dashboard/backend/ml_engine.py` uses explicit rule-based scoring. It is separate from the trained classifiers evaluated in the notebooks.

## Evaluation Notes

The saved benchmark results show class imbalance. Overall accuracy is therefore not a sufficient measure of performance: the current results show weak recall for the High and Critical classes across several models.

The experiments should be treated as a comparison of modelling approaches, not evidence of reliable real-world fraud detection. Further work should focus on class-wise evaluation, threshold selection, temporal validation, and independent testing.

## Data

The source data is not included in this repository. The notebooks expect these prepared files in the repository root:

- `behavior_fraud_train_featured.csv`
- `behavior_fraud_test_featured.csv`

The dashboard database is initialized from `behavior_fraud_test_featured.csv`. Obtain the prepared files from an authorized source before running the notebooks or dashboard. Do not commit real customer or financial data.

## Run the Dashboard

The repository includes a built frontend under `dashboard/static`, so the Flask server can serve the dashboard without running the frontend development server.

From the repository root:

```bash
python -m venv .venv

# Windows
.venv\\Scripts\\activate

# macOS / Linux
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install Flask pandas numpy

python dashboard/backend/server.py
```

Place `behavior_fraud_test_featured.csv` in the repository root before starting the server. Then open:

```
http://127.0.0.1:5000
```

## Run the Frontend in Development

Start the Flask backend as described above. In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite runs on port 3000 and proxies `/api` requests to the Flask server on port 5000.

To rebuild the frontend bundle served by Flask:

```bash
cd frontend
npm run build
```

## Run the Notebooks

Install the notebook and modelling dependencies:

```bash
python -m pip install pandas numpy matplotlib seaborn scikit-learn jupyter
```

Place both prepared CSV files in the repository root, then launch Jupyter:

```bash
jupyter notebook
```

Open the relevant notebook from the repository root.

## Repository Layout

```text
.
├── Decision_Tree_Behavioral_Fraud_Risk.ipynb
├── Logistic_Regression_Behavioral_Fraud_Risk.ipynb
├── Random_Forest_Behavioral_Fraud_Risk.ipynb
├── Naive_Bayes_Behavioral_Fraud_Risk.ipynb
├── Model_Comparison.ipynb
├── dashboard/
│   ├── backend/       # Flask API, data access, analytics, risk simulation
│   └── static/        # Built frontend served by Flask
└── frontend/          # React and Vite source
```
