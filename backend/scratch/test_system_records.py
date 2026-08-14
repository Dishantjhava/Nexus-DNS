"""Test script to verify System-managed NS & SOA record auto-creation and 403 edit/delete protection."""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    print("=== STARTING SYSTEM-MANAGED RECORD (NS/SOA) PROTECTION TESTS ===")

    # 1. Login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200

    # Clean up test zone if exists
    for z in client.get("/api/hosted-zones?page_size=100").json().get("items", []):
        if z["name"] == "system-record-test.com":
            client.delete(f"/api/hosted-zones/{z['id']}")

    # 2. Create Zone
    res = client.post("/api/hosted-zones", json={"name": "system-record-test.com", "zone_type": "PUBLIC"})
    assert res.status_code == 201
    zone = res.json()
    zone_id = zone["id"]
    print(f"1. Created zone 'system-record-test.com' -> Zone ID {zone_id}")

    # 3. Get Records list and verify Records (2) NS and SOA exist
    res_records = client.get(f"/api/hosted-zones/{zone_id}/records")
    assert res_records.status_code == 200
    records = res_records.json()["items"]
    print(f"2. Zone records count: {len(records)}")
    assert len(records) == 2, f"Expected 2 system records on creation, got {len(records)}"

    types = [r["type"] for r in records]
    print(f"   Record types present: {types}")
    assert "NS" in types, "NS record missing"
    assert "SOA" in types, "SOA record missing"

    ns_rec = next(r for r in records if r["type"] == "NS")
    soa_rec = next(r for r in records if r["type"] == "SOA")

    assert ns_rec["is_system"] is True, "NS record is_system should be True"
    assert soa_rec["is_system"] is True, "SOA record is_system should be True"
    print("   NS and SOA system flags confirmed as True.")

    # 4. Attempt to update NS record -> Expected 403 Forbidden
    res_update_ns = client.patch(f"/api/hosted-zones/{zone_id}/records/{ns_rec['id']}", json={"ttl": 900})
    print(f"3. PATCH NS record -> Status {res_update_ns.status_code}, Response: {res_update_ns.json()}")
    assert res_update_ns.status_code == 403, f"Expected 403 for NS update, got {res_update_ns.status_code}"

    # 5. Attempt to delete NS record -> Expected 403 Forbidden
    res_delete_ns = client.delete(f"/api/hosted-zones/{zone_id}/records/{ns_rec['id']}")
    print(f"4. DELETE NS record -> Status {res_delete_ns.status_code}")
    assert res_delete_ns.status_code == 403, f"Expected 403 for NS delete, got {res_delete_ns.status_code}"

    # 6. Attempt to update SOA record -> Expected 403 Forbidden
    res_update_soa = client.patch(f"/api/hosted-zones/{zone_id}/records/{soa_rec['id']}", json={"ttl": 900})
    print(f"5. PATCH SOA record -> Status {res_update_soa.status_code}, Response: {res_update_soa.json()}")
    assert res_update_soa.status_code == 403, f"Expected 403 for SOA update, got {res_update_soa.status_code}"

    # 7. Attempt to delete SOA record -> Expected 403 Forbidden
    res_delete_soa = client.delete(f"/api/hosted-zones/{zone_id}/records/{soa_rec['id']}")
    print(f"6. DELETE SOA record -> Status {res_delete_soa.status_code}")
    assert res_delete_soa.status_code == 403, f"Expected 403 for SOA delete, got {res_delete_soa.status_code}"

    # Cleanup
    client.delete(f"/api/hosted-zones/{zone_id}")
    print("\n=== ALL SYSTEM-MANAGED RECORD (NS/SOA) PROTECTION TESTS PASSED 100%! ===")

if __name__ == "__main__":
    run_tests()
