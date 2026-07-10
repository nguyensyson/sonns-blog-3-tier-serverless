def test_list_groups_without_token_returns_401(client):
    resp = client.get("/groups")
    assert resp.status_code == 401
    assert resp.json()["success"] is False


def test_create_group_and_task_flow(client, auth_header):
    headers = auth_header("user-a")
    group = client.post("/groups", json={"name": "Công việc"}, headers=headers)
    assert group.status_code == 200
    group_id = group.json()["data"]["groupId"]

    task = client.post(
        f"/groups/{group_id}/tasks",
        json={"title": "Viết báo cáo", "description": "", "dueDate": None},
        headers=headers,
    )
    assert task.status_code == 200
    assert task.json()["data"]["isDone"] is False

    listing = client.get("/groups", headers=headers)
    groups = listing.json()["data"]
    assert groups[0]["tasks"][0]["title"] == "Viết báo cáo"


def test_user_cannot_update_another_users_task(client, auth_header):
    owner_headers = auth_header("owner")
    group = client.post("/groups", json={"name": "Cá nhân"}, headers=owner_headers)
    group_id = group.json()["data"]["groupId"]
    task = client.post(
        f"/groups/{group_id}/tasks",
        json={"title": "Việc riêng", "description": "", "dueDate": None},
        headers=owner_headers,
    )
    task_id = task.json()["data"]["taskId"]

    intruder_headers = auth_header("intruder")
    resp = client.put(
        f"/tasks/{task_id}",
        json={"title": "Bị sửa trộm", "description": "", "dueDate": None},
        headers=intruder_headers,
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


def test_user_cannot_delete_another_users_group(client, auth_header):
    owner_headers = auth_header("group-owner")
    group = client.post("/groups", json={"name": "Riêng tư"}, headers=owner_headers)
    group_id = group.json()["data"]["groupId"]

    intruder_headers = auth_header("group-intruder")
    resp = client.delete(f"/groups/{group_id}", headers=intruder_headers)
    assert resp.status_code == 403


def test_complete_and_reopen_task(client, auth_header):
    headers = auth_header("user-b")
    group = client.post("/groups", json={"name": "Test"}, headers=headers)
    group_id = group.json()["data"]["groupId"]
    task = client.post(
        f"/groups/{group_id}/tasks",
        json={"title": "Hoàn thành thử", "description": "", "dueDate": None},
        headers=headers,
    )
    task_id = task.json()["data"]["taskId"]

    completed = client.put(f"/tasks/{task_id}/complete", headers=headers)
    assert completed.json()["data"]["isDone"] is True
    assert completed.json()["data"]["completedAt"] is not None

    reopened = client.put(f"/tasks/{task_id}/reopen", headers=headers)
    assert reopened.json()["data"]["isDone"] is False
    assert reopened.json()["data"]["completedAt"] is None


def test_create_group_with_description_and_cover_image(client, auth_header):
    headers = auth_header("user-d")
    resp = client.post(
        "/groups",
        json={"name": "Marketing", "description": "Chiến dịch quý 3", "coverImageUrl": "https://images.example.com/cover.jpg"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["description"] == "Chiến dịch quý 3"
    assert data["coverImageUrl"] == "https://images.example.com/cover.jpg"


def test_create_group_without_description_and_cover_image_defaults_to_null(client, auth_header):
    headers = auth_header("user-e")
    resp = client.post("/groups", json={"name": "Cá nhân"}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["description"] is None
    assert data["coverImageUrl"] is None


def test_reorder_groups_endpoint_not_shadowed_by_group_id_route(client, auth_header):
    headers = auth_header("user-c")
    g1 = client.post("/groups", json={"name": "G1"}, headers=headers).json()["data"]["groupId"]
    g2 = client.post("/groups", json={"name": "G2"}, headers=headers).json()["data"]["groupId"]

    resp = client.put("/groups/reorder", json={"orderedGroupIds": [g2, g1]}, headers=headers)
    assert resp.status_code == 200
    ordered_names = [g["name"] for g in resp.json()["data"]]
    assert ordered_names == ["G2", "G1"]
