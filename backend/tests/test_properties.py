def test_create_property_success(client, test_data, apex_auth_headers):
    payload = {
        "title": "10 Marla Corner Villa",
        "type": "House / Villa",
        "city": "Islamabad",
        "location": "Sector C",
        "society": "DHA Phase 2",
        "price_pkr": 55000000.0,
        "area_size": "10 Marla",
        "bedrooms": 4,
        "bathrooms": 5,
        "image_url": "https://example.com/prop.jpg",
        "description": "Luxurious corner villa",
    }
    res = client.post("/api/v1/properties", json=payload, headers=apex_auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "10 Marla Corner Villa"
    assert data["price_pkr"] == "55000000.00"
    assert data["society"] == "DHA Phase 2"


def test_list_and_filter_properties(client, test_data, apex_auth_headers):
    res = client.get("/api/v1/properties?society=DHA Phase 2", headers=apex_auth_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 1
    assert all("DHA Phase 2" in p["society"] for p in items)


def test_update_property_status(client, test_data, apex_auth_headers):
    prop_id = test_data["prop_apex"].id
    res = client.patch(
        f"/api/v1/properties/{prop_id}",
        json={"status": "under_negotiation"},
        headers=apex_auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "under_negotiation"
