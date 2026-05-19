from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.schemas import PromptInfo, PromptUpdateRequest, PromptsListResponse
from backend.services.prompt_service import PromptNotFoundError, PromptService

router = APIRouter(prefix="/prompts", tags=["prompts"])


def get_prompt_service() -> PromptService:
    return PromptService()


@router.get("", response_model=PromptsListResponse)
async def list_prompts(
    db: AsyncSession = Depends(get_db),
    service: PromptService = Depends(get_prompt_service),
) -> PromptsListResponse:
    rows = await service.list_prompts(db)
    return PromptsListResponse(
        prompts=[
            PromptInfo(
                key=row.key,
                label=row.label,
                category=row.category,
                content=row.content,
                updated_at=row.updated_at,
            )
            for row in rows
        ]
    )


@router.get("/{key}", response_model=PromptInfo)
async def get_prompt(
    key: str,
    db: AsyncSession = Depends(get_db),
    service: PromptService = Depends(get_prompt_service),
) -> PromptInfo:
    try:
        row = await service.get_prompt(db, key)
    except PromptNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return PromptInfo(
        key=row.key,
        label=row.label,
        category=row.category,
        content=row.content,
        updated_at=row.updated_at,
    )


@router.put("/{key}", response_model=PromptInfo)
async def update_prompt(
    key: str,
    request: PromptUpdateRequest,
    db: AsyncSession = Depends(get_db),
    service: PromptService = Depends(get_prompt_service),
) -> PromptInfo:
    try:
        row = await service.update_prompt(db, key, request.content)
    except PromptNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return PromptInfo(
        key=row.key,
        label=row.label,
        category=row.category,
        content=row.content,
        updated_at=row.updated_at,
    )
