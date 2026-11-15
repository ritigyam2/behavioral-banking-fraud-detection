# SentinelRisk Dashboard

## Overview
This repository contains a production‑quality web dashboard for the **SentinelRisk** behavioral fraud risk assessment project. The dashboard is built with **Tailwind CSS**, **Chart.js**, and a **Flask** backend that serves static assets and provides the required REST APIs.

---

## Quick Start
1. **Install dependencies** (Python 3.9+ recommended)
   ```powershell
   cd "C:/Users/user/OneDrive/Desktop/MACHINE_LEARNING_PROJECT/dashboard"
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```
2. **Run the server**
   ```powershell
   python dashboard/backend/server.py
   ```
   The server starts on `http://127.0.0.1:5000` and serves the dashboard UI.

---

## UI Verification (Browser Sub‑Agent)
The dashboard UI needs to be inspected in a real browser to ensure:
- All pages load without console errors
- Navigation, filters, pagination, and drawer interactions work
- Charts render correctly and are responsive
- Accessibility attributes are present
- Layout adapts for desktop, tablet, and mobile breakpoints

### Enable Chrome Remote Debugging
The built‑in **browser sub‑agent** can drive Chrome via the DevTools protocol, but Chrome must be started with remote‑debugging enabled.

### Windows Command
```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome_debug"
```
- The `--user-data-dir` flag points to an empty profile folder to avoid interfering with your regular Chrome session.
- Keep this Chrome window open; the sub‑agent will connect to `http://localhost:9222`.

### After Chrome Is Running
1. Let me know that Chrome is ready (or use the `/browser` slash command).
2. I will invoke the browser sub‑agent to open `http://127.0.0.1:5000` and run the UI test checklist.

---

## Development Tips
- **Tailwind**: Styles are defined in `styles.css` using Tailwind utilities. Re‑run `npx tailwindcss -i ./styles.css -o ./dist/tailwind.css --watch` if you modify the source.
- **Chart.js**: All charts are instantiated in the corresponding view modules under `frontend/`. Data is fetched from the Flask API.
- **API Endpoints**
  - `/api/kpis`
  - `/api/transactions`
  - `/api/analytics`
  - `/api/models`
  - `/api/simulate`
  - `/api/audit-log`
  - (plus supporting routes for details, actions, and bulk updates)
- **Testing**: Run the server as a background task (`python -m dashboard.backend.server &`) and use the `/browser` command to open the UI.

---

## Next Steps
- **UI QA**: Once Chrome with remote debugging is running, I will execute the browser sub‑agent to verify the dashboard.
- **Responsive & Accessibility Review**: Adjust Tailwind classes if any layout issues appear on different viewports.
- **Polish**: Remove any leftover `console.log` statements and finalize loading/empty states.

If you encounter any issues starting the server or launching Chrome, let me know and we can troubleshoot.
