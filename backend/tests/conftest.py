import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.api.deps import get_db
from app.main import app
from app.core.security import get_password_hash, create_access_token
from app.core.rate_limit import login_limiter, password_reset_limiter
from app.services.email_service import (
    clear_dispatched_emails,
    enable_test_token_capture,
    disable_test_token_capture,
)
from app.models.agency import Agency, AgencyMembership
from app.models.user import User
from app.models.lead import Lead
from app.models.property import Property

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    login_limiter.reset_all()
    password_reset_limiter.reset_all()
    enable_test_token_capture()
    clear_dispatched_emails()
    yield
    login_limiter.reset_all()
    password_reset_limiter.reset_all()
    clear_dispatched_emails()
    disable_test_token_capture()


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_data(db_session):
    # Agency 1 (Apex Islamabad)
    agency_1 = Agency(
        name="Apex Properties Islamabad",
        contact_email="apex@test.com",
        contact_phone="+92 51 2894100",
        city="Islamabad",
    )
    # Agency 2 (Lahore Real Estate)
    agency_2 = Agency(
        name="Al-Haram Real Estate Lahore",
        contact_email="lahore@test.com",
        contact_phone="+92 42 35789100",
        city="Lahore",
    )
    db_session.add_all([agency_1, agency_2])
    db_session.flush()

    # Apex Owner (Hamza Malik)
    owner_apex = User(
        email="hamza@apex.pk",
        hashed_password=get_password_hash("ApexPass123!"),
        full_name="Hamza Malik",
        role_title="Agency Owner & CEO",
    )
    # Apex Manager (Ayesha Khan)
    manager_apex = User(
        email="ayesha@apex.pk",
        hashed_password=get_password_hash("ManagerPass123!"),
        full_name="Ayesha Khan",
        role_title="Sales Manager",
    )
    # Apex Agent (Bilal Tariq)
    agent_apex = User(
        email="bilal@apex.pk",
        hashed_password=get_password_hash("AgentPass123!"),
        full_name="Bilal Tariq",
        role_title="Sales Agent",
    )
    # Lahore Owner (Tariq Mehmood)
    user_lahore = User(
        email="tariq@lahore.pk",
        hashed_password=get_password_hash("LahorePass123!"),
        full_name="Tariq Mehmood",
        role_title="Agency Owner",
    )
    db_session.add_all([owner_apex, manager_apex, agent_apex, user_lahore])
    db_session.flush()

    # Memberships
    m_owner = AgencyMembership(agency_id=agency_1.id, user_id=owner_apex.id, role="owner", is_active=True)
    m_mgr = AgencyMembership(agency_id=agency_1.id, user_id=manager_apex.id, role="manager", is_active=True)
    m_agt = AgencyMembership(agency_id=agency_1.id, user_id=agent_apex.id, role="agent", is_active=True)
    m_lahore = AgencyMembership(agency_id=agency_2.id, user_id=user_lahore.id, role="owner", is_active=True)
    db_session.add_all([m_owner, m_mgr, m_agt, m_lahore])
    db_session.flush()

    # Lead 1: Assigned to Agent (Bilal)
    lead_agent = Lead(
        agency_id=agency_1.id,
        full_name="Agent Assigned Buyer",
        phone="+92 300 1112233",
        email="agentbuyer@example.com",
        city="Islamabad",
        source="Facebook Ads",
        status="new",
        budget_pkr=Decimal("85000000.00"),
        property_type_interest="House / Villa",
        preferred_locations="DHA Phase 2 Islamabad",
        assigned_agent_id=agent_apex.id,
    )
    # Lead 2: Assigned to Manager (Ayesha)
    lead_manager = Lead(
        agency_id=agency_1.id,
        full_name="Manager Assigned Buyer",
        phone="+92 300 2223344",
        email="managerbuyer@example.com",
        city="Islamabad",
        source="Zameen.com",
        status="contacted",
        budget_pkr=Decimal("120000000.00"),
        property_type_interest="House / Villa",
        preferred_locations="Gulberg Greens Islamabad",
        assigned_agent_id=manager_apex.id,
    )
    # Lead 3: Belongs strictly to Agency 2 (Lahore)
    lead_lahore = Lead(
        agency_id=agency_2.id,
        full_name="Lahore Buyer Client",
        phone="+92 321 4445566",
        email="lahorebuyer@example.com",
        city="Lahore",
        source="Zameen.com",
        status="negotiation",
        budget_pkr=Decimal("95000000.00"),
        property_type_interest="House / Villa",
        preferred_locations="DHA Phase 6 Lahore",
        assigned_agent_id=user_lahore.id,
    )
    db_session.add_all([lead_agent, lead_manager, lead_lahore])

    # Property 1 in Agency 1
    prop_apex = Property(
        agency_id=agency_1.id,
        title="Apex DHA 2 Villa",
        slug="apex-dha-2-villa",
        type="House / Villa",
        city="Islamabad",
        location="Sector B",
        society="DHA Phase 2",
        price_pkr=Decimal("85000000.00"),
        area_size="1 Kanal",
        image_url="https://example.com/dha.jpg",
        description="Exclusive DHA 2 villa",
        assigned_agent_id=agent_apex.id,
    )
    # Property 2 in Agency 2
    prop_lahore = Property(
        agency_id=agency_2.id,
        title="Lahore DHA 6 House",
        slug="lahore-dha-6-house",
        type="House / Villa",
        city="Lahore",
        location="Sector J",
        society="DHA Phase 6 Lahore",
        price_pkr=Decimal("92000000.00"),
        area_size="1 Kanal",
        image_url="https://example.com/lahore.jpg",
        description="Exclusive DHA Lahore house",
        assigned_agent_id=user_lahore.id,
    )
    db_session.add_all([prop_apex, prop_lahore])
    db_session.commit()

    return {
        "agency_1": agency_1,
        "agency_2": agency_2,
        "owner_apex": owner_apex,
        "manager_apex": manager_apex,
        "agent_apex": agent_apex,
        "user_lahore": user_lahore,
        "lead_agent": lead_agent,
        "lead_manager": lead_manager,
        "lead_apex": lead_agent,  # for backward compatibility
        "lead_lahore": lead_lahore,
        "prop_apex": prop_apex,
        "prop_lahore": prop_lahore,
        "user_apex": owner_apex,  # for backward compatibility
    }


@pytest.fixture
def owner_auth_headers(test_data):
    token = create_access_token(
        subject=test_data["owner_apex"].id,
        agency_id=test_data["agency_1"].id,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_auth_headers(test_data):
    token = create_access_token(
        subject=test_data["manager_apex"].id,
        agency_id=test_data["agency_1"].id,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def agent_auth_headers(test_data):
    token = create_access_token(
        subject=test_data["agent_apex"].id,
        agency_id=test_data["agency_1"].id,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def apex_auth_headers(owner_auth_headers):
    """Alias for backward compatibility"""
    return owner_auth_headers


@pytest.fixture
def lahore_auth_headers(test_data):
    token = create_access_token(
        subject=test_data["user_lahore"].id,
        agency_id=test_data["agency_2"].id,
    )
    return {"Authorization": f"Bearer {token}"}
