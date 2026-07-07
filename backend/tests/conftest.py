import os
import pathlib
import sys

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
COMMON_LAYER_DIR = BACKEND_DIR / "layers" / "common" / "python"

# Must be set before any module under test imports `config` (Settings reads
# os.environ at import time).
os.environ.setdefault("AWS_REGION", "ap-southeast-1")
os.environ.setdefault("AWS_DEFAULT_REGION", "ap-southeast-1")
os.environ.setdefault("USERS_TABLE_NAME", "Users")
os.environ.setdefault("POSTS_TABLE_NAME", "Posts")
os.environ.setdefault("GROUPS_TABLE_NAME", "Groups")
os.environ.setdefault("TASKS_TABLE_NAME", "Tasks")
os.environ.setdefault("IMAGES_BUCKET_NAME", "test-images-bucket")
os.environ.setdefault("JWT_SECRET", "test-only-secret")
os.environ.setdefault("SECRET_NAME", "")
os.environ.setdefault("SECRET_ARN", "")

if str(COMMON_LAYER_DIR) not in sys.path:
    sys.path.insert(0, str(COMMON_LAYER_DIR))
