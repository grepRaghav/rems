# Renewable Energy Management System (REMS)
### College DBMS Project Starter — React + Flask + Oracle 11g

A production-grade, demo-ready DBMS full-stack starter application designed for college problem statements. Preconfigured for a **Renewable Energy Management System** with full DDL, DML, and DQL demonstrations, authentication with password hashing, and seamless connectivity to **Oracle Database 11g** via ODBC.

---

## Tech Stack Overview

- **Frontend**: Vite, React (JavaScript), Tailwind CSS v4, React Router v6, Axios, Lucide React icons.
- **Backend**: Python Flask, Flask-CORS, Werkzeug password hashing, `python-dotenv`.
- **Database Connectivity**: Oracle 11g ODBC driver via `pyodbc` with parameterized queries. Includes an automatic **Development Fallback** engine (SQLite) with matching schema and badges so the app runs immediately even before Oracle DSN is configured.

---

## Project Structure

```text
rems/
├── frontend/
│   ├── src/
│   │   ├── components/       # Modal, ConfirmModal, DbStatusBanner, LoadingSpinner, EmptyState
│   │   ├── layouts/          # DashboardLayout with sidebar & header
│   │   ├── pages/            # Login, Dashboard, Plants, Equipment, Generation, Maintenance, SQL Console
│   │   ├── services/         # Axios API client configured with credentials
│   │   ├── hooks/            # useAuth authentication context and session state
│   │   ├── App.jsx           # React Router route registry and ProtectedRoute
│   │   ├── index.css         # Tailwind CSS styling and theme
│   │   └── main.jsx
│   ├── .env.example          # Frontend environment sample
│   ├── package.json
│   └── vite.config.js        # Vite + Tailwind plugin + backend reverse proxy
├── backend/
│   ├── routes/
│   │   ├── auth_routes.py        # Login, logout, session verification
│   │   ├── dashboard_routes.py   # Aggregations & telemetry metrics
│   │   ├── plants_routes.py      # POWER_PLANTS CRUD
│   │   ├── equipment_routes.py   # EQUIPMENT CRUD with foreign keys
│   │   ├── generation_routes.py  # ENERGY_GENERATION CRUD
│   │   ├── maintenance_routes.py # MAINTENANCE_RECORDS CRUD
│   │   └── sql_routes.py         # DDL, DML, DQL sandbox console with security allowlist
│   ├── app.py                # Main Flask entrypoint
│   ├── config.py             # App & DB configuration
│   ├── db.py                 # Oracle 11g ODBC driver manager with fallback handling
│   ├── auth.py               # Werkzeug PBKDF2 password hashing & session decorators
│   ├── schema.sql            # Oracle 11g compatible schema (tables, constraints, foreign keys)
│   ├── seed.py               # Database initialization & sample data seeder
│   ├── create_admin.py       # CLI utility to create new administrator accounts
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Sample environment variables
│   └── .env                  # Active environment configuration
├── README.md                 # Complete setup guide & documentation
└── .gitignore
```

---

## Prerequisites (Windows)

1. **Python**: Python 3.10+ (Check with `py --version`)
2. **Node.js**: Node.js v18+ and npm (Check with `node -v` and `npm -v`)
3. **Oracle Database 11g Express Edition (XE)** (Pre-installed service `OracleServiceXE` and listener `OracleXETNSListener`)
4. **Oracle ODBC Driver**: `Oracle in XE` (64-bit or 32-bit matching your Python architecture).

---

## Quick Start (Installation & Execution)

### Step 1: Backend Setup

Open PowerShell in the project root:

```powershell
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
py -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 4. Install backend dependencies
pip install flask flask-cors python-dotenv werkzeug

# Note: If Oracle 11g ODBC is installed on your Windows machine, install pyodbc:
pip install pyodbc
```

### Step 2: Configure Environment Variables

In `backend/.env`:

```env
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=rems-secret-academic-project-key-2026

# Oracle Database 11g Settings
ORACLE_DSN=REMS_DSN
ORACLE_DRIVER=Oracle in XE
ORACLE_HOST=127.0.0.1
ORACLE_PORT=1521
ORACLE_SERVICE=XE
ORACLE_USER=rems_user
ORACLE_PASSWORD=rems_password

# Connection Mode ('odbc' or 'auto')
DB_CONNECTION_MODE=auto

SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SECURE=False
SESSION_COOKIE_SAMESITE=Lax
```

### Step 3: Seed Database & Create Administrator

Run the seeder to create tables, default administrator, and sample datasets:

```powershell
python seed.py
```

To create an additional or custom administrator account:

```powershell
python create_admin.py myadmin mypass123 "Dr. A. Sharma"
```

Default administrator credentials:
- **Username**: `admin`
- **Password**: `admin123`

### Step 4: Run Flask Backend

```powershell
python app.py
```
Backend runs at `http://127.0.0.1:5000`.

---

### Step 5: Frontend Setup & Execution

Open a separate PowerShell window in the project root:

```powershell
# Navigate to frontend
cd frontend

# Install node modules
npm install

# Start Vite React development server
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Configuring Oracle 11g ODBC Data Source (DSN) on Windows

To connect via Windows System DSN (`REMS_DSN`):

1. Press `Win + R`, type `odbcad32.exe` (use the 64-bit version for 64-bit Python, or `C:\Windows\SysWOW64\odbcad32.exe` if using 32-bit Python).
2. Go to the **System DSN** tab.
3. Click **Add...** and select **Oracle in XE** (or **Oracle in OraDb11g_home1**).
4. Fill in:
   - **Data Source Name**: `REMS_DSN`
   - **Description**: `Renewable Energy DBMS DSN`
   - **TNS Service Name**: `XE` (or `localhost:1521/XE`)
   - **User ID**: `rems_user`
5. Click **Test Connection**, enter password `rems_password`, verify `Connection successful`, and click **OK**.

---

## Oracle 11g Schema & Entities

The schema is defined in `backend/schema.sql` and includes:

1. **`APP_USERS`**: Authentication credentials with PBKDF2 hashed passwords and user roles.
2. **`POWER_PLANTS`**: Facilities (Solar, Wind, Hydro, Biomass) with location, capacity in kW, and operational status.
3. **`EQUIPMENT`**: Hardware assets associated with power plants (`FK_EQUIPMENT_PLANT` cascade delete).
4. **`ENERGY_GENERATION`**: Daily generation logs, kWh outputs, efficiency percentages, and peak output (`FK_GEN_PLANT`).
5. **`MAINTENANCE_RECORDS`**: Service schedules, technician assignments, costs, and work orders (`FK_MAINT_EQUIP`).
6. **`DISPOSABLE_TEST_TABLE`**: Dedicated sandbox table for DDL `CREATE`, `ALTER`, and `DROP` demonstrations.

---

## SQL Console (DDL, DML, DQL Demonstrations)

Accessible via the sidebar:
- **DDL Section**: Demonstrates `CREATE TABLE`, `ALTER TABLE`, and safe `DROP TABLE` on disposable tables.
- **DML Section**: Demonstrates parameterized `INSERT`, `UPDATE`, and `DELETE`.
- **DQL Section**: Demonstrates `SELECT` with `WHERE`, `ORDER BY`, `GROUP BY`, `HAVING`, relational `INNER JOIN`, and aggregates (`COUNT`, `SUM`, `AVG`).
- **Security Validator**: Blocks multi-statement injection, transaction manipulation (`COMMIT/ROLLBACK`), privilege alteration (`GRANT/REVOKE`), and prevents dropping core schema tables.

---

## Troubleshooting

- **"Oracle ODBC connection failed"**:
  Ensure Oracle services (`OracleServiceXE` and `OracleXETNSListener`) are running in Windows Services (`services.msc`). The application automatically falls back to the embedded SQLite dev engine so demo operations are never blocked.
- **CORS Issues**:
  Vite's proxy is preconfigured in `vite.config.js` to route `/api/*` directly to `http://127.0.0.1:5000`. Keep `withCredentials: true` enabled.
- **Password Hashes**:
  Passwords are never stored in plaintext. If you forget your password, run `python create_admin.py` to generate a new account.
