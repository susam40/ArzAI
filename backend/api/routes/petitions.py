from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.schemas import (
    PetitionDetail,
    PetitionUpdateRequest,
    PetitionsListResponse,
    SmartQuestionsRequest,
    SmartQuestionsResponse,
)
from backend.services.petition_service import PetitionNotFoundError, PetitionService

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


@router.get("/{petition_id}", response_model=PetitionDetail)
async def get_petition(
    petition_id: str,
    db: AsyncSession = Depends(get_db),
    service: PetitionService = Depends(get_petition_service),
) -> PetitionDetail:
    try:
        return await service.get_petition_detail(db, petition_id)
    except PetitionNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Dilekçe bulunamadı") from exc


@router.put("/{petition_id}", response_model=PetitionDetail)
async def update_petition(
    petition_id: str,
    request: PetitionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    service: PetitionService = Depends(get_petition_service),
) -> PetitionDetail:
    if request.subject is None and request.content is None:
        raise HTTPException(status_code=422, detail="Güncellenecek en az bir alan gerekli")
    try:
        return await service.update_petition(db, petition_id, request)
    except PetitionNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Dilekçe bulunamadı") from exc


@router.delete("/{petition_id}", status_code=204)
async def delete_petition(
    petition_id: str,
    db: AsyncSession = Depends(get_db),
    service: PetitionService = Depends(get_petition_service),
) -> Response:
    try:
        await service.delete_petition(db, petition_id)
    except PetitionNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Dilekçe bulunamadı") from exc
    return Response(status_code=204)


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
