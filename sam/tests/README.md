# Tests

Unit tests for the 3 Lambda functions already exist at
[`../../backend/tests/`](../../backend/tests/) (`user/`, `posts/`, `tasks/`,
pytest + moto, run against each function's FastAPI app via `TestClient`) -
not duplicated here. Run them with:

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/user
pytest tests/posts
pytest tests/tasks
```

The CI pipeline (`.github/workflows/backend-deploy.yml`) runs these before
`sam build`/`sam deploy` - see `README.md` "CI/CD pipeline".

For end-to-end checks against the actual packaged Lambda + API Gateway
(rather than the FastAPI app directly), use `sam local` - see `../README.md`
"Local development".
