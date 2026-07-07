from db import get_dynamodb_resource
from config import settings


def users_table():
    return get_dynamodb_resource().Table(settings.users_table_name)


def posts_table():
    return get_dynamodb_resource().Table(settings.posts_table_name)


def groups_table():
    return get_dynamodb_resource().Table(settings.groups_table_name)


def tasks_table():
    return get_dynamodb_resource().Table(settings.tasks_table_name)
