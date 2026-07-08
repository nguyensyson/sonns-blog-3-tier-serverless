# Functions

The 3 Lambda functions already live under [`../../backend/modules/`](../../backend/modules/),
grouped by domain exactly as `template.yaml` expects:

| Domain | Code | SAM logical ID | Route prefixes |
|---|---|---|---|
| Auth / users | `backend/modules/user` | `UserFunction` | `/auth/*`, `/users/*` |
| Blog / diary / images | `backend/modules/posts` | `PostsFunction` | `/posts/*` |
| Task groups / tasks | `backend/modules/tasks` | `TasksFunction` | `/groups/*`, `/tasks/*` |

`template.yaml` points each function's `CodeUri` straight at its
`backend/modules/<name>` directory instead of duplicating the code under
`sam/functions/<name>/src/` - the app code already lives in one place and
this keeps it that way. This folder exists only as a pointer so the mono-repo
layout matches other SAM projects at a glance; there is nothing to build
here.

The shared Lambda Layer (FastAPI/DynamoDB/JWT/S3 helpers used by all 3
functions) lives at [`../../backend/layers/common`](../../backend/layers/common)
and is wired up as `CommonLayer` in `template.yaml`.
