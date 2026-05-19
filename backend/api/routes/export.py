from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.schemas import ExportDocxRequest, ExportPdfRequest
from backend.services.docx.generator import DocxGenerator
from backend.services.pdf.generator import PDFGenerator
from backend.services.petition_service import PetitionService

router = APIRouter(prefix="/export", tags=["export"])


def _attachment_disposition(filename: str) -> str:
    ascii_fallback = "".join(c if ord(c) < 128 else "_" for c in filename) or "download"
    return f'attachment; filename="{ascii_fallback}"; filename*=UTF-8\'\'{quote(filename)}'


def get_petition_service() -> PetitionService:
    return PetitionService()


def get_pdf_generator() -> PDFGenerator:
    return PDFGenerator()


def get_docx_generator() -> DocxGenerator:
    return DocxGenerator()


async def _resolve_content(
    request: ExportPdfRequest | ExportDocxRequest,
    db: AsyncSession,
    service: PetitionService,
) -> str:
    if request.content:
        return request.content
    if not request.petition_id:
        raise HTTPException(status_code=422, detail="content veya petition_id gerekli")

    petition = await service.get_petition(db, request.petition_id)
    if petition is None:
        raise HTTPException(status_code=404, detail="Dilekçe bulunamadı")

    if petition.edited_content:
        return petition.edited_content
    return petition.full_text


@router.post("/pdf")
async def export_pdf(
    request: ExportPdfRequest,
    db: AsyncSession = Depends(get_db),
    service: PetitionService = Depends(get_petition_service),
    pdf_generator: PDFGenerator = Depends(get_pdf_generator),
) -> Response:
    content = await _resolve_content(request, db, service)
    if request.petition_id and request.content:
        await service.update_edited_content(db, request.petition_id, request.content)

    pdf_bytes = pdf_generator.generate(content, title=request.title)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": _attachment_disposition(f"{request.title}.pdf")},
    )


@router.post("/docx")
async def export_docx(
    request: ExportDocxRequest,
    db: AsyncSession = Depends(get_db),
    service: PetitionService = Depends(get_petition_service),
    docx_generator: DocxGenerator = Depends(get_docx_generator),
) -> Response:
    content = await _resolve_content(request, db, service)
    if request.petition_id and request.content:
        await service.update_edited_content(db, request.petition_id, request.content)

    docx_bytes = docx_generator.generate(content, title=request.title)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": _attachment_disposition(f"{request.title}.docx")},
    )
