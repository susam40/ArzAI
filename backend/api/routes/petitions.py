from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.schemas import PetitionsListResponse, SmartQuestionsRequest, SmartQuestionsResponse
from backend.services.petition_service import PetitionService

router = APIRouter(prefix="/petitions", tags=["petitions"])


def get_petition_service() -> PetitionService:
    return PetitionService()


@router.get("", response_model=PetitionsListResponse)
async def list_petitions(
    db: AsyncSession = Depends(get_db),
    service: PetitionService = Depends(get_petition_service),
) -> PetitionsListResponse:
    petitions = await service.list_petitions(db)
    return PetitionsListResponse(petitions=petitions)


@router.post("/smart-questions", response_model=SmartQuestionsResponse)
async def smart_questions(
    request: SmartQuestionsRequest,
    service: PetitionService = Depends(get_petition_service),
) -> SmartQuestionsResponse:
    try:
        service._prompt_builder.get_config(request.institution, request.petition_type)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return service.smart_questions(
        request.institution,
        request.petition_type,
        request.metadata,
        request.user_input,
    )
