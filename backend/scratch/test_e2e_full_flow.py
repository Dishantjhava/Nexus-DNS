"""Full E2E user flow verification script."""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from fastapi.testclient import TestClient
from app.main import app

def run_e2e_flow_verification():
    client = TestClient(app)
    print("=== STARTING FULL E2E USER FLOW VERIFICATION ===")

    # 1. Unauthenticated request to protected route
    res = client.get("/api/hosted-zones")
    print(f"1. Unauthenticated /api/hosted-zones -> Status {res.status_code}")
    assert res.status_code == 401, "Unauthenticated access should return 401"

    # 2. Login as admin
    login_payload = {"username": "admin", "password": "admin123"}
    res = client.post("/api/auth/login", json=login_payload)
    print(f"2. Sign in as 'admin' -> Status {res.status_code}, User: {res.json().get('username')}")
    assert res.status_code == 200, "Login should succeed"
    assert res.json().get("username") == "admin"

    # 3. Verify session me()
    res = client.get("/api/auth/me")
    print(f"3. Session verify /api/auth/me -> Status {res.status_code}, Username: {res.json().get('username')}")
    assert res.status_code == 200
    assert res.json().get("username") == "admin"

    # 4. Create Zone
    zone_payload = {
        "name": "flowtest-domain.com",
        "description": "Initial test description",
        "zone_type": "PUBLIC"
    }
    res = client.post("/api/hosted-zones", json=zone_payload)
    print(f"4. Create Zone 'flowtest-domain.com' -> Status {res.status_code}, Zone ID: {res.json().get('id')}")
    assert res.status_code == 201
    zone = res.json()
    zone_id = zone["id"]

    # 5. Zone Detail
    res = client.get(f"/api/hosted-zones/{zone_id}")
    print(f"5. Zone Detail GET /api/hosted-zones/{zone_id} -> Status {res.status_code}, Name: {res.json().get('name')}")
    assert res.status_code == 200

    # 6. Create Record
    record_payload = {
        "name": "api.flowtest-domain.com.",
        "type": "A",
        "ttl": 300,
        "values": ["1.2.3.4"]
    }
    res = client.post(f"/api/hosted-zones/{zone_id}/records", json=record_payload)
    print(f"6. Create Record 'api.flowtest-domain.com.' -> Status {res.status_code}, Record ID: {res.json().get('id')}")
    assert res.status_code == 201
    rec = res.json()
    rec_id = rec["id"]

    # 7. Edit Record
    update_rec_payload = {
        "ttl": 600,
        "values": ["5.6.7.8"]
    }
    res = client.put(f"/api/hosted-zones/{zone_id}/records/{rec_id}", json=update_rec_payload)
    print(f"7. Edit Record -> Status {res.status_code}, New TTL: {res.json().get('ttl')}, New Values: {res.json().get('values')}")
    assert res.status_code == 200
    assert res.json().get("ttl") == 600
    assert res.json().get("values") == ["5.6.7.8"]

    # 8. Delete Record
    res = client.delete(f"/api/hosted-zones/{zone_id}/records/{rec_id}")
    print(f"8. Delete Record -> Status {res.status_code}")
    assert res.status_code == 204

    # 9. Edit Zone Description
    update_zone_payload = {
        "description": "Updated flow test description"
    }
    res = client.patch(f"/api/hosted-zones/{zone_id}", json=update_zone_payload)
    print(f"9. Edit Zone Description -> Status {res.status_code}, Description: '{res.json().get('description')}'")
    assert res.status_code == 200
    assert res.json().get("description") == "Updated flow test description"

    # 10. Delete Zone
    res = client.delete(f"/api/hosted-zones/{zone_id}")
    print(f"10. Delete Zone -> Status {res.status_code}")
    assert res.status_code == 204

    # Verify zone is gone
    res = client.get(f"/api/hosted-zones/{zone_id}")
    print(f"11. Verify Zone deleted GET /api/hosted-zones/{zone_id} -> Status {res.status_code} (Expected 404)")
    assert res.status_code == 404

    # 12. Logout
    res = client.post("/api/auth/logout")
    print(f"12. Logout -> Status {res.status_code}")
    assert res.status_code == 200

    # 13. Try /api/hosted-zones after logout
    res = client.get("/api/hosted-zones")
    print(f"13. Try protected route after Logout -> Status {res.status_code} (Expected 401)")
    assert res.status_code == 401

    print("=== FULL E2E USER FLOW VERIFICATION COMPLETED SUCCESSFULLY (100% PASSED) ===")

if __name__ == "__main__":
    run_e2e_flow_verification()
