## Prerequisites
- Install `Node.js` (LTS) and `npm` on Windows.
- Install `Python` (3.11+ recommended) and `pip`.
- Ensure ports `8000` and `3000`/`3001` are available.

## Backend (FastAPI) Setup
- Navigate: `cd d:\app1\backend`.
- Create/activate virtual env (if not already active):
  - Create: `python -m venv .venv`
  - Activate: `.\.venv\Scripts\Activate.ps1`
- Install dependencies: `pip install -r requirements.txt`.
- Configure environment:
  - Verify `backend\.env` exists; set:
    - `MONGO_URL`, `DB_NAME`, `JWT_SECRET_KEY`.
    - `CORS_ORIGINS` include `http://localhost:3001`.
    - Optional `MEMORY_DB=1` to use in-memory data (dev mode).
- Start API: `uvicorn server:app --host 0.0.0.0 --port 8000 --reload`.
- Verify: request `http://localhost:8000/api/` returns status JSON.

## Frontend (React/CRACO) Setup
- Navigate: `cd d:\app1\frontend`.
- Ensure `frontend\.env` contains `REACT_APP_BACKEND_URL=http://localhost:8000`.
- Install dependencies: `npm install --legacy-peer-deps` (avoids peer conflicts with React 19 + CRA).
- Start dev server:
  - If `3000` free: `npm start`.
  - If `3000` busy: PowerShell ` $env:PORT=3001; npm start`.
- Open app: `http://localhost:3001/` (or `3000` if used).

## Usage & Verification
- Login: use the Login screen; token is stored in `localStorage` and attached to API calls.
- Verify pages:
  - Courses: calls `GET /api/courses` and should show sample courses (memory mode).
  - Dashboard/Events/Study Groups: data loads via the shared Axios client (base `http://localhost:8000/api`).

## Troubleshooting
- CORS error: add `http://localhost:3001` to `CORS_ORIGINS` in backend `.env`, then restart backend.
- 401 Unauthorized: re-login; ensure token exists in `localStorage`.
- Event/Study Group creation 503: these write endpoints require MongoDB; in memory mode only reads return data.
- Port conflict on `3000`: use `3001` as shown above.

## Next Step
- Confirm and I will execute these steps for you (install deps, start servers, and validate endpoints).