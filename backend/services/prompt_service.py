import json
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.prompt import Prompt

DEFAULTS_PATH = Path(__file__).resolve().parents[1] / "data" / "prompt_defaults.json"


class PromptNotFoundError(KeyError):
    pass


class PromptService:
    async def prune_code_managed_prompts(self, db: AsyncSession) -> None:
        await db.execute(
            delete(Prompt).where(
                Prompt.key.like("generate.extra.%")
                | Prompt.key.like("smart.question.%")
                | (Prompt.key == "generate.json_instruction")
            )
        )

    async def _apply_defaults(self, db: AsyncSession) -> None:
        raw = json.loads(DEFAULTS_PATH.read_text(encoding="utf-8"))
        for item in raw:
            result = await db.execute(select(Prompt).where(Prompt.key == item["key"]))
            row = result.scalar_one_or_none()
            if row is None:
                db.add(
                    Prompt(
                        key=item["key"],
                        label=item["label"],
                        category=item["category"],
                        content=item["content"],
                    )
                )
            elif row.key == "generate.user_template" and "{json_instruction}" in row.content:
                row.content = item["content"]
                row.label = item["label"]
        await db.flush()

    async def seed_defaults(self, db: AsyncSession) -> None:
        await self.prune_code_managed_prompts(db)
        await self._apply_defaults(db)

    async def list_prompts(self, db: AsyncSession) -> list[Prompt]:
        result = await db.execute(
            select(Prompt)
            .where(Prompt.category != "smart")
            .order_by(Prompt.category, Prompt.key)
        )
        return list(result.scalars().all())

    async def get_prompt(self, db: AsyncSession, key: str) -> Prompt:
        result = await db.execute(select(Prompt).where(Prompt.key == key))
        row = result.scalar_one_or_none()
        if row is None:
            raise PromptNotFoundError(f"Prompt not found: {key}")
        return row

    async def get_content(self, db: AsyncSession, key: str, *, default: str = "") -> str:
        try:
            row = await self.get_prompt(db, key)
        except PromptNotFoundError:
            return default
        return row.content

    async def update_prompt(self, db: AsyncSession, key: str, content: str) -> Prompt:
        row = await self.get_prompt(db, key)
        row.content = content
        await db.flush()
        await db.refresh(row)
        return row
