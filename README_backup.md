# Employee Canteen Management System

Full-stack employee canteen management system built with React, Tailwind CSS, Django, and PostgreSQL.

## Features

- Employee directory and wallet balance tracking
- Menu and category management
- Meal schedule planning
- Order placement with multiple items
- Dashboard for canteen metrics
- Feedback collection and announcements

## Structure

```text
backend/   Django REST API
frontend/  React + Vite + Tailwind client
```

## Backend

1. Create a virtual environment.
2. Install packages:

```bash
pip install -r requirements.txt
```

3. Optional for PostgreSQL: copy `backend/.env.example` to `backend/.env` and fill in your database credentials.
4. If you do not create `backend/.env`, the project now uses local SQLite for development so the app can start immediately.
5. Run:

```bash
python backend/manage.py migrate
python backend/manage.py seed_demo_data
python backend/manage.py runserver
```

## Frontend

1. Install packages:

```bash
cd frontend
npm install
```

2. Copy `frontend/.env.example` to `frontend/.env`.
3. Run:

```bash
npm run dev
```

## Demo Accounts

- `admin / admin123`
- `manager / manager123`
- `employee / employee123`

## Database

Development default:

- If `backend/.env` is missing, Django uses SQLite automatically.
- If you want PostgreSQL, create `backend/.env` and set `DB_ENGINE=postgres`.

Docker Compose includes a PostgreSQL service:

```bash
docker compose up -d postgres
```

## Windows Copy Commands

If you are staying in PowerShell, you can use:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

## Install Commands

Backend:

```powershell
py -3 -m pip install -r requirements.txt
```

Frontend:

```powershell
cd frontend
npm install
```
