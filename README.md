# Patient Admission Management App

## Overview

A small patient-admission app for recording and managing hospital admissions. The frontend is a React single-page app, the API is built with FastAPI, and patient records are stored in SQLite.

## Features

- Add and view patient records
- Search by patient name
- Filter by ward, department, and doctor
- Edit and delete patient records (deletion requires confirmation)
- Mark patients as discharged
- Frontend and backend validation
- Responsive desktop, tablet, and mobile layout

## Tech Stack

- Frontend: React, Vite
- Backend: Python, FastAPI, Uvicorn
- Database: SQLite
- ORM: SQLAlchemy

## Architecture

```text
React frontend
      ↓ HTTP/JSON
FastAPI backend
      ↓ SQLAlchemy
SQLite database
```

## Local Setup

### Backend (PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`. The API documentation is at `http://127.0.0.1:8000/docs`.

The SQLite database defaults to `backend/app/database.db`. To use another path, set `DATABASE_PATH` in the backend process environment before starting Uvicorn.

### Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the local frontend URL, normally `http://localhost:5173`. The frontend defaults to the API at `http://127.0.0.1:8000`. To override it, copy `frontend/.env.example` to `frontend/.env.local`, edit `VITE_API_BASE_URL`, and restart Vite.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/patients` | List patients; supports search and filters |
| POST | `/api/patients` | Create a patient |
| GET | `/api/patients/{patient_id}` | Get one patient |
| PUT | `/api/patients/{patient_id}` | Update editable patient details |
| PATCH | `/api/patients/{patient_id}/discharge` | Mark a patient as discharged |
| DELETE | `/api/patients/{patient_id}` | Delete a patient |

`GET /api/patients` accepts these optional query parameters. When more than one is provided, the API applies all supplied filters together:

- `search`: case-insensitive partial match against the patient name
- `ward`: exact ward choice
- `department`: exact department choice
- `doctor`: exact doctor choice

For example: `/api/patients?search=alex&ward=ICU&department=Cardiology`.

## Validation

The frontend requires all patient fields, accepts names containing letters and spaces, restricts age to an integer from 0 through 120, and prevents future admission dates. The API independently validates the same fields and allowed select values; invalid requests return HTTP 422 with a validation detail.

## Deployment

Deployment is not configured yet. The following is a deployment plan, not a live service. It keeps the API and frontend as separate services and retains SQLite.

### Backend: Render Web Service

Create a Python web service with the repository root directory set to `backend`:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/api/health`
- Set `FRONTEND_URL` to the exact deployed frontend origin, such as `https://your-site.example` (no path). Multiple comma-separated origins are supported.
- Attach a persistent disk mounted at `/var/data` and set `DATABASE_PATH=/var/data/database.db`.

Render's default service filesystem is ephemeral. Without an attached persistent disk, SQLite changes can be lost on restart or redeploy. Render documents disks for paid web services; disk-backed services preserve files under their mount path across restarts and redeploys, but are limited to one service instance and redeploys have downtime. Confirm current plan and disk availability in Render before choosing this setup. The API uses the configured `DATABASE_PATH`; its local default remains `backend/app/database.db`.

### Frontend: Vercel

Create a project from the same repository with the root directory set to `frontend`. Use the Vite framework preset, build command `npm run build`, and output directory `dist` (Vercel can detect these Vite defaults). Set the build environment variable `VITE_API_BASE_URL` to the deployed backend base URL, for example `https://your-api.example` without `/api`. Vite embeds this value into the frontend build, so rebuild after changing it.

After the frontend receives its final URL, set that exact origin in the backend's `FRONTEND_URL` environment variable and redeploy the API.

### Deployment URLs

- Frontend: **[TO BE FILLED AFTER DEPLOYMENT]**
- Backend: **[TO BE FILLED AFTER DEPLOYMENT]**

## Screenshots

Screenshots will be added after the final deployed UI is available. No screenshots are included yet.
