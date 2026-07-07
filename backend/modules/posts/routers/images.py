from fastapi import APIRouter, Depends, File, UploadFile

from auth.dependencies import get_current_user_required
from models import UploadImageResponse
from schemas.base import SuccessResponse
from schemas.user import CurrentUser
from utils.exceptions import ValidationAppError
from utils.response import success_response
from utils.s3 import upload_bytes

router = APIRouter(prefix="/posts", tags=["images"])

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


@router.post("/upload-image", response_model=SuccessResponse[UploadImageResponse])
async def upload_image(file: UploadFile = File(...), current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH - shared by both blog and diary editors. Requiring
    login here (rather than leaving it public) is what keeps the S3 bucket
    from being used as an open upload target for spam."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationAppError(
            "Định dạng ảnh không được hỗ trợ.",
            details=[{"field": "file", "message": "Chỉ chấp nhận PNG/JPEG/GIF/WEBP."}],
        )
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValidationAppError(
            "Ảnh vượt quá dung lượng cho phép (5MB).",
            details=[{"field": "file", "message": "Kích thước tối đa 5MB."}],
        )
    url = upload_bytes(content, file.content_type, key_prefix=f"posts/{current_user.userId}")
    return success_response({"url": url}, "Tải ảnh lên thành công.")
