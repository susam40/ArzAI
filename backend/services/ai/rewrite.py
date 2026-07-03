from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.schemas import RewriteAction
from backend.services.ai.llm_client import LLMError, NvidiaLLMClient
from backend.services.prompt_service import PromptService


class RewriteService:
    def __init__(
        self,
        llm_client: NvidiaLLMClient | None = None,
        prompt_service: PromptService | None = None,
    ) -> None:
        self._llm = llm_client or NvidiaLLMClient()
        self._prompts = prompt_service or PromptService()

    async def rewrite(
        self,
        db: AsyncSession,
        text: str,
        action: RewriteAction,
        *,
        model: str | None = None,
    ) -> str:
        instruction = await self._prompts.get_content(db, f"rewrite.action.{action}")
        system_prompt = await self._prompts.get_content(db, "rewrite.system")
        user_template = await self._prompts.get_content(db, "rewrite.user_template")
        user_prompt = user_template.format(instruction=instruction, text=text)
        try:
            result = await self._llm.generate_text(
                system_prompt,
                user_prompt,
                model=model,
                temperature=0.2,
            )
        except LLMError as exc:
            raise ValueError(f"Yeniden yazma başarısız: {exc}") from exc
        return result.strip()
