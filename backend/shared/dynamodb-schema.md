# DynamoDB schema (source of truth for both the app code and Terraform)

Table/GSI names below must match `backend/layers/common/config.py`
(`USERS_TABLE_NAME`, `POSTS_TABLE_NAME`, `GROUPS_TABLE_NAME`,
`TASKS_TABLE_NAME` env vars) and the index names each `modules/*/repository.py`
queries by. See `backend/README.md` → "Current Terraform infrastructure does
not yet match this architecture" for what's missing on the infra side.

## Users

| Field | Type | Notes |
|---|---|---|
| userId (PK) | S | UUID |
| email | S | unique; indexed for login lookup |
| passwordHash | S | bcrypt |
| displayName | S | |
| avatarUrl | S | optional |
| createdAt / updatedAt | S | ISO timestamp |

- GSI `email-index`: PK `email`

## Posts

Shared table for both public blog posts (`category="blog"`) and private
diary/journal entries (`category="journal"` — the spec calls this "diary";
the existing frontend code already uses the string `"journal"`, so the
stored value follows the frontend, not the spec wording).

| Field | Type | Notes |
|---|---|---|
| postId (PK) | S | UUID |
| authorId | S | indexed for "my posts" queries |
| category | S | `"blog"` \| `"journal"`; indexed for public blog listing |
| title | S | |
| tag | S | single free-text tag (matches frontend `tag` field, not a multi-tag list) |
| excerpt | S | short description (frontend field name is `excerpt`, not `description`) |
| content | S | HTML with `{{imageN.ext}}` placeholders |
| images | M | placeholder → real S3 URL |
| coverIndex | N | 0 or 1 (frontend's 2-color cover accent, not a real image) |
| resourceUrl | S | optional; S3 URL of an attached downloadable resource file (CSV/XLSX/PDF/ZIP/DOC/DOCX/TXT/JSON) |
| resourceName | S | optional; original filename of `resourceUrl`, shown as the download label |
| status | S | `"draft"` \| `"published"`; blog-only, null for journal entries |
| date | S | free-text display date; journal-only, null for blog posts |
| createdAt / updatedAt | S | ISO timestamp |

- GSI `authorId-createdAt-index`: PK `authorId`, SK `createdAt`
- GSI `category-createdAt-index`: PK `category`, SK `createdAt`

## Groups

| Field | Type | Notes |
|---|---|---|
| groupId (PK) | S | UUID |
| userId | S | owner |
| name | S | |
| order | N | display order |
| createdAt / updatedAt | S | ISO timestamp |

- GSI `userId-order-index`: PK `userId`, SK `order`

## Tasks

| Field | Type | Notes |
|---|---|---|
| taskId (PK) | S | UUID |
| groupId | S | current group |
| userId | S | owner (double-checked independently of groupId) |
| title | S | |
| description | S | optional |
| dueDate | S | optional ISO date |
| isDone | **N** (0/1) | **not** a native Boolean — see note below |
| completedAt | S | ISO timestamp, null if not done |
| order | N | position within group |
| createdAt / updatedAt | S | ISO timestamp |

- GSI `groupId-order-index`: PK `groupId`, SK `order`
- GSI `userId-isDone-index`: PK `userId`, SK `isDone`

> **Deviation from the original spec:** the spec lists `isDone` as a Boolean
> and also as the sort key of `userId-isDone-index`. DynamoDB key attributes
> (table keys *and* GSI keys) only support `S`/`N`/`B` types — a native
> Boolean cannot be a GSI sort key. `isDone` is therefore stored as a Number
> (`0`/`1`) at the DynamoDB layer; `modules/tasks/service.py` converts it
> to/from a Python `bool` at the API boundary, so every request/response JSON
> still uses real `true`/`false`.
