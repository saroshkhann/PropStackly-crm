def test_agent_can_view_assigned_lead(client, test_data, agent_auth_headers):
    # Agent can view their own assigned lead
    lead_id = test_data["lead_agent"].id
    res = client.get(f"/api/v1/leads/{lead_id}", headers=agent_auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == lead_id


def test_agent_cannot_view_unassigned_lead(client, test_data, agent_auth_headers):
    # Agent cannot view lead assigned to another team member
    lead_id = test_data["lead_manager"].id
    res = client.get(f"/api/v1/leads/{lead_id}", headers=agent_auth_headers)
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_agent_cannot_update_unassigned_lead(client, test_data, agent_auth_headers):
    # Agent cannot modify another agent's lead
    lead_id = test_data["lead_manager"].id
    res = client.patch(
        f"/api/v1/leads/{lead_id}",
        json={"status": "negotiation"},
        headers=agent_auth_headers,
    )
    assert res.status_code == 403


def test_agent_cannot_reassign_leads(client, test_data, agent_auth_headers):
    # Agent cannot reassign leads (only manager/owner can)
    lead_id = test_data["lead_agent"].id
    res = client.post(
        f"/api/v1/leads/{lead_id}/assign",
        json={"agent_id": test_data["manager_apex"].id},
        headers=agent_auth_headers,
    )
    assert res.status_code == 403


def test_agent_cannot_delete_leads(client, test_data, agent_auth_headers):
    # Agent cannot delete leads
    lead_id = test_data["lead_agent"].id
    res = client.delete(f"/api/v1/leads/{lead_id}", headers=agent_auth_headers)
    assert res.status_code == 403


def test_agent_cannot_create_property(client, agent_auth_headers):
    # Property inventory creation is manager/owner only
    res = client.post(
        "/api/v1/properties",
        json={
            "title": "Unauthorized Agent Listing",
            "type": "House / Villa",
            "city": "Islamabad",
            "location": "Sector F-10",
            "society": "F-10",
            "price_pkr": 50000000.0,
            "area_size": "1 Kanal",
            "image_url": "https://example.com/prop.jpg",
            "description": "Attempted by agent",
        },
        headers=agent_auth_headers,
    )
    assert res.status_code == 403


def test_agent_cannot_manage_team_members(client, agent_auth_headers):
    # Agent cannot invite new team members
    res = client.post(
        "/api/v1/team",
        json={
            "email": "newbie@apex.pk",
            "password": "Password123!",
            "full_name": "New Team Member",
            "role": "agent",
        },
        headers=agent_auth_headers,
    )
    assert res.status_code == 403


def test_agent_cannot_update_agency_settings(client, agent_auth_headers):
    # Agent cannot change agency settings
    res = client.patch(
        "/api/v1/settings/agency",
        json={"name": "Hacked Agency Name"},
        headers=agent_auth_headers,
    )
    assert res.status_code == 403


def test_owner_can_get_and_update_agency_settings(client, owner_auth_headers):
    res = client.get("/api/v1/settings/agency", headers=owner_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "name" in data
    assert data["followup_reminder_minutes_before"] is not None

    patch_res = client.patch(
        "/api/v1/settings/agency",
        headers=owner_auth_headers,
        json={"tagline": "Islamabad Premier Properties"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["tagline"] == "Islamabad Premier Properties"


def test_manager_can_view_all_agency_leads(client, test_data, manager_auth_headers):
    # Manager can view all leads across the agency
    res = client.get("/api/v1/leads", headers=manager_auth_headers)
    assert res.status_code == 200
    ids = [item["id"] for item in res.json()["items"]]
    assert test_data["lead_agent"].id in ids
    assert test_data["lead_manager"].id in ids


def test_manager_can_reassign_lead(client, test_data, manager_auth_headers):
    # Manager can reassign any lead in their agency
    lead_id = test_data["lead_agent"].id
    res = client.post(
        f"/api/v1/leads/{lead_id}/assign",
        json={"agent_id": test_data["manager_apex"].id},
        headers=manager_auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["assigned_agent_id"] == test_data["manager_apex"].id


def test_manager_cannot_update_agency_settings(client, manager_auth_headers):
    # Manager CANNOT edit agency settings (Owner only!)
    res = client.patch(
        "/api/v1/settings/agency",
        json={"name": "Unauthorized Manager Rename"},
        headers=manager_auth_headers,
    )
    assert res.status_code == 403
    assert "Agency Owner" in res.json()["detail"]


def test_manager_cannot_invite_team_members(client, manager_auth_headers):
    # Manager CANNOT add team members (Owner only!)
    res = client.post(
        "/api/v1/team",
        json={
            "email": "agent2@apex.pk",
            "password": "Password123!",
            "full_name": "Another Agent",
            "role": "agent",
        },
        headers=manager_auth_headers,
    )
    assert res.status_code == 403
    assert "Agency Owner" in res.json()["detail"]


def test_owner_can_manage_agency_settings(client, test_data, owner_auth_headers):
    # Agency Owner has full permissions to update agency profile
    res = client.patch(
        "/api/v1/settings/agency",
        json={"tagline": "Updated Elite Real Estate Advisory"},
        headers=owner_auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["tagline"] == "Updated Elite Real Estate Advisory"


def test_owner_can_invite_team_member(client, owner_auth_headers):
    # Agency Owner can add new team members
    res = client.post(
        "/api/v1/team",
        json={
            "email": "salman@apex.pk",
            "password": "SalmanPassword123!",
            "full_name": "Salman Farooq",
            "role": "agent",
        },
        headers=owner_auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["email"] == "salman@apex.pk"
