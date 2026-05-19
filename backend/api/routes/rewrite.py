from fastapi import APIRouter, Depends, HTTPException

from backend.models.schemas import RewriteRequest, RewriteResponse
from backend.services.ai.rewrite import RewriteService

router = APIRouter(prefix="/rewrite", tags=["rewrite"])


def get_rewrite_service() -> RewriteService:
    return RewriteService()


@router.post("", response_model=RewriteResponse)
async def rewrite_text(
    request: RewriteRequest,
    service: RewriteService = Depends(get_rewrite_service),
) -> RewriteResponse:
    try:
        text = await service.rewrite(request.text, request.action)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return RewriteResponse(text=text)
