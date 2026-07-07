import pathlib
import sys

import boto3
import pytest
from moto import mock_aws

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[2]
MODULE_DIR = BACKEND_DIR / "modules" / "user"

if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))


@pytest.fixture
def users_table():
    with mock_aws():
        import db as db_module

        db_module._resource = None
        client = boto3.client("dynamodb", region_name="ap-southeast-1")
        client.create_table(
            TableName="Users",
            KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "email", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "email-index",
                    "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield
        db_module._resource = None


@pytest.fixture
def client(users_table):
    from fastapi.testclient import TestClient

    import main

    return TestClient(main.app)
