# College Planner (Simple Student Planner)

A minimal, fast planner for busy students. No login. No clutter. Works offline with `localStorage` and supports a local FastAPI backend for development.

## Notes on storage
- Local development uses a JSON file (`/data/tasks.json`) via the FastAPI API.
- Vercel serverless functions do **not** have persistent disk storage.
- On Vercel, the app defaults to **browser localStorage** so it still works offline.

## How to run locally

### Mac
1. Open Terminal and go to the project folder:
   ```bash
   cd "/Users/josephcianfrini/Documents/New project/college_planner"
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend API:
   ```bash
   uvicorn api.index:app --reload --port 8000
   ```
5. In a second Terminal, serve the frontend:
   ```bash
   cd "/Users/josephcianfrini/Documents/New project/college_planner/public"
   python3 -m http.server 5173
   ```
6. Open your browser to:
   ```
   http://localhost:5173
   ```

### Windows (PowerShell)
1. Go to the project folder:
   ```powershell
   cd "C:\Users\<you>\Documents\New project\college_planner"
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Run the backend API:
   ```powershell
   uvicorn api.index:app --reload --port 8000
   ```
5. In a second PowerShell, serve the frontend:
   ```powershell
   cd "C:\Users\<you>\Documents\New project\college_planner\public"
   python -m http.server 5173
   ```
6. Open your browser to:
   ```
   http://localhost:5173
   ```

## How to deploy on Vercel
1. Push this project to GitHub.
2. In Vercel, click **Add New → Project** and import the GitHub repo.
3. Framework preset: **Other**.
4. Build command: **None**.
5. Output directory: **public**.
6. Deploy.

## What to change next (easy improvements)
1. Add a search bar for tasks.
2. Add a dark mode toggle.
3. Add recurring tasks (weekly classes).
4. Allow drag-and-drop ordering.
5. Export tasks to a CSV file.
