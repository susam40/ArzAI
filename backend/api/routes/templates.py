from fastapi import APIRouter

from backend.models.schemas import TemplatesResponse
from backend.services.template.registry import TemplateRegistry

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=TemplatesResponse)
async def list_templates() -> TemplatesResponse:
    registry = TemplateRegistry()
    return TemplatesResponse(templates=registry.list_templates())
