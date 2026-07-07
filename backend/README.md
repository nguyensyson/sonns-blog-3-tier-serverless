# Backend — FastAPI on AWS Lambda (Python), per-module functions + shared Layer

Three independently-deployable Lambda functions (`user`, `posts`, `tasks`),
each a FastAPI app wrapped by [Mangum](https://github.com/jordaneremieff/mangum).
Code shared across modules (DynamoDB access, JWT auth, response/error format,
logging, S3 helper) lives in a single Lambda Layer so it is written once and
never copy-pasted.

```
backend/
├── layers/common/
│   ├── python/            # becomes /opt/python/... at runtime
│   │   ├── config.py       # env var settings
│   │   ├── db/              # boto3 DynamoDB resource + per-table getters
│   │   ├── auth/            # JWT create/decode, required/optional/ownership deps
│   │   ├── schemas/         # shared Pydantic models (CurrentUser, response envelopes)
│   │   └── utils/           # response formatter, exceptions, logger, S3 helper
│   └── requirements.txt
├── modules/
│   ├── user/    (main.py, models.py, service.py, repository.py, routers/)
│   ├── posts/   (same shape — blog + diary/journal + image upload)
│   └── tasks/   (same shape — groups + tasks)
├── requirements-dev.txt   # local/test-only deps (uvicorn, pytest, moto, httpx)
└── tests/
    ├── conftest.py         # shared env vars + puts the common layer on sys.path
    ├── user/, posts/, tasks/  # one conftest.py per module (see "Running tests")
```

Each module only imports from the shared layer and from its own files —
never from another module's files. Anything two modules would otherwise need
to share (e.g. `CurrentUser`, the ownership check) lives in the layer instead.

## Why imports look "flat"

Inside a module (e.g. `modules/posts/routers/blog.py`) you'll see
`import service` or `from models import PostResponse` rather than relative
imports. This matches how Lambda actually loads the code: each module's zip
is extracted so `main.py`, `models.py`, `service.py`, `repository.py` sit at
the *root* of `/var/task`, with the layer's `python/` directory mounted at
`/opt/python` and added to `sys.path` automatically. Running `uvicorn
main:app` from inside a module directory reproduces the same layout locally
(current directory + `PYTHONPATH` pointing at the layer).

## Prerequisites

- Python 3.12 (matches the Lambda runtime used in the deploy steps below)
- An AWS account for anything beyond local testing (DynamoDB Local/moto covers tests)

## Install dependencies (local dev)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
```

`requirements-dev.txt` pulls in `layers/common/requirements.txt` plus
`uvicorn`, `pytest`, `httpx`, and `moto` (for mocking DynamoDB/S3 in tests).

## Running a module locally with uvicorn

Every module needs the common layer's `python/` directory on `PYTHONPATH` in
addition to its own directory. From the `backend/` folder:

```bash
# User service on :8001
PYTHONPATH=layers/common/python AWS_REGION=ap-southeast-1 JWT_SECRET=dev-secret \
  USERS_TABLE_NAME=Users \
  (cd modules/user && PYTHONPATH=../../layers/common/python:. uvicorn main:app --reload --port 8001)

# Posts service on :8002
(cd modules/posts && PYTHONPATH=../../layers/common/python:. \
  POSTS_TABLE_NAME=Posts IMAGES_BUCKET_NAME=my-dev-bucket JWT_SECRET=dev-secret \
  uvicorn main:app --reload --port 8002)

# Tasks service on :8003
(cd modules/tasks && PYTHONPATH=../../layers/common/python:. \
  GROUPS_TABLE_NAME=Groups TASKS_TABLE_NAME=Tasks JWT_SECRET=dev-secret \
  uvicorn main:app --reload --port 8003)
```

On Windows PowerShell, set `$env:PYTHONPATH` and the other `$env:VAR`s before
`uvicorn main:app --reload` instead of the inline `VAR=value` syntax.

Without real AWS credentials, DynamoDB/S3 calls will fail at request time —
either point `AWS_ENDPOINT_URL`-style local overrides at
[DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html),
or just exercise `/health` and the Pydantic validation paths, and rely on the
`tests/` suite (which mocks AWS entirely via `moto`) for the data-access paths.

## Running tests

Each module's tests must run as a **separate pytest invocation**, one per
module directory — not all together in a single `pytest tests/` run. This is
intentional, not an oversight: `modules/user/main.py`, `modules/posts/main.py`
and `modules/tasks/main.py` are all imported under the plain name `main`
(matching how Lambda loads them), so importing more than one module's `main`
in the same Python process makes the second import shadow the first via
`sys.modules` caching.

```bash
pytest tests/user
pytest tests/posts
pytest tests/tasks
```

Each of those three directories has its own `conftest.py` that adds only its
matching `modules/<name>` directory to `sys.path` and spins up mocked
DynamoDB tables (via `moto`) with the same key schema and GSIs as the real
tables.

## Packaging the Lambda Layer

```bash
cd backend/layers/common
pip install -r requirements.txt -t python/
zip -r ../../common-layer.zip python
# aws lambda publish-layer-version --layer-name blog-common --zip-file fileb://common-layer.zip --compatible-runtimes python3.12
```

`boto3`/`botocore` are already present in the AWS-managed Python runtime and
can be excluded from the zip to shrink it; they're listed in
`requirements.txt` mainly so local dev/test has them without a second install
step.

## Packaging and deploying each Lambda function

Repeat per module (`user`, `posts`, `tasks`):

```bash
cd backend/modules/user
zip -r ../../user-function.zip main.py models.py service.py repository.py routers
# aws lambda update-function-code --function-name <env>-user --zip-file fileb://user-function.zip
```

Function configuration (handled automatically by Terraform — see below —
listed here for manual/CLI deploys):

- Runtime: `python3.12`
- Handler: `main.handler`
- Layers: the common layer's ARN published above
- Environment variables: `USERS_TABLE_NAME` / `POSTS_TABLE_NAME` /
  `GROUPS_TABLE_NAME` + `TASKS_TABLE_NAME` (only the ones the module needs),
  `IMAGES_BUCKET_NAME` (posts only), `SECRET_NAME` + `SECRET_ARN` (JWT
  signing secret — same secret can be shared by all three functions),
  `CORS_ALLOW_ORIGINS`.

## Terraform

`terraform/environments/dev|prod` now provisions this exact architecture: 4
DynamoDB tables, 1 shared Lambda Layer, 3 Python 3.12 Lambda functions
(`main.handler`), and one API Gateway REST API that path-routes `/auth/*` +
`/users/*` → the user function, `/posts/*` → the posts function, and
`/groups/*` + `/tasks/*` → the tasks function. See `terraform/README.md` →
"Backend Lambda architecture" for how the modules wire together, and
`terraform/environments/*/terraform.tfvars.example` for the variables to set
(in particular `lambda_user_source_dir` / `lambda_posts_source_dir` /
`lambda_tasks_source_dir` / `lambda_layer_source_dir`, pointed at this
`backend/` tree).

One simplification worth knowing about: all 3 functions share a single IAM
execution role (scoped to the 4 tables + their GSIs, the images bucket, and
the JWT secret — no wildcards), rather than 3 least-privilege roles. The
`user` function, for instance, never touches S3 but can technically assume
the same role that can. Splitting into 3 roles is a reasonable hardening
follow-up (see the comment above `module.iam` in `environments/*/main.tf`)
but wasn't required to make the backend functionally deployable.

## Known scope limitations (acceptable for this project's size, called out for honesty)

- **Blog title/excerpt search** (`GET /posts/blog?search=`) is done in Python
  after a DynamoDB `Query` on the `category-createdAt-index`, not a real
  full-text search — fine at demo scale, would need OpenSearch/Elasticsearch
  or DynamoDB + a search index for production-scale blogs.
- **Refresh tokens are stateless JWTs**, not stored server-side, so there is
  no way to revoke a single refresh token before it expires (e.g. on
  logout-everywhere or password change). A `RefreshTokens` table with a TTL
  attribute would be the next step if that's needed.
- **Pagination + `FilterExpression`**: `only_published`/`category` filters on
  `list_by_category` / `list_by_author` are applied *after* DynamoDB's
  `Limit`, a standard DynamoDB caveat — a page can come back with fewer items
  than `limit` even when more matching items exist further in the index.
