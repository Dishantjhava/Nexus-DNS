"""Test script for Record Filters (Type, CNAME, A, Clear) and TTL shortcut values."""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    print("=== STARTING RECORD FILTERS AND TTL SHORTCUTS TESTS ===")

    # 1. Login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200

    # Clean up test zone if exists
    for z in client.get("/api/hosted-zones?page_size=100").json().get("items", []):
        if z["name"] == "filter-ttl-test.com":
            client.delete(f"/api/hosted-zones/{z['id']}")

    # 2. Create Zone
    res = client.post("/api/hosted-zones", json={"name": "filter-ttl-test.com", "zone_type": "PUBLIC"})
    assert res.status_code == 201
    zone = res.json()
    zone_id = zone["id"]

    # 3. Create Records with TTL Shortcuts: 60 (1m), 3600 (1h), 86400 (1d), 300 (manual)
    r_a = client.post(f"/api/hosted-zones/{zone_id}/records", json={
        "name": "a.filter-ttl-test.com.", "type": "A", "ttl": 60, "values": ["1.1.1.1"]
    })
    print(f"Create A Record with 1m (60s) TTL -> Status {r_a.status_code}, TTL: {r_a.json().get('ttl')}")
    assert r_a.status_code == 201 and r_a.json()["ttl"] == 60

    r_cname = client.post(f"/api/hosted-zones/{zone_id}/records", json={
        "name": "cname.filter-ttl-test.com.", "type": "CNAME", "ttl": 3600, "values": ["target.com"]
    })
    print(f"Create CNAME Record with 1h (3600s) TTL -> Status {r_cname.status_code}, TTL: {r_cname.json().get('ttl')}")
    assert r_cname.status_code == 201 and r_cname.json()["ttl"] == 3600

    r_txt = client.post(f"/api/hosted-zones/{zone_id}/records", json={
        "name": "txt.filter-ttl-test.com.", "type": "TXT", "ttl": 86400, "values": ["v=spf1 include:_spf.google.com ~all"]
    })
    print(f"Create TXT Record with 1d (86400s) TTL -> Status {r_txt.status_code}, TTL: {r_txt.json().get('ttl')}")
    assert r_txt.status_code == 201 and r_txt.json()["ttl"] == 86400

    r_mx = client.post(f"/api/hosted-zones/{zone_id}/records", json={
        "name": "mx.filter-ttl-test.com.", "type": "MX", "ttl": 300, "values": [{"priority": 10, "exchange": "mail.com"}]
    })
    print(f"Create MX Record with 300s TTL -> Status {r_mx.status_code}, TTL: {r_mx.json().get('ttl')}")
    assert r_mx.status_code == 201 and r_mx.json()["ttl"] == 300

    # 4. Test Filtering by Type
    # A records filter
    res_a = client.get(f"/api/hosted-zones/{zone_id}/records?type=A")
    print(f"\nFilter Type 'A' -> Status {res_a.status_code}, Count: {res_a.json()['total']}")
    assert res_a.status_code == 200
    for r in res_a.json()["items"]:
        assert r["type"] == "A"

    # CNAME records filter
    res_cname = client.get(f"/api/hosted-zones/{zone_id}/records?type=CNAME")
    print(f"Filter Type 'CNAME' -> Status {res_cname.status_code}, Count: {res_cname.json()['total']}")
    assert res_cname.status_code == 200
    for r in res_cname.json()["items"]:
        assert r["type"] == "CNAME"

    # Clear filter (All records)
    res_all = client.get(f"/api/hosted-zones/{zone_id}/records")
    print(f"Clear Filter (All Records) -> Status {res_all.status_code}, Count: {res_all.json()['total']}")
    assert res_all.status_code == 200
    assert res_all.json()["total"] == 6 # 2 system (NS, SOA) + 4 user records (A, CNAME, TXT, MX)

    # Cleanup
    client.delete(f"/api/hosted-zones/{zone_id}")
    print("\n=== ALL RECORD FILTERS AND TTL SHORTCUTS TESTS PASSED 100%! ===")

if __name__ == "__main__":
    run_tests()
