from fastapi import APIRouter, Depends, HTTPException

from backend.config import get_settings
from backend.models.schemas import LlmModelInfo, LlmModelsResponse
from backend.services.ai.llm_client import LLMError, NvidiaLLMClient

router = APIRouter(prefix="/models", tags=["models"])


def get_llm_client() -> NvidiaLLMClient:
    return NvidiaLLMClient()


@router.get("", response_model=LlmModelsResponse)
async def list_models(client: NvidiaLLMClient = Depends(get_llm_client)) -> LlmModelsResponse:
    settings = get_settings()
    try:
        model_ids = await client.list_models()
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return LlmModelsResponse(
        models=[LlmModelInfo(id=model_id) for model_id in model_ids],
        current_model=client.default_model,
        mock_mode=settings.llm_mock or not settings.nvidia_api_key,
    )
