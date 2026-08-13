"""Tests for hosted-zone CRUD endpoints."""


class TestCreateZone:
    def test_success(self, auth_client):
        resp = auth_client.post("/api/hosted-zones", json={
            "name": "test.com",
            "description": "Test zone",
            "zone_type": "PUBLIC",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "test.com"
        assert data["zone_type"] == "PUBLIC"
        assert data["record_count"] == 1  # auto-generated system NS record
        assert "id" in data

    def test_private_zone(self, auth_client):
        resp = auth_client.post("/api/hosted-zones", json={
            "name": "internal.local",
            "zone_type": "PRIVATE",
        })
        assert resp.status_code == 201
        assert resp.json()["zone_type"] == "PRIVATE"

    def test_duplicate_names_allowed(self, auth_client):
        """hosted_zones.name is NOT unique — duplicate names allowed."""
        r1 = auth_client.post("/api/hosted-zones", json={"name": "dup.com"})
        r2 = auth_client.post("/api/hosted-zones", json={"name": "dup.com"})
        assert r1.status_code == 201
        assert r2.status_code == 201
        assert r1.json()["id"] != r2.json()["id"]

    def test_unauthenticated(self, client):
        resp = client.post("/api/hosted-zones", json={"name": "t.com"})
        assert resp.status_code == 401


class TestListZones:
    def test_empty(self, auth_client):
        resp = auth_client.get("/api/hosted-zones")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_pagination_shape(self, auth_client):
        for i in range(3):
            auth_client.post("/api/hosted-zones", json={"name": f"z{i}.com"})

        resp = auth_client.get("/api/hosted-zones?page=1&page_size=2")
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["total"] == 3
        assert data["total_pages"] == 2

    def test_search(self, auth_client):
        auth_client.post("/api/hosted-zones", json={"name": "foo.com"})
        auth_client.post("/api/hosted-zones", json={"name": "bar.com"})

        resp = auth_client.get("/api/hosted-zones?search=foo")
        assert resp.json()["total"] == 1
        assert resp.json()["items"][0]["name"] == "foo.com"


class TestGetZone:
    def test_found(self, auth_client):
        create = auth_client.post("/api/hosted-zones", json={"name": "t.com"})
        zone_id = create.json()["id"]

        resp = auth_client.get(f"/api/hosted-zones/{zone_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "t.com"

    def test_not_found(self, auth_client):
        resp = auth_client.get("/api/hosted-zones/999")
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "HOSTED_ZONE_NOT_FOUND"


class TestUpdateZone:
    def test_partial_update(self, auth_client):
        create = auth_client.post("/api/hosted-zones", json={"name": "t.com"})
        zone_id = create.json()["id"]

        resp = auth_client.patch(f"/api/hosted-zones/{zone_id}", json={
            "description": "Updated",
        })
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated"
        assert resp.json()["name"] == "t.com"  # unchanged

    def test_not_found(self, auth_client):
        resp = auth_client.patch("/api/hosted-zones/999", json={"name": "x.com"})
        assert resp.status_code == 404


class TestDeleteZone:
    def test_success(self, auth_client):
        create = auth_client.post("/api/hosted-zones", json={"name": "t.com"})
        zone_id = create.json()["id"]

        resp = auth_client.delete(f"/api/hosted-zones/{zone_id}")
        assert resp.status_code == 204

        resp = auth_client.get(f"/api/hosted-zones/{zone_id}")
        assert resp.status_code == 404

    def test_cascade_deletes_records(self, auth_client):
        create = auth_client.post("/api/hosted-zones", json={"name": "t.com"})
        zone_id = create.json()["id"]

        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "t.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })

        auth_client.delete(f"/api/hosted-zones/{zone_id}")

        # Records should be gone too
        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records")
        assert resp.status_code == 404  # zone not found

    def test_not_found(self, auth_client):
        resp = auth_client.delete("/api/hosted-zones/999")
        assert resp.status_code == 404
