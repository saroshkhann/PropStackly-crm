import io
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from app.models.lead import Lead, LeadPropertyAssociation
from app.models.property import Property
from app.models.task import FollowUp, SiteVisit


def test_lead_archiving_and_restoring(client, test_data, manager_auth_headers):
    lead = test_data["lead_manager"]

    # 1. Archive the lead
    res = client.post(f"/api/v1/leads/{lead.id}/archive", headers=manager_auth_headers)
    assert res.status_code == 200
    assert res.json()["is_archived"] is True

    # 2. Verify lead is excluded from active leads list by default
    res = client.get("/api/v1/leads", headers=manager_auth_headers)
    assert res.status_code == 200
    active_ids = [l["id"] for l in res.json()["items"]]
    assert lead.id not in active_ids

    # 3. Verify lead is present when filtering is_archived=true
    res = client.get("/api/v1/leads?is_archived=true", headers=manager_auth_headers)
    assert res.status_code == 200
    archived_ids = [l["id"] for l in res.json()["items"]]
    assert lead.id in archived_ids

    # 4. Unarchive / Restore the lead
    res = client.post(f"/api/v1/leads/{lead.id}/unarchive", headers=manager_auth_headers)
    assert res.status_code == 200
    assert res.json()["is_archived"] is False

    # 5. Verify lead returns to active list
    res = client.get("/api/v1/leads", headers=manager_auth_headers)
    assert res.status_code == 200
    active_ids = [l["id"] for l in res.json()["items"]]
    assert lead.id in active_ids


def test_duplicate_lead_prevention(client, owner_auth_headers):
    phone = "+92 300 9988776"

    # 1. Create first lead
    res = client.post(
        "/api/v1/leads",
        headers=owner_auth_headers,
        json={
            "full_name": "Original Lead",
            "phone": phone,
            "email": "unique@test.com",
            "budget_pkr": 50000000,
        },
    )
    assert res.status_code == 201

    # 2. Attempt creating duplicate lead with exact same phone number
    res_dup = client.post(
        "/api/v1/leads",
        headers=owner_auth_headers,
        json={
            "full_name": "Duplicate Lead",
            "phone": phone,
            "email": "another@test.com",
            "budget_pkr": 60000000,
        },
    )
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]


def test_lead_property_association_and_removal(client, test_data, manager_auth_headers):
    lead = test_data["lead_manager"]
    prop = test_data["prop_apex"]

    # 1. Associate property with lead
    res = client.post(
        f"/api/v1/leads/{lead.id}/properties",
        headers=manager_auth_headers,
        json={
            "property_id": prop.id,
            "notes": "Client requested floor plan for this 1 Kanal Villa.",
        },
    )
    assert res.status_code == 201
    assoc_data = res.json()
    assert assoc_data["property_id"] == prop.id
    assert assoc_data["property_title"] == prop.title

    # 2. Get lead's associated properties list
    res_list = client.get(f"/api/v1/leads/{lead.id}/properties", headers=manager_auth_headers)
    assert res_list.status_code == 200
    prop_ids = [p["property_id"] for p in res_list.json()]
    assert prop.id in prop_ids

    # 3. Check lead detail includes associated property
    res_lead = client.get(f"/api/v1/leads/{lead.id}", headers=manager_auth_headers)
    assert res_lead.status_code == 200
    assoc_props = res_lead.json()["associated_properties"]
    assert any(ap["property_id"] == prop.id for ap in assoc_props)

    # 4. Remove property association
    res_del = client.delete(f"/api/v1/leads/{lead.id}/properties/{prop.id}", headers=manager_auth_headers)
    assert res_del.status_code == 200
    assert "unlinked" in res_del.json()["message"].lower()

    # 5. Verify it is unlinked
    res_list2 = client.get(f"/api/v1/leads/{lead.id}/properties", headers=manager_auth_headers)
    assert res_list2.status_code == 200
    prop_ids2 = [p["property_id"] for p in res_list2.json()]
    assert prop.id not in prop_ids2


def test_prevent_duplicate_property_association(client, test_data, manager_auth_headers):
    lead = test_data["lead_manager"]
    prop = test_data["prop_apex"]

    # Link once
    res1 = client.post(
        f"/api/v1/leads/{lead.id}/properties",
        headers=manager_auth_headers,
        json={"property_id": prop.id},
    )
    assert res1.status_code == 201

    # Link again -> 400 Bad Request
    res2 = client.post(
        f"/api/v1/leads/{lead.id}/properties",
        headers=manager_auth_headers,
        json={"property_id": prop.id},
    )
    assert res2.status_code == 400
    assert "already associated" in res2.json()["detail"].lower()


def test_followup_timeline_filtering(client, test_data, db_session, manager_auth_headers):
    agency = test_data["agency_1"]
    lead = test_data["lead_manager"]
    agent = test_data["agent_apex"]

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%d")
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")

    # Clear existing followups for clean count
    db_session.query(FollowUp).filter(FollowUp.agency_id == agency.id).delete()
    db_session.commit()

    # Create overdue, today, and upcoming follow-ups
    fu_overdue = FollowUp(
        agency_id=agency.id,
        lead_id=lead.id,
        assigned_agent_id=agent.id,
        scheduled_date=yesterday,
        scheduled_time="10:00",
        notes="Overdue follow-up call",
        completed=False,
    )
    fu_today = FollowUp(
        agency_id=agency.id,
        lead_id=lead.id,
        assigned_agent_id=agent.id,
        scheduled_date=today,
        scheduled_time="14:00",
        notes="Due today call",
        completed=False,
    )
    fu_upcoming = FollowUp(
        agency_id=agency.id,
        lead_id=lead.id,
        assigned_agent_id=agent.id,
        scheduled_date=tomorrow,
        scheduled_time="16:00",
        notes="Upcoming meeting",
        completed=False,
    )
    db_session.add_all([fu_overdue, fu_today, fu_upcoming])
    db_session.commit()

    # Query overdue
    res_ov = client.get("/api/v1/follow-ups?timeline=overdue", headers=manager_auth_headers)
    assert res_ov.status_code == 200
    assert len(res_ov.json()) == 1
    assert res_ov.json()[0]["id"] == fu_overdue.id

    # Query today
    res_td = client.get("/api/v1/follow-ups?timeline=today", headers=manager_auth_headers)
    assert res_td.status_code == 200
    assert len(res_td.json()) == 1
    assert res_td.json()[0]["id"] == fu_today.id

    # Query upcoming
    res_up = client.get("/api/v1/follow-ups?timeline=upcoming", headers=manager_auth_headers)
    assert res_up.status_code == 200
    assert len(res_up.json()) == 1
    assert res_up.json()[0]["id"] == fu_upcoming.id


def test_followup_completion_records_agent_and_activity(client, test_data, db_session, agent_auth_headers):
    agency = test_data["agency_1"]
    lead = test_data["lead_agent"]
    agent = test_data["agent_apex"]

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    fu = FollowUp(
        agency_id=agency.id,
        lead_id=lead.id,
        assigned_agent_id=agent.id,
        scheduled_date=today,
        scheduled_time="11:30",
        notes="Client enquiry call",
        completed=False,
    )
    db_session.add(fu)
    db_session.commit()
    db_session.refresh(fu)

    # Agent marks task complete
    res = client.patch(f"/api/v1/follow-ups/{fu.id}", headers=agent_auth_headers, json={"completed": True})
    assert res.status_code == 200
    data = res.json()
    assert data["completed"] is True
    assert data["completed_at"] is not None
    assert data["completed_by_id"] == agent.id


def test_site_visit_past_date_prevention(client, test_data, manager_auth_headers):
    lead = test_data["lead_manager"]
    prop = test_data["prop_apex"]

    past_date = (datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%d")

    res = client.post(
        "/api/v1/site-visits",
        headers=manager_auth_headers,
        json={
            "lead_id": lead.id,
            "property_id": prop.id,
            "visit_date": past_date,
            "visit_time": "14:00",
            "notes": "Tour of Bahria property",
        },
    )
    assert res.status_code == 400
    assert "past" in res.json()["detail"].lower()


def test_site_visit_conflict_prevention(client, test_data, manager_auth_headers):
    lead = test_data["lead_manager"]
    prop = test_data["prop_apex"]
    agent = test_data["agent_apex"]

    future_date = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d")
    slot_time = "15:30"

    # 1. Schedule first visit successfully
    res1 = client.post(
        "/api/v1/site-visits",
        headers=manager_auth_headers,
        json={
            "lead_id": lead.id,
            "property_id": prop.id,
            "assigned_agent_id": agent.id,
            "visit_date": future_date,
            "visit_time": slot_time,
            "notes": "First client booking",
        },
    )
    assert res1.status_code == 201

    # 2. Attempt scheduling another visit with the SAME AGENT at the exact same date & time -> 409 Conflict
    lead_other = test_data["lead_agent"]
    res2 = client.post(
        "/api/v1/site-visits",
        headers=manager_auth_headers,
        json={
            "lead_id": lead_other.id,
            "property_id": prop.id,
            "assigned_agent_id": agent.id,
            "visit_date": future_date,
            "visit_time": slot_time,
            "notes": "Conflicting booking for same agent",
        },
    )
    assert res2.status_code == 409
    assert "conflict" in res2.json()["detail"].lower()


def test_property_image_upload_workflow(client, manager_auth_headers):
    # Valid PNG image bytes (magic bytes \x89PNG\r\n\x1a\n)
    valid_png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64

    # 1. Successful upload
    res = client.post(
        "/api/v1/properties/upload-image",
        headers=manager_auth_headers,
        files={"file": ("villa_front.png", io.BytesIO(valid_png_bytes), "image/png")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["url"].startswith("/uploads/properties/")
    assert data["filename"].endswith(".png")
    assert data["size_bytes"] == len(valid_png_bytes)

    # 2. Invalid extension rejection (.exe)
    res_exe = client.post(
        "/api/v1/properties/upload-image",
        headers=manager_auth_headers,
        files={"file": ("malware.exe", io.BytesIO(b"MZtestdata"), "application/octet-stream")},
    )
    assert res_exe.status_code == 400
    assert "extension" in res_exe.json()["detail"].lower()

    # 3. Magic bytes mismatch rejection (named .png but contains random text)
    res_corrupt = client.post(
        "/api/v1/properties/upload-image",
        headers=manager_auth_headers,
        files={"file": ("fake.png", io.BytesIO(b"Not a real image file"), "image/png")},
    )
    assert res_corrupt.status_code == 400
    assert "signature" in res_corrupt.json()["detail"].lower()


def test_dashboard_and_reports_real_db_metrics(client, manager_auth_headers):
    res_dash = client.get("/api/v1/analytics/dashboard", headers=manager_auth_headers)
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert "total_leads" in dash_data
    assert "conversion_rate" in dash_data
    assert isinstance(dash_data["sources"], list)
    assert isinstance(dash_data["statuses"], list)

    res_rep = client.get("/api/v1/analytics/reports", headers=manager_auth_headers)
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert "funnel" in rep_data
    assert "channel_roi" in rep_data
    assert "top_societies" in rep_data
