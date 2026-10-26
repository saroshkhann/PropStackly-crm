from decimal import Decimal
import pytest
from app.models.lead import LeadActivity
from app.models.deal import Deal


def test_calculate_commission_endpoint(client, owner_auth_headers):
    """
    Test commission calculation:
    On an 85,000,000 PKR (Rs. 8.5 Crore) deal:
    2% standard (1% buyer + 1% seller) = 1,700,000 PKR (Rs. 17.00 Lakh).
    50/50 agency vs agent split = 850,000 PKR (Rs. 8.50 Lakh) each.
    """
    response = client.post(
        "/api/v1/deals/calculate-commission",
        headers=owner_auth_headers,
        json={
            "deal_value_pkr": 85000000.0,
            "commission_side": "both_sides_2pct",
            "agency_split_percentage": 50.0,
            "agent_split_percentage": 50.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["deal_value_pkr"]) == 85000000.0
    assert float(data["commission_percentage"]) == 2.0
    assert float(data["total_commission_pkr"]) == 1700000.0
    assert float(data["agency_commission_pkr"]) == 850000.0
    assert float(data["agent_commission_pkr"]) == 850000.0
    assert "Crore" in data["formatted_deal_value"]
    assert "Lakh" in data["formatted_total_commission"]


def test_calculate_commission_single_side_and_custom(client, owner_auth_headers):
    # 1% buyer side only on 50,000,000 PKR with 60/40 agency/agent split
    response = client.post(
        "/api/v1/deals/calculate-commission",
        headers=owner_auth_headers,
        json={
            "deal_value_pkr": 50000000.0,
            "commission_side": "buyer_side_1pct",
            "agency_split_percentage": 60.0,
            "agent_split_percentage": 40.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["total_commission_pkr"]) == 500000.0  # 1% of 50M
    assert float(data["agency_commission_pkr"]) == 300000.0  # 60% of 500k
    assert float(data["agent_commission_pkr"]) == 200000.0  # 40% of 500k


def test_create_and_transition_pakistani_deal_flow(client, owner_auth_headers, test_data, db_session):
    lead_id = test_data["lead_agent"].id
    prop_id = test_data["prop_apex"].id
    agent_id = test_data["agent_apex"].id

    # 1. Create deal at Stage 1: Token (Booking)
    payload = {
        "lead_id": lead_id,
        "property_id": prop_id,
        "agent_id": agent_id,
        "title": "DHA 2 Villa Deal - Booking Lock",
        "stage": "token",
        "deal_value_pkr": 85000000.0,
        "token_amount_pkr": 1000000.0,
        "token_date": "2026-10-25",
        "token_type": "pakka_token",
        "commission_side": "both_sides_2pct",
        "agency_split_percentage": 50.0,
        "agent_split_percentage": 50.0,
        "notes": "Pakka token advance paid via crossed cheque",
    }
    create_res = client.post("/api/v1/deals", headers=owner_auth_headers, json=payload)
    assert create_res.status_code == 201
    deal = create_res.json()
    deal_id = deal["id"]
    assert deal["stage"] == "token"
    assert float(deal["token_amount_pkr"]) == 1000000.0
    assert float(deal["commission_pkr"]) == 1700000.0
    assert float(deal["agency_commission_pkr"]) == 850000.0
    assert float(deal["agent_commission_pkr"]) == 850000.0

    # 2. Advance to Stage 2: Bayana (Iqrarnama signed)
    bayana_res = client.patch(
        f"/api/v1/deals/{deal_id}",
        headers=owner_auth_headers,
        json={
            "stage": "bayana",
            "bayana_amount_pkr": 15000000.0,
            "bayana_date": "2026-11-05",
            "iqrarnama_number": "STAMP-ISB-2026-8891",
        },
    )
    assert bayana_res.status_code == 200
    updated_deal = bayana_res.json()
    assert updated_deal["stage"] == "bayana"
    assert float(updated_deal["bayana_amount_pkr"]) == 15000000.0
    assert updated_deal["iqrarnama_number"] == "STAMP-ISB-2026-8891"

    # 3. Advance to Stage 3: NOC & Society Clearance (NDC)
    noc_res = client.patch(
        f"/api/v1/deals/{deal_id}",
        headers=owner_auth_headers,
        json={
            "stage": "noc_verification",
            "noc_authority": "DHA Islamabad Phase 2 Transfer Office",
            "ndc_cleared": True,
        },
    )
    assert noc_res.status_code == 200
    assert noc_res.json()["stage"] == "noc_verification"
    assert noc_res.json()["ndc_cleared"] is True

    # 4. Advance to Stage 4: Final Transfer / Registry
    transfer_res = client.patch(
        f"/api/v1/deals/{deal_id}",
        headers=owner_auth_headers,
        json={
            "stage": "final_transfer",
            "transfer_date": "2026-11-20",
            "registry_number": "DHA-ISB-TRF-4412",
        },
    )
    assert transfer_res.status_code == 200
    assert transfer_res.json()["stage"] == "final_transfer"

    # 5. Complete Deal
    complete_res = client.patch(
        f"/api/v1/deals/{deal_id}",
        headers=owner_auth_headers,
        json={"stage": "completed", "settlement_status": "fully_settled"},
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["stage"] == "completed"
    assert complete_res.json()["settlement_status"] == "fully_settled"
    assert complete_res.json()["closed_at"] is not None

    # Verify timeline activities recorded for the lead
    activities = db_session.query(LeadActivity).filter(LeadActivity.lead_id == lead_id).all()
    act_types = [a.type for a in activities]
    assert "deal_created" in act_types
    assert "deal_stage_changed" in act_types


def test_deals_multitenancy_isolation(client, owner_auth_headers, lahore_auth_headers, test_data):
    # Create deal in Apex Islamabad (Agency 1)
    payload = {
        "lead_id": test_data["lead_agent"].id,
        "title": "Apex Multitenant Secret Deal",
        "stage": "token",
        "deal_value_pkr": 60000000.0,
    }
    create_res = client.post("/api/v1/deals", headers=owner_auth_headers, json=payload)
    assert create_res.status_code == 201
    deal_id = create_res.json()["id"]

    # Agency 2 (Lahore) cannot read this deal
    lahore_get = client.get(f"/api/v1/deals/{deal_id}", headers=lahore_auth_headers)
    assert lahore_get.status_code == 404

    # Agency 2 cannot modify this deal
    lahore_patch = client.patch(
        f"/api/v1/deals/{deal_id}",
        headers=lahore_auth_headers,
        json={"stage": "bayana"},
    )
    assert lahore_patch.status_code == 404

    # Agency 2 listing deals should not include Agency 1's deal
    lahore_list = client.get("/api/v1/deals", headers=lahore_auth_headers)
    assert lahore_list.status_code == 200
    deal_ids = [d["id"] for d in lahore_list.json()]
    assert deal_id not in deal_ids


def test_deals_agent_rbac_filtering(client, owner_auth_headers, agent_auth_headers, test_data):
    # Deal 1: Assigned to agent_apex
    deal_1 = client.post(
        "/api/v1/deals",
        headers=owner_auth_headers,
        json={
            "lead_id": test_data["lead_agent"].id,
            "agent_id": test_data["agent_apex"].id,
            "title": "Agent Deal",
            "deal_value_pkr": 30000000.0,
        },
    ).json()

    # Deal 2: Assigned to manager_apex
    deal_2 = client.post(
        "/api/v1/deals",
        headers=owner_auth_headers,
        json={
            "lead_id": test_data["lead_manager"].id,
            "agent_id": test_data["manager_apex"].id,
            "title": "Manager Deal",
            "deal_value_pkr": 70000000.0,
        },
    ).json()

    # Agent listing deals sees only deal_1
    agent_list = client.get("/api/v1/deals", headers=agent_auth_headers).json()
    agent_deal_ids = [d["id"] for d in agent_list]
    assert deal_1["id"] in agent_deal_ids
    assert deal_2["id"] not in agent_deal_ids

    # Owner listing deals sees both
    owner_list = client.get("/api/v1/deals", headers=owner_auth_headers).json()
    owner_deal_ids = [d["id"] for d in owner_list]
    assert deal_1["id"] in owner_deal_ids
    assert deal_2["id"] in owner_deal_ids


def test_prevent_duplicate_active_deal_for_same_lead(client, owner_auth_headers, test_data):
    lead_id = test_data["lead_agent"].id
    prop_id = test_data["prop_apex"].id

    # Create first deal
    res1 = client.post(
        "/api/v1/deals",
        headers=owner_auth_headers,
        json={
            "lead_id": lead_id,
            "property_id": prop_id,
            "title": "Deal 1",
            "deal_value_pkr": 50000000.0,
            "token_amount_pkr": 1000000.0,
        },
    )
    assert res1.status_code == 201

    # Attempt to create duplicate deal for the same lead
    res2 = client.post(
        "/api/v1/deals",
        headers=owner_auth_headers,
        json={
            "lead_id": lead_id,
            "property_id": prop_id,
            "title": "Deal 2 Duplicate",
            "deal_value_pkr": 50000000.0,
            "token_amount_pkr": 1000000.0,
        },
    )
    assert res2.status_code == 400
    assert "already exists for this lead" in res2.json()["detail"]


def test_deal_inherits_lead_assigned_agent(client, owner_auth_headers, test_data):
    # lead_agent is assigned to test_data["agent_apex"]
    lead = test_data["lead_agent"]
    agent_id = test_data["agent_apex"].id
    assert lead.assigned_agent_id == agent_id

    # Owner creates deal without explicitly providing agent_id
    res = client.post(
        "/api/v1/deals",
        headers=owner_auth_headers,
        json={
            "lead_id": lead.id,
            "title": "Auto-inherited Agent Deal",
            "deal_value_pkr": 40000000.0,
        },
    )
    assert res.status_code == 201
    deal = res.json()
    assert deal["agent_id"] == agent_id

