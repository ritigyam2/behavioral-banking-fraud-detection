# SentinelRisk React Frontend

A production-quality React application for the SentinelRisk Digital Banking Behavioral Fraud Intelligence Platform.

## Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + Enterprise Semantic Palette
- **Charts:** Chart.js
- **Typography:** Inter + JetBrains Mono

## Development
To run the React development server with Hot Module Replacement (HMR):

```bash
cd frontend
npm run dev
```

The dev server runs on `http://localhost:3000` (or `http://localhost:5173`) and automatically proxies all `/api/*` calls to the Flask backend on `http://127.0.0.1:5000`.

## Production Build
To compile the React SPA for production deployment:

```bash
cd frontend
npm run build
```

This compiles optimized bundles directly into `dashboard/static/`, allowing the Flask backend to serve the React application natively at `http://127.0.0.1:5000/`.
