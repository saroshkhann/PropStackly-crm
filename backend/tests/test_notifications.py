from datetime import datetime, timezone, timedelta
from app.models.task import FollowUp
from app.models.notification import Notification
from app.services.scheduler import run_followup_reminders_job


def test_lead_assignment_triggers_notification(client, test_data, manager_auth_headers, agent_auth_headers):
    agent_user = test_data["agent_apex"]

    # 1. Manager creates a new lead and assigns it to Bilal (agent)
    res = client.post(
        "/api/v1/leads",
        headers=manager_auth_headers,
        json={
            "full_name": "Sardar Tariq Abbasi",
            "phone": "+92 300 7766554",
            "email": "tariq.abbasi@gmail.com",
            "budget_pkr": 65000000,
            "assigned_agent_id": agent_user.id,
            "property_type_interest": "House / Villa",
            "preferred_locations": "DHA Phase 2 Islamabad",
        },
    )
    assert res.status_code == 201
    lead_id = res.json()["id"]

    # 2. Agent checks their notification inbox
    res_notifs = client.get("/api/v1/notifications", headers=agent_auth_headers)
    assert res_notifs.status_code == 200
    items = res_notifs.json()["items"]
    assert len(items) >= 1

    # Verify notification details
    lead_notif = next((n for n in items if n["entity_id"] == lead_id), None)
    assert lead_notif is not None
    assert "Sardar Tariq Abbasi" in lead_notif["title"]
    assert "DHA Phase 2" in lead_notif["message"]
    assert lead_notif["type"] == "lead_assigned"
    assert lead_notif["priority"] == "high"
    assert lead_notif["is_read"] is False


def test_lead_reassignment_triggers_notification(client, test_data, manager_auth_headers, agent_auth_headers):
    lead = test_data["lead_manager"]
    agent_user = test_data["agent_apex"]

    # 1. Manager reassigns lead to agent Bilal
    res = client.post(
        f"/api/v1/leads/{lead.id}/assign",
        headers=manager_auth_headers,
        json={"agent_id": agent_user.id},
    )
    assert res.status_code == 200

    # 2. Agent Bilal receives the reassignment notification
    res_notifs = client.get("/api/v1/notifications?unread_only=true", headers=agent_auth_headers)
    assert res_notifs.status_code == 200
    assigned_notifs = [n for n in res_notifs.json()["items"] if n["entity_id"] == lead.id]
    assert len(assigned_notifs) == 1
    assert "New Lead Assigned" in assigned_notifs[0]["title"]


def test_notification_read_and_unread_counts(client, test_data, agent_auth_headers):
    # 1. Fetch unread count
    res_count = client.get("/api/v1/notifications/unread-count", headers=agent_auth_headers)
    assert res_count.status_code == 200
    initial_unread = res_count.json()["unread_count"]

    # 2. Get notification list
    res_list = client.get("/api/v1/notifications", headers=agent_auth_headers)
    assert res_list.status_code == 200
    items = res_list.json()["items"]

    if items:
        target_id = items[0]["id"]

        # 3. Mark single notification as read
        res_read = client.patch(f"/api/v1/notifications/{target_id}/read", headers=agent_auth_headers)
        assert res_read.status_code == 200
        assert res_read.json()["is_read"] is True

        # 4. Verify unread count decremented
        res_count_after = client.get("/api/v1/notifications/unread-count", headers=agent_auth_headers)
        assert res_count_after.json()["unread_count"] == initial_unread - 1

        # 5. Mark all as read
        res_all = client.post("/api/v1/notifications/mark-all-read", headers=agent_auth_headers)
        assert res_all.status_code == 200

        # Unread count should now be 0
        res_count_final = client.get("/api/v1/notifications/unread-count", headers=agent_auth_headers)
        assert res_count_final.json()["unread_count"] == 0


def test_notification_deduplication(client, test_data, manager_auth_headers, agent_auth_headers):
    agent_user = test_data["agent_apex"]

    # 1. Create a lead assigned to agent
    res = client.post(
        "/api/v1/leads",
        headers=manager_auth_headers,
        json={
            "full_name": "Chaudhry Afzal",
            "phone": "+92 321 9988771",
            "budget_pkr": 120000000,
            "assigned_agent_id": agent_user.id,
        },
    )
    assert res.status_code == 201
    lead_id = res.json()["id"]

    # 2. Calling reassign with the same agent should NOT create duplicate notifications
    res_reassign = client.post(
        f"/api/v1/leads/{lead_id}/assign",
        headers=manager_auth_headers,
        json={"agent_id": agent_user.id},
    )
    assert res_reassign.status_code == 200

    # 3. Check notifications: exactly 1 notification should exist for this assignment event
    res_notifs = client.get("/api/v1/notifications", headers=agent_auth_headers)
    lead_notifs = [n for n in res_notifs.json()["items"] if n["entity_id"] == lead_id and n["type"] == "lead_assigned"]
    assert len(lead_notifs) == 1


def test_scheduled_followup_reminders_upcoming_and_overdue(db_session, test_data, client, agent_auth_headers):
    agency = test_data["agency_1"]
    agent_user = test_data["agent_apex"]
    lead = test_data["lead_agent"]

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # 1. Upcoming follow-up in 30 minutes
    upcoming_time = (now + timedelta(minutes=30)).strftime("%H:%M")
    upcoming_fu = FollowUp(
        agency_id=agency.id,
        lead_id=lead.id,
        assigned_agent_id=agent_user.id,
        scheduled_date=today_str,
        scheduled_time=upcoming_time,
        notes="Call buyer regarding Sector B villa layout plan",
        type="Phone Call",
        completed=False,
    )

    # 2. Overdue follow-up from yesterday
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    overdue_fu = FollowUp(
        agency_id=agency.id,
        lead_id=lead.id,
        assigned_agent_id=agent_user.id,
        scheduled_date=yesterday_str,
        scheduled_time="11:00",
        notes="Discuss Bahria Town commercial plot offer",
        type="In-Person Meeting",
        completed=False,
    )

    db_session.add_all([upcoming_fu, overdue_fu])
    db_session.commit()

    # 3. Run the reminder job
    result = run_followup_reminders_job(db=db_session)
    assert result["success"] is True
    assert result["upcoming_reminders_sent"] >= 1
    assert result["overdue_reminders_sent"] >= 1

    # 4. Running it immediately a second time should deduplicate and NOT send again
    result_second = run_followup_reminders_job(db=db_session)
    assert result_second["success"] is True
    assert result_second["upcoming_reminders_sent"] == 0
    assert result_second["overdue_reminders_sent"] == 0

    # 5. Agent inspects notifications
    res_notifs = client.get("/api/v1/notifications", headers=agent_auth_headers)
    assert res_notifs.status_code == 200
    types = [n["type"] for n in res_notifs.json()["items"]]
    assert "followup_upcoming" in types
    assert "followup_overdue" in types


def test_cross_agency_notification_isolation(client, test_data, lahore_auth_headers, agent_auth_headers):
    # Agent creates a notification
    res = client.get("/api/v1/notifications", headers=agent_auth_headers)
    items = res.json()["items"]
    if items:
        notif_id = items[0]["id"]
        # Lahore agency user should get 404 when trying to access or mark Apex notification as read
        res_forbidden = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=lahore_auth_headers)
        assert res_forbidden.status_code == 404
