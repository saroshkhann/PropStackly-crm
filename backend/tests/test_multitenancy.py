from decimal import Decimal


def test_cross_agency_lead_listing_isolation(client, test_data, apex_auth_headers, lahore_auth_headers):
    # 1. Apex user queries leads
    res_apex = client.get("/api/v1/leads", headers=apex_auth_headers)
    assert res_apex.status_code == 200
    apex_leads = res_apex.json()["items"]
    apex_ids = [l["id"] for l in apex_leads]
    assert test_data["lead_apex"].id in apex_ids
    assert test_data["lead_lahore"].id not in apex_ids

    # 2. Lahore user queries leads
    res_lahore = client.get("/api/v1/leads", headers=lahore_auth_headers)
    assert res_lahore.status_code == 200
    lahore_leads = res_lahore.json()["items"]
    lahore_ids = [l["id"] for l in lahore_leads]
    assert test_data["lead_lahore"].id in lahore_ids
    assert test_data["lead_apex"].id not in lahore_ids


def test_cross_agency_lead_access_blocked(client, test_data, apex_auth_headers):
    # Apex user attempts GET on Lahore lead
    lahore_lead_id = test_data["lead_lahore"].id
    res = client.get(f"/api/v1/leads/{lahore_lead_id}", headers=apex_auth_headers)
    assert res.status_code == 404
    assert res.json()["detail"] == "Lead not found"


def test_cross_agency_lead_modification_blocked(client, test_data, apex_auth_headers):
    # Apex user attempts to update Lahore lead status
    lahore_lead_id = test_data["lead_lahore"].id
    res = client.patch(
        f"/api/v1/leads/{lahore_lead_id}",
        json={"status": "won"},
        headers=apex_auth_headers,
    )
    assert res.status_code == 404


def test_cross_agency_lead_deletion_blocked(client, test_data, apex_auth_headers):
    # Apex user attempts to delete Lahore lead
    lahore_lead_id = test_data["lead_lahore"].id
    res = client.delete(f"/api/v1/leads/{lahore_lead_id}", headers=apex_auth_headers)
    assert res.status_code == 404


def test_client_supplied_agency_id_is_untrusted(client, test_data, apex_auth_headers):
    # Client tries to inject Lahore's agency_id when creating a lead
    payload = {
        "full_name": "Tampered Agency Lead",
        "phone": "+92 300 9999999",
        "budget_pkr": 50000000.0,
        "agency_id": test_data["agency_2"].id,  # Lahore agency injected!
    }
    res = client.post("/api/v1/leads", json=payload, headers=apex_auth_headers)
    assert res.status_code == 201
    created = res.json()

    # Must be forced to authenticated user's agency (Apex), NOT Lahore!
    assert created["agency_id"] == test_data["agency_1"].id
    assert created["agency_id"] != test_data["agency_2"].id


def test_assign_agent_from_different_agency_blocked(client, test_data, apex_auth_headers):
    # Apex lead cannot be assigned to Lahore agent
    apex_lead_id = test_data["lead_apex"].id
    lahore_agent_id = test_data["user_lahore"].id
    res = client.post(
        f"/api/v1/leads/{apex_lead_id}/assign",
        json={"agent_id": lahore_agent_id},
        headers=apex_auth_headers,
    )
    assert res.status_code == 400
    assert "does not belong to this agency" in res.json()["detail"]


def test_cross_agency_property_isolation(client, test_data, apex_auth_headers, lahore_auth_headers):
    # Apex user cannot see Lahore property
    res = client.get("/api/v1/properties", headers=apex_auth_headers)
    assert res.status_code == 200
    props = res.json()["items"]
    prop_ids = [p["id"] for p in props]
    assert test_data["prop_apex"].id in prop_ids
    assert test_data["prop_lahore"].id not in prop_ids

    # Direct GET on Lahore property returns 404
    lahore_prop_id = test_data["prop_lahore"].id
    res_direct = client.get(f"/api/v1/properties/{lahore_prop_id}", headers=apex_auth_headers)
    assert res_direct.status_code == 404


def test_cross_agency_site_visit_blocked(client, test_data, apex_auth_headers):
    # Apex user attempts to schedule visit on Lahore property
    payload = {
        "lead_id": test_data["lead_apex"].id,
        "property_id": test_data["prop_lahore"].id,
        "visit_date": "2026-10-25",
        "visit_time": "14:00",
    }
    res = client.post("/api/v1/site-visits", json=payload, headers=apex_auth_headers)
    assert res.status_code == 404
    assert "Property not found in this agency" in res.json()["detail"]
