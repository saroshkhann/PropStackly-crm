def test_create_lead_success(client, test_data, apex_auth_headers):
    payload = {
        "full_name": "Naveed Afzal",
        "phone": "+92 300 7778899",
        "email": "naveed@example.com",
        "city": "Islamabad",
        "source": "Zameen.com",
        "status": "new",
        "priority": "high",
        "budget_pkr": 65000000.0,
        "property_type_interest": "House / Villa",
        "preferred_locations": "DHA Phase 2 Islamabad",
        "purpose": "Own Residence",
        "assigned_agent_id": test_data["agent_apex"].id,
        "initial_note": "Interested in 10 Marla or 1 Kanal ready house.",
    }
    res = client.post("/api/v1/leads", json=payload, headers=apex_auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["full_name"] == "Naveed Afzal"
    assert data["budget_pkr"] == "65000000.00"
    assert data["assigned_agent_name"] == test_data["agent_apex"].full_name


def test_filter_leads_by_status(client, test_data, apex_auth_headers):
    res = client.get("/api/v1/leads?status=new", headers=apex_auth_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert all(item["status"] == "new" for item in items)


def test_lead_detail_with_notes_and_activities(client, test_data, apex_auth_headers):
    lead_id = test_data["lead_apex"].id
    # Add note
    res_note = client.post(
        f"/api/v1/leads/{lead_id}/notes",
        json={"content": "Test note content for follow up"},
        headers=apex_auth_headers,
    )
    assert res_note.status_code == 201

    # Add activity
    res_act = client.post(
        f"/api/v1/leads/{lead_id}/activities",
        json={
            "type": "call",
            "title": "Client Called Back",
            "description": "Discussed possession timeline for DHA 2 plot.",
        },
        headers=apex_auth_headers,
    )
    assert res_act.status_code == 201

    # Fetch detail
    res_detail = client.get(f"/api/v1/leads/{lead_id}", headers=apex_auth_headers)
    assert res_detail.status_code == 200
    data = res_detail.json()
    assert len(data["notes"]) >= 1
    assert any("Test note content" in n["content"] for n in data["notes"])
    assert len(data["activities"]) >= 1


def test_lead_update_status(client, test_data, apex_auth_headers):
    lead_id = test_data["lead_apex"].id
    res = client.patch(
        f"/api/v1/leads/{lead_id}",
        json={"status": "negotiation"},
        headers=apex_auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "negotiation"


def test_lead_deletion(client, test_data, apex_auth_headers):
    # Create temporary lead to delete
    res_create = client.post(
        "/api/v1/leads",
        json={"full_name": "Delete Me", "phone": "+92 300 0000000", "budget_pkr": 1000000.0},
        headers=apex_auth_headers,
    )
    temp_id = res_create.json()["id"]

    res_del = client.delete(f"/api/v1/leads/{temp_id}", headers=apex_auth_headers)
    assert res_del.status_code == 200

    # Ensure it's gone
    res_check = client.get(f"/api/v1/leads/{temp_id}", headers=apex_auth_headers)
    assert res_check.status_code == 404


def test_smart_property_matching_for_lead(client, test_data, apex_auth_headers, lahore_auth_headers):
    lead_id = test_data["lead_apex"].id
    res = client.get(f"/api/v1/leads/{lead_id}/matches", headers=apex_auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["lead_id"] == lead_id
    assert "matches" in data
    assert len(data["matches"]) >= 1

    top_match = data["matches"][0]
    assert "match_score" in top_match
    assert top_match["match_score"] >= 30
    assert len(top_match["reasons"]) >= 1
    assert "whatsapp_pitch_text" in top_match
    assert "Assalam-o-Alaikum" in top_match["whatsapp_pitch_text"]

    # Test Cross-agency isolation: Lahore user cannot see matches for Apex lead
    res_cross = client.get(f"/api/v1/leads/{lead_id}/matches", headers=lahore_auth_headers)
    assert res_cross.status_code == 404
