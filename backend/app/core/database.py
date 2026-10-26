from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Engine configuration
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 15}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if settings.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db_schema():
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import inspect, text
        with engine.begin() as conn:
            inspector = inspect(conn)
            if "users" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("users")]
                if "token_version" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1 NOT NULL;"))

            if "agencies" in inspector.get_table_names():
                agency_cols = [c["name"] for c in inspector.get_columns("agencies")]
                if "subscription_status" not in agency_cols:
                    conn.execute(text("ALTER TABLE agencies ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'trial' NOT NULL;"))
                if "subscription_plan" not in agency_cols:
                    conn.execute(text("ALTER TABLE agencies ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'starter' NOT NULL;"))
                if "trial_ends_at" not in agency_cols:
                    conn.execute(text("ALTER TABLE agencies ADD COLUMN trial_ends_at TIMESTAMP NULL;"))
                    # Default existing agencies to 3-day active trial from now if unset
                    conn.execute(text("UPDATE agencies SET trial_ends_at = datetime('now', '+3 days') WHERE trial_ends_at IS NULL;"))
                if "subscription_expires_at" not in agency_cols:
                    conn.execute(text("ALTER TABLE agencies ADD COLUMN subscription_expires_at TIMESTAMP NULL;"))
    except Exception as e:
        print(f"init_db_schema migration notice: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
