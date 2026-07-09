from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from config import settings
from routers.blog import router as blog_router
from routers.diary import router as diary_router
from routers.images import router as images_router
from routers.resources import router as resources_router
from utils.exceptions import register_exception_handlers
from utils.response import success_response

app = FastAPI(title="Posts Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(blog_router)
app.include_router(diary_router)
app.include_router(images_router)
app.include_router(resources_router)


@app.get("/health")
def health():
    return success_response({"status": "ok", "service": "posts"})


handler = Mangum(app)
