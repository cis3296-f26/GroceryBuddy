# Grocery Buddy

## Project Description

Grocery Buddy is a web app that helps college students keep track of their groceries and eat food before it goes bad. Students add groceries in a few quick steps: the food, how much they have, where it is stored (fridge, freezer, or pantry), and the date they bought it. The app estimates how long each item will last and shows a dashboard with labels like "Use Today," "Use Soon," "Good for Now," and "Past Estimate." Students can mark food as used or thrown away, keep a shopping list, and get AI recipe ideas for food that needs to be used soon.

**Project status:** We are just getting started. Right now the app only shows the React + Vite starter page. The features above are planned and will be added during the semester. Our proposal also plans a Python/Django backend and a PostgreSQL database, and we will add those setup steps here when they are ready.

## Installation Instructions

You need these programs before you start:

- [Git](https://git-scm.com/downloads), to download the code
- [Node.js](https://nodejs.org/) version 20.19 or newer, which also installs npm (the tool that downloads the project's packages)
- A code editor such as [VS Code](https://code.visualstudio.com/) (optional)

To check that Node.js is installed, open a terminal and run:

```bash
node --version
```

Then download the project and install its packages:

```bash
git clone https://github.com/cis3296-f26/GroceryBuddy.git
cd GroceryBuddy
npm install
```

You only need to run `npm install` the first time, and again if someone adds a new package.

## Build Instructions

Inside the `GroceryBuddy` folder, run:

```bash
npm run build
```

This makes a `dist` folder with the finished files that a web server can host.

## Run Instructions

To start the app while you work on it, run:

```bash
npm run dev
```

The terminal shows a link, usually http://localhost:5173. Open it in your web browser to see the app. The page updates by itself when you save a file. To stop the app, click in the terminal and press `Ctrl + C`.

To try the version you built in the Build step, run:

```bash
npm run preview
```

Then open the link it shows, usually http://localhost:4173.

These steps were tested on Windows 11 with Node.js 24 and npm 11.

## Django Backend Setup

The project now includes a Django backend in `backend/`, alongside the React frontend in `src/`. Django apps are scaffolded for accounts, inventory, recipes, and shopping. Settings read the Supabase PostgreSQL connection from `DATABASE_URL`, and the Vite development server forwards `/api` requests to Django. Feature endpoints remain under development.

### Backend Installation

Install Python 3.12 or newer. The backend has been checked locally with Python 3.13.

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

On Windows PowerShell, use `py -m venv .venv`, `.\.venv\Scripts\Activate.ps1`, and `Copy-Item .env.example .env` in place of the corresponding commands above.

Generate a Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Edit `backend/.env` and set:

- `DATABASE_URL`: the PostgreSQL connection URL supplied by the database maintainer. Use the direct or session-pooler connection agreed with the team. Django requires SSL for this connection.
- `SECRET_KEY`: the generated key, enclosed in double quotes.
- `DEBUG`: `True` for local development.
- `ALLOWED_HOSTS`: `localhost,127.0.0.1` for local development.

The settings load `.env` from the backend directory. Existing process environment variables take precedence. Never put database credentials in frontend code or `VITE_` variables.

Git ignores `.env` files and `.venv/`. Commit `.env.example` with placeholders only. Each developer should create their own virtual environment and obtains credentials privately.

## Run Locally

Run the backend and frontend in separate terminals.

### Terminal 1: Backend

From the repository root:

```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```

On Windows, activate with `.\.venv\Scripts\Activate.ps1` instead.

Open http://127.0.0.1:8000/api/health/. Expected response:

```json
{"status": "ok"}
```

The health endpoint confirms Django is serving requests; use the database verification command above to check database connectivity separately.

### Terminal 2: Frontend

From the repository root:

```bash
npm run dev
```

Open the address shown in the terminal, usually http://localhost:5173. Vite forwards `/api` requests to Django at `http://127.0.0.1:8000`, so http://localhost:5173/api/health/ should return the same JSON. Both servers must be running. Frontend code can call relative URLs such as `fetch('/api/health/')`.

Press `Ctrl+C` in each terminal to stop its server. React updates as frontend files change; Django reloads when backend Python files change.

## API Routing

| Path | Status |
| --- | --- |
| `/api/health/` | Returns `{"status": "ok"}` |
| `/api/accounts/` | Reserved for account endpoints |
| `/api/inventory/` | Reserved for inventory endpoints |
| `/api/recipes/` | Reserved for recipe endpoints |
| `/api/shopping/` | Reserved for shopping endpoints |

Reserved routes currently return 404 until their endpoints are implemented.
