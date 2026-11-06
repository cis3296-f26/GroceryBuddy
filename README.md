# Grocery Buddy

## Project Description

Grocery Buddy is a web app that helps college students keep track of their groceries and eat food before it goes bad. Students add groceries in a few quick steps: the food, how much they have, where it is stored (fridge, freezer, or pantry), and the date they bought it. The app estimates how long each item will last and shows a dashboard with labels like "Use Today," "Use Soon," "Good for Now," and "Past Estimate." Students can mark food as used or thrown away, keep a shopping list, and get AI recipe ideas for food that needs to be used soon.

**Project status:** The React frontend and Django/PostgreSQL backend are in development. The backend provides authenticated grocery CRUD and a health endpoint. Google sign-in, recipes, and shopping endpoints are not implemented on this branch.

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

Git ignores `.env` files and `.venv/`. Commit `.env.example` with placeholders only. Each developer should create their own virtual environment and obtain credentials privately.

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

The health endpoint confirms Django is serving requests. `python manage.py showmigrations` checks database connectivity and lists migration status.

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
| `/api/inventory/items/` | Authenticated grocery CRUD endpoints |
| `/api/auth/login/` | Browsable API session login |
| `/api/recipes/` | Reserved for recipe endpoints |
| `/api/shopping/` | Reserved for shopping endpoints |

Reserved routes currently return 404 until their endpoints are implemented.


## Grocery Management Backend

The inventory app now includes a `GroceryItem` model mapped to
`inventory_groceryitem`, a serializer, admin registration, and CRUD endpoints.
Each item belongs to a Django user. Requests only see that user's items, and
creation assigns ownership from the signed-in user. Quantity must be a nonnegative integer; expiration date is optional. Names are
limited to 100 characters. Categories use the choices in
`backend/inventory/models.py`, and storage is `fridge`, `freezer`, or `pantry`.
Purchase date defaults to today and storage defaults to `fridge`.
The model matches the committed initial inventory migration.

### API usage

For local development, create a Django user with `python manage.py createsuperuser`
after applying migrations, then sign in at `/api/auth/login/`. Any active Django
user can use the API; staff status is not required. Session-authenticated writes
must include the `X-CSRFToken` header with the current `csrftoken` cookie value.
The browsable API includes CSRF tokens in its forms.

- `GET /api/inventory/items/`: list the signed-in user's groceries, ordered by ID.
- `POST /api/inventory/items/`: create an item (201).
- `GET /api/inventory/items/<id>/`: retrieve an item.
- `PUT` or `PATCH /api/inventory/items/<id>/`: replace or update an item.
- `DELETE /api/inventory/items/<id>/`: delete an item (204).

Example create body:

```json
{"name": "Milk", "quantity": 2, "category": "Dairy", "storage_location": "fridge"}
```

Responses also include `id`, `user`, `purchase_date`, and `expiration_date`.
`id` and `user` are read-only; the server assigns ownership. Invalid input returns
400, anonymous requests return 403, and another user's item returns 404.

### Database migrations

With the backend environment configured, inspect migration status first:

```bash
cd backend
python manage.py showmigrations
```

For a **new, empty development database**, create the tables with:

```bash
python manage.py migrate
```

For the **existing shared database**, check with the database maintainer before
applying migrations. Verify that the existing inventory table matches the model
(including column types, lengths, nullability, foreign key, and quantity check)
and inspect the recorded migration history. If the table exists but the matching
initial migration is not recorded, `python manage.py migrate --fake-initial` can
record it without recreating the table. Django's initial-migration detection does
not verify full schema compatibility, so do not use this to bypass a mismatch.
No shared database migrations were run as part of this implementation.

### Run inventory tests on PostgreSQL

Tests require a dedicated PostgreSQL server supplied through `TEST_DATABASE_URL`.
They do not use the shared application's `DATABASE_URL`. The test role must have
permission to create databases. Django creates and deletes a separate
`test_<database name>` database; never use a shared application or shared test
server for this command.

```bash
cd backend
source .venv/bin/activate
export TEST_DATABASE_URL='postgresql://localhost/grocerybuddy'
python manage.py test --settings=grocery_buddy.test_settings --noinput
python manage.py check
python manage.py makemigrations --check --dry-run
```

Use credentials and SSL options appropriate to your dedicated test server.
The suite covers CRUD, field validation, defaults, ownership isolation, and
session/CSRF enforcement. It creates its schema from migrations; it does not
verify the existing shared database's schema. Before deploying, the database
maintainer must verify that schema and apply or reconcile migrations as described
above. Google sign-in remains separate work; local session login supports testing
inventory in the meantime.

GitHub Actions runs these backend checks against an isolated PostgreSQL service
on pushes and pull requests.

### Frontend session integration

Start Django in `backend/` with `.venv/bin/python manage.py runserver` and Vite
from the repository root with `npm run dev`. Open the Vite URL. Signed-out users
are directed to Django's existing login page and returned to the frontend afterward.
Use an existing Django account. Cayla's onboarding, dashboard and Add Food modal
are retained. The existing item list loads from the backend and Save Item persists
new groceries. Category defaults to Pantry and storage to fridge because the
original form has no controls for those fields. Both date choices map to the
backend's single expiration_date field; the backend does not store date type.

JSON session endpoints remain available at `/api/accounts/session/`,
`/api/accounts/login/`, and `/api/accounts/logout/`. Session responses supply a
CSRF token for writes. Vite preserves the incoming host for same-origin checks.
Use the Vite address consistently; in deployment serve `/api` on the frontend origin.
