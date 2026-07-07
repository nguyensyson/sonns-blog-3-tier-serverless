import pathlib
import sys

import boto3
import pytest
from moto import mock_aws

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[2]
MODULE_DIR = BACKEND_DIR / "modules" / "posts"

if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))


@pytest.fixture
def posts_table():
    with mock_aws():
        import db as db_module

        db_module._resource = None
        client = boto3.client("dynamodb", region_name="ap-southeast-1")
        client.create_table(
            TableName="Posts",
            KeySchema=[{"AttributeName": "postId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "postId", "AttributeType": "S"},
                {"AttributeName": "authorId", "AttributeType": "S"},
                {"AttributeName": "category", "AttributeType": "S"},
                {"AttributeName": "createdAt", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "authorId-createdAt-index",
                    "KeySchema": [
                        {"AttributeName": "authorId", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "category-createdAt-index",
                    "KeySchema": [
                        {"AttributeName": "category", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield
        db_module._resource = None


@pytest.fixture
def client(posts_table):
    from fastapi.testclient import TestClient

    import main

    return TestClient(main.app)


@pytest.fixture
def auth_header():
    from auth.jwt_handler import create_access_token

    def _make(user_id: str, email: str = "user@test.com") -> dict:
        token = create_access_token(user_id, email)
        return {"Authorization": f"Bearer {token}"}

    return _make
