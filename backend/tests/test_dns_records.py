"""Tests for DNS-record CRUD endpoints."""

import pytest


@pytest.fixture()
def zone_id(auth_client):
    """Create a test zone and return its ID."""
    resp = auth_client.post("/api/hosted-zones", json={"name": "test.com"})
    return resp.json()["id"]


class TestCreateRecord:
    def test_a_record(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300,
            "values": ["192.168.1.1", "192.168.1.2"],
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["type"] == "A"
        assert data["values"] == ["192.168.1.1", "192.168.1.2"]
        assert data["hosted_zone_id"] == zone_id

    def test_aaaa_record(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "AAAA", "ttl": 300,
            "values": ["2001:db8::1"],
        })
        assert resp.status_code == 201

    def test_cname_record(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "www.test.com", "type": "CNAME", "ttl": 300,
            "values": ["test.com"],
        })
        assert resp.status_code == 201
        assert resp.json()["values"] == ["test.com"]

    def test_mx_record(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "MX", "ttl": 3600,
            "values": [{"priority": 10, "exchange": "mail.test.com"}],
        })
        assert resp.status_code == 201
        assert resp.json()["values"][0]["priority"] == 10

    def test_srv_record(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "_sip._tcp.test.com", "type": "SRV", "ttl": 300,
            "values": [{"priority": 10, "weight": 60, "port": 5060, "target": "sip.test.com"}],
        })
        assert resp.status_code == 201

    def test_caa_record(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "CAA", "ttl": 3600,
            "values": [{"flag": 0, "tag": "issue", "value": "letsencrypt.org"}],
        })
        assert resp.status_code == 201

    def test_invalid_ipv4(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300,
            "values": ["not-an-ip"],
        })
        assert resp.status_code == 422

    def test_cname_multi_value_rejected(self, auth_client, zone_id):
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "www.test.com", "type": "CNAME", "ttl": 300,
            "values": ["a.com", "b.com"],
        })
        assert resp.status_code == 422

    def test_duplicate_record_rejected(self, auth_client, zone_id):
        """UniqueConstraint(zone_id, name, type) prevents duplicates."""
        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        resp = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["5.6.7.8"],
        })
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "DUPLICATE_RECORD"

    def test_zone_not_found(self, auth_client):
        resp = auth_client.post("/api/hosted-zones/999/records", json={
            "name": "x.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        assert resp.status_code == 404


class TestListRecords:
    def test_default_ns_only(self, auth_client, zone_id):
        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records")
        assert resp.status_code == 200
        assert resp.json()["total"] == 1  # 1 auto-generated system NS record

    def test_with_records(self, auth_client, zone_id):
        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "AAAA", "ttl": 300, "values": ["2001:db8::1"],
        })

        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records")
        assert resp.json()["total"] == 3  # 1 system NS + 2 user records

    def test_filter_by_type(self, auth_client, zone_id):
        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "AAAA", "ttl": 300, "values": ["2001:db8::1"],
        })

        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records?type=A")
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["type"] == "A"

    def test_search_by_name(self, auth_client, zone_id):
        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "api.test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "www.test.com", "type": "A", "ttl": 300, "values": ["5.6.7.8"],
        })

        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records?search=api")
        assert resp.json()["total"] == 1


class TestGetRecord:
    def test_found(self, auth_client, zone_id):
        create = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        record_id = create.json()["id"]

        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records/{record_id}")
        assert resp.status_code == 200
        assert resp.json()["type"] == "A"

    def test_not_found(self, auth_client, zone_id):
        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records/999")
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "DNS_RECORD_NOT_FOUND"


class TestUpdateRecord:
    def test_update_ttl_only(self, auth_client, zone_id):
        create = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        record_id = create.json()["id"]

        resp = auth_client.patch(
            f"/api/hosted-zones/{zone_id}/records/{record_id}",
            json={"ttl": 600},
        )
        assert resp.status_code == 200
        assert resp.json()["ttl"] == 600
        assert resp.json()["values"] == ["1.2.3.4"]  # unchanged

    def test_update_values_only(self, auth_client, zone_id):
        create = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        record_id = create.json()["id"]

        resp = auth_client.patch(
            f"/api/hosted-zones/{zone_id}/records/{record_id}",
            json={"values": ["5.6.7.8", "9.10.11.12"]},
        )
        assert resp.status_code == 200
        assert resp.json()["values"] == ["5.6.7.8", "9.10.11.12"]

    def test_type_without_values_rejected(self, auth_client, zone_id):
        create = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        record_id = create.json()["id"]

        resp = auth_client.patch(
            f"/api/hosted-zones/{zone_id}/records/{record_id}",
            json={"type": "AAAA"},
        )
        assert resp.status_code == 400
        assert resp.json()["error"]["code"] == "INVALID_UPDATE"

    def test_type_with_values(self, auth_client, zone_id):
        create = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        record_id = create.json()["id"]

        resp = auth_client.patch(
            f"/api/hosted-zones/{zone_id}/records/{record_id}",
            json={"type": "AAAA", "values": ["2001:db8::1"]},
        )
        assert resp.status_code == 200
        assert resp.json()["type"] == "AAAA"
        assert resp.json()["values"] == ["2001:db8::1"]

    def test_not_found(self, auth_client, zone_id):
        resp = auth_client.patch(
            f"/api/hosted-zones/{zone_id}/records/999",
            json={"ttl": 600},
        )
        assert resp.status_code == 404


class TestDeleteRecord:
    def test_success(self, auth_client, zone_id):
        create = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "test.com", "type": "A", "ttl": 300, "values": ["1.2.3.4"],
        })
        record_id = create.json()["id"]

        resp = auth_client.delete(f"/api/hosted-zones/{zone_id}/records/{record_id}")
        assert resp.status_code == 204

        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records/{record_id}")
        assert resp.status_code == 404

    def test_not_found(self, auth_client, zone_id):
        resp = auth_client.delete(f"/api/hosted-zones/{zone_id}/records/999")
        assert resp.status_code == 404


class TestSystemRecords:
    def test_default_ns_created_on_zone_creation(self, auth_client, zone_id):
        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records")
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert len(items) == 1
        ns_rec = items[0]
        assert ns_rec["type"] == "NS"
        assert ns_rec["name"] == "test.com."
        assert ns_rec["ttl"] == 172800
        assert ns_rec["is_system"] is True
        assert len(ns_rec["values"]) == 4

    def test_patch_system_record_returns_403(self, auth_client, zone_id):
        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records")
        ns_id = resp.json()["items"][0]["id"]

        patch_resp = auth_client.patch(
            f"/api/hosted-zones/{zone_id}/records/{ns_id}",
            json={"ttl": 300},
        )
        assert patch_resp.status_code == 403
        assert patch_resp.json()["error"]["code"] == "SYSTEM_RECORD_PROTECTED"

    def test_delete_system_record_returns_403(self, auth_client, zone_id):
        resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records")
        ns_id = resp.json()["items"][0]["id"]

        del_resp = auth_client.delete(f"/api/hosted-zones/{zone_id}/records/{ns_id}")
        assert del_resp.status_code == 403
        assert del_resp.json()["error"]["code"] == "SYSTEM_RECORD_PROTECTED"

    def test_user_record_has_is_system_false(self, auth_client, zone_id):
        create = auth_client.post(f"/api/hosted-zones/{zone_id}/records", json={
            "name": "user.test.com", "type": "A", "ttl": 300, "values": ["1.1.1.1"],
        })
        assert create.status_code == 201
        data = create.json()
        assert data["is_system"] is False
