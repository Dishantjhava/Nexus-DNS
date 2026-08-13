"""Tests for the auth endpoints."""


class TestLogin:
    def test_success(self, client, seed_user):
        resp = client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "testpass"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert "id" in data
        assert "session_token" in resp.cookies

    def test_wrong_password(self, client, seed_user):
        resp = client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "wrong"},
        )
        assert resp.status_code == 401
        assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"

    def test_unknown_user(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"username": "nobody", "password": "pass"},
        )
        assert resp.status_code == 401


class TestMe:
    def test_authenticated(self, auth_client):
        resp = auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["username"] == "testuser"

    def test_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401
        assert resp.json()["error"]["code"] == "UNAUTHORIZED"


class TestLogout:
    def test_logout_clears_session(self, auth_client):
        resp = auth_client.post("/api/auth/logout")
        assert resp.status_code == 200

        # Session should now be invalid
        resp = auth_client.get("/api/auth/me")
        assert resp.status_code == 401
