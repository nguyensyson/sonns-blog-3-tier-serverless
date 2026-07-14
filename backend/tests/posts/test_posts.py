BLOG_PAYLOAD = {
    "title": "Bài viết test",
    "tag": "AWS",
    "excerpt": "Mô tả ngắn",
    "content": "<p>nội dung</p>",
    "images": {},
    "coverIndex": 0,
    "status": "published",
}

DIARY_PAYLOAD = {
    "title": "Nhật ký riêng tư",
    "tag": "",
    "excerpt": "nội dung nhật ký",
    "content": "",
    "images": {},
    "coverIndex": 0,
    "date": "07/2026",
}


def test_create_and_list_public_blog(client, auth_header):
    create = client.post("/posts/blog", json=BLOG_PAYLOAD, headers=auth_header("author-1"))
    assert create.status_code == 200
    assert create.json()["data"]["category"] == "blog"

    listing = client.get("/posts/blog")
    assert listing.status_code == 200
    items = listing.json()["data"]["items"]
    assert any(p["title"] == "Bài viết test" for p in items)


def test_public_blog_list_hides_draft_posts(client, auth_header):
    draft = {**BLOG_PAYLOAD, "title": "Bài nháp", "status": "draft"}
    client.post("/posts/blog", json=draft, headers=auth_header("author-2"))

    listing = client.get("/posts/blog")
    titles = [p["title"] for p in listing.json()["data"]["items"]]
    assert "Bài nháp" not in titles


def test_create_blog_without_token_returns_401(client):
    resp = client.post("/posts/blog", json=BLOG_PAYLOAD)
    assert resp.status_code == 401


def test_optional_auth_marks_owner_on_detail(client, auth_header):
    owner_headers = auth_header("owner-1")
    create = client.post("/posts/blog", json=BLOG_PAYLOAD, headers=owner_headers)
    post_id = create.json()["data"]["postId"]

    as_owner = client.get(f"/posts/blog/{post_id}", headers=owner_headers)
    assert as_owner.json()["data"]["isOwner"] is True

    anonymous = client.get(f"/posts/blog/{post_id}")
    assert anonymous.json()["data"].get("isOwner") is None


def test_update_blog_by_non_owner_returns_403(client, auth_header):
    create = client.post("/posts/blog", json=BLOG_PAYLOAD, headers=auth_header("owner-2"))
    post_id = create.json()["data"]["postId"]

    resp = client.put(f"/posts/blog/{post_id}", json=BLOG_PAYLOAD, headers=auth_header("intruder"))
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


def test_diary_list_requires_auth(client):
    resp = client.get("/posts/diary")
    assert resp.status_code == 401
    assert resp.json()["success"] is False


def test_diary_entry_visible_only_to_owner(client, auth_header):
    owner_headers = auth_header("diary-owner")
    create = client.post("/posts/diary", json=DIARY_PAYLOAD, headers=owner_headers)
    assert create.status_code == 200
    post_id = create.json()["data"]["postId"]

    own_view = client.get(f"/posts/diary/{post_id}", headers=owner_headers)
    assert own_view.status_code == 200

    other_headers = auth_header("someone-else")
    other_view = client.get(f"/posts/diary/{post_id}", headers=other_headers)
    assert other_view.status_code == 403
    assert other_view.json()["error"]["code"] == "FORBIDDEN"


def test_diary_list_never_returns_another_users_entries(client, auth_header):
    client.post("/posts/diary", json=DIARY_PAYLOAD, headers=auth_header("user-a"))
    listing = client.get("/posts/diary", headers=auth_header("user-b"))
    assert listing.json()["data"]["items"] == []


def test_my_blog_list_includes_drafts_but_only_own_posts(client, auth_header):
    owner_headers = auth_header("mine-owner")
    client.post("/posts/blog", json=BLOG_PAYLOAD, headers=owner_headers)
    draft = {**BLOG_PAYLOAD, "title": "Bài nháp riêng tư", "status": "draft"}
    client.post("/posts/blog", json=draft, headers=owner_headers)
    client.post("/posts/blog", json=BLOG_PAYLOAD, headers=auth_header("mine-other"))

    listing = client.get("/posts/blog/mine", headers=owner_headers)
    assert listing.status_code == 200
    titles = [p["title"] for p in listing.json()["data"]["items"]]
    assert titles.count("Bài viết test") == 1
    assert "Bài nháp riêng tư" in titles


def test_my_blog_list_requires_auth(client):
    resp = client.get("/posts/blog/mine")
    assert resp.status_code == 401


def test_draft_blog_detail_visible_only_to_owner(client, auth_header):
    owner_headers = auth_header("draft-owner")
    draft = {**BLOG_PAYLOAD, "title": "Bài nháp riêng tư", "status": "draft"}
    create = client.post("/posts/blog", json=draft, headers=owner_headers)
    post_id = create.json()["data"]["postId"]

    as_owner = client.get(f"/posts/blog/{post_id}", headers=owner_headers)
    assert as_owner.status_code == 200
    assert as_owner.json()["data"]["isOwner"] is True

    anonymous = client.get(f"/posts/blog/{post_id}")
    assert anonymous.status_code == 404

    other_headers = auth_header("draft-intruder")
    as_other = client.get(f"/posts/blog/{post_id}", headers=other_headers)
    assert as_other.status_code == 404


def test_my_blog_list_status_filter(client, auth_header):
    owner_headers = auth_header("mine-filter")
    client.post("/posts/blog", json=BLOG_PAYLOAD, headers=owner_headers)
    draft = {**BLOG_PAYLOAD, "title": "Bài nháp riêng tư", "status": "draft"}
    client.post("/posts/blog", json=draft, headers=owner_headers)

    listing = client.get("/posts/blog/mine?status=draft", headers=owner_headers)
    titles = [p["title"] for p in listing.json()["data"]["items"]]
    assert titles == ["Bài nháp riêng tư"]
