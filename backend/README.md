# PropStackly CRM — Backend & Database (Phase 2)

A production-grade, multi-tenant Real Estate Lead Management CRM backend built with **FastAPI**, **PostgreSQL / SQLAlchemy 2.x**, **Alembic**, and **Pydantic**. Engineered specifically for Pakistani real estate agencies and property developers.

---

## Architecture & Technology Stack

- **Framework**: FastAPI (Python 3.12+ / 3.14 compatible)
- **Database ORM**: SQLAlchemy 2.x Declarative Models
- **Database Driver**: `psycopg` (Psycopg 3) for PostgreSQL with SQLite support for lightweight local development
- **Migrations**: Alembic with automated revision generation
- **Security & Multi-Tenancy**: Strict agency-scoped tenant isolation via verified JWT agency memberships; untrusted client IDs are discarded
- **Validation**: Pydantic v2 schemas
- **Monetary Precision**: All monetary values (budgets, property prices, commissions, sales targets) are stored strictly as `Numeric(18, 2)` decimals, never floating-point numbers.
- **Testing**: Pytest with automated in-memory SQLite fixtures and multi-tenant security verification.

---

## Directory Structure

```
backend/
├── alembic/                      # Alembic migrations folder
│   ├── versions/                 # Version migration scripts
│   └── env.py                    # Migration environment runner
├── alembic.ini                   # Alembic configuration
├── requirements.txt              # Production & test dependencies
├── .env.example                  # Template environment variables
├── .env                          # Local environment variables
├── app/
│   ├── main.py                   # FastAPI application initialization & CORS
│   ├── core/
│   │   ├── config.py             # Pydantic Settings & environment parsing
│   │   ├── database.py           # Engine & SessionLocal setup
│   │   └── security.py           # Password hashing (bcrypt) & JWT handling
│   ├── models/                   # SQLAlchemy 2.x Relational Models
│   │   ├── agency.py             # Agency & AgencyMembership
│   │   ├── user.py               # User model
│   │   ├── lead.py               # Lead, LeadAssignment, LeadActivity, LeadNote
│   │   ├── property.py           # Property listing model
│   │   ├── task.py               # FollowUp and SiteVisit models
│   │   └── deal.py               # Sales Opportunity / Deal model
│   ├── schemas/                  # Pydantic Request & Response Schemas
│   │   ├── auth.py, agency.py, user.py, lead.py, property.py, task.py, deal.py, analytics.py
│   ├── api/
│   │   ├── deps.py               # Dependency injection & multi-tenant isolation
│   │   └── v1/
│   │       ├── api.py            # Route aggregator
│   │       └── endpoints/        # Auth, Leads, Properties, Follow-ups, Site visits, Team, Analytics, Settings
│   └── db/
│       └── seed.py               # Realistic Pakistani real estate seed procedure
└── tests/
    ├── conftest.py               # Test database, client, and multi-tenant fixtures
    ├── test_auth.py              # Login & authentication tests
    ├── test_leads.py             # Leads CRUD, notes, and activity tests
    ├── test_properties.py        # Property inventory tests
    └── test_multitenancy.py      # Cross-agency access attempt and security tests
```

---

## Quickstart & Setup Instructions

### 1. Create and Activate Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration for PostgreSQL:
```env
PROJECT_NAME="PropStackly CRM Backend"
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/propstackly_crm
# Or SQLite for local zero-dependency testing:
# DATABASE_URL=sqlite:///./propstackly_crm.db

SECRET_KEY=propstackly-crm-development-secret-key-32-chars-min!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### 3. Run Database Migrations

Apply Alembic migrations to build all relational tables, foreign keys, and compound indexes:

```bash
PYTHONPATH=. venv/bin/alembic upgrade head
```

### 4. Seed Database with Pakistani Real Estate Data

Populates realistic data (DHA Islamabad villas, Bahria Town houses, Gulberg Greens farmhouses, PKR pricing, sales leads, follow-ups, and multiple agency tenants):

```bash
PYTHONPATH=. venv/bin/python app/db/seed.py
```

### 5. Run the Server

```bash
PYTHONPATH=. venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Base URL: `http://localhost:8000/api/v1`
- Interactive Swagger OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

## Testing & Multi-Tenant Security Verification

Run the automated test suite with Pytest:

```bash
PYTHONPATH=. venv/bin/pytest tests/ -v
```

### Multi-Tenant Isolation Guarantee
Every agency-scoped entity (`Lead`, `Property`, `FollowUp`, `SiteVisit`, `Deal`) includes an `agency_id` column.
- The backend **never trusts an `agency_id` parameter sent from the client**.
- The active agency is extracted strictly from the authenticated user's verified database `AgencyMembership`.
- Dedicated tests in `tests/test_multitenancy.py` verify that:
  - An agent from Agency 1 cannot list leads from Agency 2.
  - Cross-agency GET, PATCH, and DELETE requests return `404 Not Found`.
  - Attempting to assign an agent from another agency returns `400 Bad Request`.
  - Attempting to schedule a site visit for another agency's property returns `404 Not Found`.

---

## Default Seed Credentials

| Name | Role | Email | Password | Agency |
|---|---|---|---|---|
| Hamza Malik | Principal Broker & CEO | `admin@propstackly.com` | `Admin123!` | Apex Properties Islamabad |
| Ayesha Khan | Senior Consultant | `ayesha@propstackly.com` | `Agent123!` | Apex Properties Islamabad |
| Tariq Mehmood | Broker (Tenant 2) | `tariq@lahorerealestate.pk` | `Lahore123!` | Al-Haram Real Estate Lahore |
