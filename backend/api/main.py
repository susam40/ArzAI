import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.middleware import RequestLoggingMiddleware
from backend.api.routes import export, generate, petitions, rewrite, templates
from backend.config import get_settings
from backend.database import init_db

settings = get_settings()
logging.basicConfig(level=settings.log_level)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="AI Dilekçe Asistanı",
    description="Template-driven resmi dilekçe üretim API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(generate.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(petitions.router, prefix="/api")
app.include_router(rewrite.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
