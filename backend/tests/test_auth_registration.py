import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.agency import Agency, AgencyMembership
from app.models.user import User


def test_agency_self_registration_flow(client, db_session):
    unique_id = uuid.uuid4().hex[:8]
    unique_email = f"lead_broker_{unique_id}@propstackly.com"
    payload = {
        "agency_name": f"Apex Prime Real Estate {unique_id}",
        "full_name": "Taimur Khan",
        "email": unique_email,
        "phone": "+92 300 8887766",
        "city": "Islamabad",
        "password": "SecurePassword123!",
    }
    
    # 1. Successful Registration
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201, f"Failed registration: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_email
    assert data["user"]["role"] == "owner"
    assert data["user"]["agency_name"] == payload["agency_name"]
    assert data["user"]["subscription_status"] == "trial"
    assert data["user"]["trial_ends_at"] is not None
    
    # 2. Check Database Records
    user = db_session.query(User).filter(User.email == unique_email).first()
    assert user is not None
    assert user.full_name == "Taimur Khan"
    
    agency = db_session.query(Agency).filter(Agency.name == payload["agency_name"]).first()
    assert agency is not None
    assert agency.subscription_status == "trial"
    assert agency.city == "Islamabad"
    
    membership = db_session.query(AgencyMembership).filter(
        AgencyMembership.user_id == user.id,
        AgencyMembership.agency_id == agency.id
    ).first()
    assert membership is not None
    assert membership.role == "owner"
    assert membership.is_active is True
    
    # 3. Duplicate Registration Prevention
    duplicate_res = client.post("/api/v1/auth/register", json=payload)
    assert duplicate_res.status_code == 400
    assert "already exists" in duplicate_res.json()["detail"]


def test_agency_registration_validation(client):
    # Invalid email
    res = client.post("/api/v1/auth/register", json={
        "agency_name": "Test Agency",
        "full_name": "Test User",
        "email": "notanemail",
        "phone": "03001234567",
        "city": "Lahore",
        "password": "Password123!",
    })
    assert res.status_code == 400
    
    # Short password (< 8 chars)
    res2 = client.post("/api/v1/auth/register", json={
        "agency_name": "Test Agency",
        "full_name": "Test User",
        "email": "valid@agency.com",
        "phone": "03001234567",
        "city": "Lahore",
        "password": "short",
    })
    assert res2.status_code == 400
