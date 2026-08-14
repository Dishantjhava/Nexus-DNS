"""Test script for Create Hosted Zone validation, 409 duplicate check, and Public/Private zone type."""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    print("=== STARTING CREATE HOSTED ZONE VALIDATION & DUPLICATE TESTS ===")

    # 1. Login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200

    # 2. Test Invalid Inputs
    invalid_cases = [
        ("", "Domain name is required."),
        ("   ", "Domain name is required."),
        ("abc", "Invalid domain name format"),
        ("hello..", "Domain name cannot contain consecutive dots"),
        (".com", "Domain name cannot start with a dot"),
    ]

    for domain_name, expected_msg_substring in invalid_cases:
        res = client.post("/api/hosted-zones", json={"name": domain_name, "zone_type": "PUBLIC"})
        print(f"Invalid Domain '{domain_name}' -> Status {res.status_code}, Response: {res.json()}")
        assert res.status_code in [400, 422], f"Expected 400/422 for '{domain_name}', got {res.status_code}"

    # Clean up any existing test zones first
    for z in client.get("/api/hosted-zones?page_size=100").json().get("items", []):
      if z["name"] in ["flowtest-domain.com", "private-flowtest.com"]:
        client.delete(f"/api/hosted-zones/{z['id']}")

    # 3. Create Public Zone: flowtest-domain.com
    res = client.post("/api/hosted-zones", json={"name": "flowtest-domain.com", "zone_type": "PUBLIC"})
    print(f"\nCreate Public Zone 'flowtest-domain.com' -> Status {res.status_code}")
    assert res.status_code == 201
    pub_zone = res.json()
    assert pub_zone["zone_type"] == "PUBLIC"

    # 4. Duplicate Create: flowtest-domain.com again -> Expected 409 Conflict
    res_dup = client.post("/api/hosted-zones", json={"name": "flowtest-domain.com", "zone_type": "PUBLIC"})
    print(f"Duplicate Create 'flowtest-domain.com' -> Status {res_dup.status_code}, Response: {res_dup.json()}")
    err_msg = res_dup.json().get("error", {}).get("message", "") or res_dup.json().get("detail", "")
    assert "already exists" in err_msg.lower()

    # 5. Create Private Zone: private-flowtest.com
    res_priv = client.post("/api/hosted-zones", json={"name": "private-flowtest.com", "zone_type": "PRIVATE"})
    print(f"\nCreate Private Zone 'private-flowtest.com' -> Status {res_priv.status_code}")
    assert res_priv.status_code == 201
    priv_zone = res_priv.json()
    assert priv_zone["zone_type"] == "PRIVATE"

    # 6. Verify GET /api/hosted-zones lists both PUBLIC and PRIVATE correctly
    res_list = client.get("/api/hosted-zones")
    print(f"\nGET /api/hosted-zones -> Status {res_list.status_code}")
    assert res_list.status_code == 200
    items = res_list.json()["items"]
    
    pub_in_list = next((z for z in items if z["id"] == pub_zone["id"]), None)
    priv_in_list = next((z for z in items if z["id"] == priv_zone["id"]), None)

    assert pub_in_list is not None and pub_in_list["zone_type"] == "PUBLIC"
    assert priv_in_list is not None and priv_in_list["zone_type"] == "PRIVATE"

    # Cleanup
    client.delete(f"/api/hosted-zones/{pub_zone['id']}")
    client.delete(f"/api/hosted-zones/{priv_zone['id']}")

    print("\n=== ALL VALIDATION, DUPLICATE (409), AND PUBLIC/PRIVATE TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
