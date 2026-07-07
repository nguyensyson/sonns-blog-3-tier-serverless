def test_register_and_login_success(client):
    register = client.post(
        "/auth/register",
        json={"email": "alice@test.com", "password": "secret123", "displayName": "Alice"},
    )
    assert register.status_code == 200
    body = register.json()
    assert body["success"] is True
    assert body["data"]["accessToken"]
    assert body["data"]["refreshToken"]

    login = client.post("/auth/login", json={"email": "alice@test.com", "password": "secret123"})
    assert login.status_code == 200
    assert login.json()["data"]["accessToken"]


def test_register_duplicate_email_returns_409(client):
    payload = {"email": "dup@test.com", "password": "secret123", "displayName": "Dup"}
    client.post("/auth/register", json=payload)
    second = client.post("/auth/register", json=payload)
    assert second.status_code == 409
    assert second.json()["success"] is False
    assert second.json()["error"]["code"] == "CONFLICT"


def test_login_wrong_password_returns_401(client):
    client.post(
        "/auth/register",
        json={"email": "bob@test.com", "password": "secret123", "displayName": "Bob"},
    )
    resp = client.post("/auth/login", json={"email": "bob@test.com", "password": "wrong-pass"})
    assert resp.status_code == 401
    assert resp.json()["success"] is False
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"


def test_register_validation_error_returns_400_with_field_details(client):
    resp = client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "123", "displayName": ""},
    )
    assert resp.status_code == 400
    error = resp.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert len(error["details"]) >= 1


def test_get_me_without_token_returns_401(client):
    resp = client.get("/users/me")
    assert resp.status_code == 401
    assert resp.json()["success"] is False
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"


def test_get_me_with_valid_token_returns_profile(client):
    register = client.post(
        "/auth/register",
        json={"email": "carol@test.com", "password": "secret123", "displayName": "Carol"},
    )
    token = register.json()["data"]["accessToken"]
    resp = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == "carol@test.com"
    assert resp.json()["data"]["displayName"] == "Carol"
