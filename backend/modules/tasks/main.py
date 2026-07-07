from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from config import settings
from routers.groups import router as groups_router
from routers.tasks import router as tasks_router
from utils.exceptions import register_exception_handlers
from utils.response import success_response

app = FastAPI(title="Tasks Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(groups_router)
app.include_router(tasks_router)


@app.get("/health")
def health():
    return success_response({"status": "ok", "service": "tasks"})


handler = Mangum(app)
