import pathlib
import sys

import boto3
import pytest
from moto import mock_aws

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[2]
MODULE_DIR = BACKEND_DIR / "modules" / "tasks"

if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))


@pytest.fixture
def tasks_tables():
    with mock_aws():
        import db as db_module

        db_module._resource = None
        client = boto3.client("dynamodb", region_name="ap-southeast-1")
        client.create_table(
            TableName="Groups",
            KeySchema=[{"AttributeName": "groupId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "groupId", "AttributeType": "S"},
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "order", "AttributeType": "N"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "userId-order-index",
                    "KeySchema": [
                        {"AttributeName": "userId", "KeyType": "HASH"},
                        {"AttributeName": "order", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        client.create_table(
            TableName="Tasks",
            KeySchema=[{"AttributeName": "taskId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "taskId", "AttributeType": "S"},
                {"AttributeName": "groupId", "AttributeType": "S"},
                {"AttributeName": "order", "AttributeType": "N"},
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "isDone", "AttributeType": "N"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "groupId-order-index",
                    "KeySchema": [
                        {"AttributeName": "groupId", "KeyType": "HASH"},
                        {"AttributeName": "order", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "userId-isDone-index",
                    "KeySchema": [
                        {"AttributeName": "userId", "KeyType": "HASH"},
                        {"AttributeName": "isDone", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield
        db_module._resource = None


@pytest.fixture
def client(tasks_tables):
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
