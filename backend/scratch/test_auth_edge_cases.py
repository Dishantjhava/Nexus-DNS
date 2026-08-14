"""Test script for Authentication Edge Cases: wrong password, empty password, logout, direct URL access."""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    print("=== STARTING AUTHENTICATION EDGE CASES TESTS ===")

    # 1. Wrong Password (admin / wrongpassword)
    res_wrong = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    print(f"1. Wrong Password -> Status {res_wrong.status_code}, Response: {res_wrong.json()}")
    assert res_wrong.status_code == 401
    assert res_wrong.json().get("error", {}).get("code") == "INVALID_CREDENTIALS"
    assert "invalid username or password" in res_wrong.json().get("error", {}).get("message", "").lower()

    # 2. Empty Username / Password
    res_empty_p = client.post("/api/auth/login", json={"username": "admin", "password": ""})
    print(f"2. Empty Password -> Status {res_empty_p.status_code}")
    assert res_empty_p.status_code in [401, 422]

    res_empty_u = client.post("/api/auth/login", json={"username": "", "password": "admin123"})
    print(f"   Empty Username -> Status {res_empty_u.status_code}")
    assert res_empty_u.status_code in [401, 422]

    # 3. Successful Login as admin
    res_login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    print(f"3. Valid Login -> Status {res_login.status_code}, User: {res_login.json().get('username')}")
    assert res_login.status_code == 200

    # 4. Session Access (GET /api/hosted-zones)
    res_zones = client.get("/api/hosted-zones")
    print(f"4. Session Protected Route Access -> Status {res_zones.status_code}")
    assert res_zones.status_code == 200

    # 5. Logout
    res_logout = client.post("/api/auth/logout")
    print(f"5. Logout -> Status {res_logout.status_code}")
    assert res_logout.status_code == 200

    # 6. Direct URL access after Logout
    res_direct_hz = client.get("/api/hosted-zones")
    print(f"6. Direct /hosted-zones access after logout -> Status {res_direct_hz.status_code} (Expected 401)")
    assert res_direct_hz.status_code == 401

    res_direct_zone1 = client.get("/api/hosted-zones/1")
    print(f"   Direct /hosted-zones/1 access after logout -> Status {res_direct_zone1.status_code} (Expected 401)")
    assert res_direct_zone1.status_code == 401

    print("\n=== ALL AUTHENTICATION EDGE CASES PASSED 100%! ===")

if __name__ == "__main__":
    run_tests()
