import os

from fastapi import APIRouter, Depends, File, UploadFile

from auth.dependencies import get_current_user_required
from models import UploadResourceResponse
from schemas.base import SuccessResponse
from schemas.user import CurrentUser
from utils.exceptions import ValidationAppError
from utils.response import success_response
from utils.s3 import upload_bytes

router = APIRouter(prefix="/posts", tags=["resources"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".pdf", ".zip", ".doc", ".docx", ".txt", ".json"}
# API Gateway REST APIs hard-cap request payloads at 10MB, so this must stay
# comfortably under that (accounting for multipart/base64 overhead).
MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024


@router.post("/upload-resource", response_model=SuccessResponse[UploadResourceResponse])
async def upload_resource(file: UploadFile = File(...), current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH - same rationale as upload-image: keeps the S3 bucket
    from being an open upload target for spam."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationAppError(
            "Định dạng tệp không được hỗ trợ.",
            details=[{"field": "file", "message": "Chỉ chấp nhận CSV/XLSX/XLS/PDF/ZIP/DOC/DOCX/TXT/JSON."}],
        )
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValidationAppError(
            "Tệp vượt quá dung lượng cho phép (8MB).",
            details=[{"field": "file", "message": "Kích thước tối đa 8MB."}],
        )
    url = upload_bytes(
        content,
        file.content_type or "application/octet-stream",
        key_prefix=f"resources/{current_user.userId}",
        ext=ext,
    )
    return success_response({"url": url, "name": file.filename}, "Tải tệp tài nguyên lên thành công.")
