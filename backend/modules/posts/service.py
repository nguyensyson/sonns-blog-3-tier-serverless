import math
import re
from typing import Optional

import repository
from auth.ownership import assert_owner
from utils.exceptions import NotFoundError

_TAG_RE = re.compile(r"<[^>]*>")
_PLACEHOLDER_RE = re.compile(r"\{\{[^{}]+\}\}")


def _read_time(content: str) -> str:
    # Mirrors the frontend's countWords() in BlogContext.jsx so the server
    # and the (now-retired) client-side estimate agree.
    text = _PLACEHOLDER_RE.sub(" ", _TAG_RE.sub(" ", content or ""))
    words = len([w for w in text.split() if w])
    minutes = max(1, math.ceil(words / 200))
    return f"{minutes} phút đọc"


def _to_response(post: dict, current_user_id: Optional[str] = None) -> dict:
    result = {**post, "readTime": _read_time(post.get("content", ""))}
    if current_user_id is not None:
        result["isOwner"] = post["authorId"] == current_user_id
    return result


def _build_payload(body, category: str) -> dict:
    data = {
        "title": body.title,
        "tag": body.tag.strip() or "Khác",
        "excerpt": body.excerpt,
        "content": body.content,
        "images": body.images,
        "coverIndex": body.coverIndex,
        "coverImageUrl": body.coverImageUrl,
    }
    if category == "blog":
        data["status"] = body.status or "published"
        data["date"] = None
    else:
        data["status"] = None
        data["date"] = (body.date or "").strip() or None
    return data


def _get_owned(post_id: str, author_id: str, category: str) -> dict:
    post = repository.get_by_id(post_id)
    if not post or post["category"] != category:
        raise NotFoundError("Không tìm thấy bài viết.")
    assert_owner(post["authorId"], author_id, "Bạn không có quyền thao tác trên bài viết này.")
    return post


# --- Blog (category="blog", public) ---


def list_public_blog(limit: int, cursor: Optional[str], search: Optional[str]):
    items, next_cursor = repository.list_by_category("blog", limit, cursor, only_published=True)
    if search:
        needle = search.strip().lower()
        items = [
            p for p in items
            if needle in p["title"].lower() or needle in p.get("excerpt", "").lower()
        ]
    return [_to_response(p) for p in items], next_cursor


def get_public_blog(post_id: str, current_user_id: Optional[str]) -> dict:
    post = repository.get_by_id(post_id)
    if not post or post["category"] != "blog" or post.get("status") != "published":
        raise NotFoundError("Không tìm thấy bài viết.")
    return _to_response(post, current_user_id)


def create_blog(author_id: str, body) -> dict:
    post = repository.create(author_id, "blog", _build_payload(body, "blog"))
    return _to_response(post, author_id)


def update_blog(post_id: str, author_id: str, body) -> dict:
    _get_owned(post_id, author_id, "blog")
    updated = repository.update(post_id, _build_payload(body, "blog"))
    return _to_response(updated, author_id)


def delete_blog(post_id: str, author_id: str) -> None:
    _get_owned(post_id, author_id, "blog")
    repository.delete(post_id)


# --- Diary / journal (category="journal", private) ---


def list_my_journal(author_id: str, limit: int, cursor: Optional[str]):
    items, next_cursor = repository.list_by_author(author_id, limit, cursor, category="journal")
    return [_to_response(p, author_id) for p in items], next_cursor


def get_my_journal_entry(post_id: str, author_id: str) -> dict:
    return _to_response(_get_owned(post_id, author_id, "journal"), author_id)


def create_journal(author_id: str, body) -> dict:
    post = repository.create(author_id, "journal", _build_payload(body, "journal"))
    return _to_response(post, author_id)


def update_journal(post_id: str, author_id: str, body) -> dict:
    _get_owned(post_id, author_id, "journal")
    updated = repository.update(post_id, _build_payload(body, "journal"))
    return _to_response(updated, author_id)


def delete_journal(post_id: str, author_id: str) -> None:
    _get_owned(post_id, author_id, "journal")
    repository.delete(post_id)
