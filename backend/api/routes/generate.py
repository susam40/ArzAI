import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.schemas import GenerateRequest, GenerateResponse
from backend.services.petition_service import PetitionService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["generate"])


def get_petition_service() -> PetitionService:
    return PetitionService()


@router.post("", response_model=GenerateResponse)
async def generate_petition(
    request: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    service: PetitionService = Depends(get_petition_service),
) -> GenerateResponse:
    try:
        return await service.generate(db, request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        logger.warning("generate_validation_error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
