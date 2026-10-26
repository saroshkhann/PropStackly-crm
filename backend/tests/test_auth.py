from app.core.config import settings


def test_login_success_sets_httponly_cookie(client, test_data):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": "ApexPass123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "hamza@apex.pk"
    assert data["user"]["role"] == "owner"
    assert data["user"]["agency_id"] == test_data["agency_1"].id

    # Verify HttpOnly cookie was set
    assert settings.COOKIE_NAME in res.cookies
    cookie = res.cookies[settings.COOKIE_NAME]
    assert cookie == data["access_token"]


def test_authenticated_via_cookie(client, test_data):
    # 1. Log in to get cookie
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": "ApexPass123!"},
    )
    assert login_res.status_code == 200

    # 2. Make authenticated request WITHOUT Authorization header (relying purely on cookie!)
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "hamza@apex.pk"


def test_logout_clears_cookie(client, test_data):
    # Log in first
    client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": "ApexPass123!"},
    )

    # Log out
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

    # Verify cookie was cleared and subsequent request fails with 401
    client.cookies.clear()  # Ensure client reflects cleared cookie
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 401


def test_login_safe_error_message(client):
    # Incorrect password returns generic safe message
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": "WrongPassword!"},
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"

    # Nonexistent user returns the identical safe message
    res2 = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@apex.pk", "password": "WrongPassword!"},
    )
    assert res2.status_code == 401
    assert res2.json()["detail"] == "Invalid email or password"


def test_login_rate_limiting_triggers_429(client, test_data):
    # Attempt 5 consecutive failed logins
    for _ in range(5):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "hamza@apex.pk", "password": "BadPassword!"},
        )
        assert res.status_code == 401

    # 6th attempt must trigger rate limit 429 Too Many Requests
    blocked_res = client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": "BadPassword!"},
    )
    assert blocked_res.status_code == 429
    assert "Too many failed login attempts" in blocked_res.json()["detail"]


def test_unauthenticated_request_rejected(client):
    client.cookies.clear()
    res = client.get("/api/v1/leads")
    assert res.status_code == 401
