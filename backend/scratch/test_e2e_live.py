import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

def run_e2e():
    with TestClient(app) as client:
        print("=== 1. LOGIN ===")
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code == 200
        user_name = r.json()["username"]
        has_cookie = "session_token" in client.cookies
        print(f"Status: {r.status_code}, Logged in as: {user_name}, Session Cookie Set: {has_cookie}")

        print("\n=== 2. CREATE HOSTED ZONE ===")
        r = client.post("/api/hosted-zones", json={
            "name": "e2e-demo.com",
            "description": "E2E Live Verification Zone",
            "zone_type": "PUBLIC"
        })
        assert r.status_code == 201
        zone = r.json()
        zone_id = zone["id"]
        print(f"Status: {r.status_code}, Zone ID: {zone_id}, Name: {zone['name']}, Record Count: {zone['record_count']}")

        print("\n=== 3. CONFIRM AUTO-GENERATED SYSTEM NS RECORD ===")
        r = client.get(f"/api/hosted-zones/{zone_id}/records")
        assert r.status_code == 200
        records = r.json()["items"]
        assert len(records) == 1
        ns_rec = records[0]
        print(f"Status: {r.status_code}, NS Record ID: {ns_rec['id']}, Name: {ns_rec['name']}, Type: {ns_rec['type']}, is_system: {ns_rec['is_system']}")
        print(f"Nameservers (4 values): {ns_rec['values']}")

        print("\n=== 4. CREATE USER A RECORD ===")
        r = client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "app.e2e-demo.com",
            "type": "A",
            "ttl": 300,
            "values": ["1.2.3.4"]
        })
        assert r.status_code == 201
        a_rec = r.json()
        print(f"Status: {r.status_code}, Created Record ID: {a_rec['id']}, Name: {a_rec['name']}, is_system: {a_rec['is_system']}")

        print("\n=== 5. ATTEMPT PATCH ON SYSTEM NS RECORD (EXPECT 403) ===")
        r = client.patch(f"/api/hosted-zones/{zone_id}/records/{ns_rec['id']}", json={"ttl": 600})
        assert r.status_code == 403
        print(f"Status: {r.status_code}, Error: {r.json()['error']}")

        print("\n=== 6. ATTEMPT DELETE ON SYSTEM NS RECORD (EXPECT 403) ===")
        r = client.delete(f"/api/hosted-zones/{zone_id}/records/{ns_rec['id']}")
        assert r.status_code == 403
        print(f"Status: {r.status_code}, Error: {r.json()['error']}")

        print("\n=== 7. DELETE ZONE (CASCADE DELETE) ===")
        r = client.delete(f"/api/hosted-zones/{zone_id}")
        assert r.status_code == 204
        print(f"Status: {r.status_code} (204 No Content)")

        print("\n=== 8. VERIFY ZONE GONE (EXPECT 404) ===")
        r = client.get(f"/api/hosted-zones/{zone_id}")
        assert r.status_code == 404
        print(f"Status: {r.status_code}, Error: {r.json()['error']}")

    print("\n==================================================")
    print("  ALL 8 E2E LIVE API STEPS VERIFIED WITH ZERO ERRORS!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e()
