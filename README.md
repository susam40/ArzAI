# ArzAI — AI Dilekçe Asistanı

Template-driven resmi dilekçe üretim platformu. LLM yalnızca gövde metnini üretir; başlık, imza ve format Jinja2 şablonlarıyla sabitlenir.

## Arayüz

- **Landing** (`/`) — Hero, özellik kartları, CTA
- **Wizard** (`/create`) — 3 adım: kurum → tür → bilgi + AI akıllı sorular
- **Editör** (`/editor`) — TipTap, AI rewrite, A4 önizleme, PDF/DOCX/yazdır
- **Dashboard** (`/dashboard`) — Geçmiş dilekçeler

Tasarım: Tailwind, shadcn-style bileşenler, Framer Motion, lacivert accent, legal-tech görünüm.

## Mimari

```
Frontend (Next.js + TipTap)
    ↓
FastAPI (/api/generate, /api/export-*, /api/templates)
    ↓
Prompt Builder → Nvidia API (OpenAI-compatible)
    ↓
Structured Output Validator
    ↓
Jinja2 Template Engine → WeasyPrint PDF / python-docx
```

## Docker (önerilen)

```bash
cp .env.example .env
# .env içinde NVIDIA_API_KEY veya LLM_MOCK=true

docker compose up --build
```

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

Durdurmak: `docker compose down`  
Veritabanını da silmek: `docker compose down -v`

Mock mod ile çalıştırma:

```bash
LLM_MOCK=true docker compose up --build
```

## Kurulum (yerel)

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
# NVIDIA_API_KEY veya LLM_MOCK=true
python main.py
```

API: http://127.0.0.1:8000  
Docs: http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 npm run dev
```

UI: http://localhost:3000

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `NVIDIA_API_KEY` | Nvidia Integrate API anahtarı |
| `NVIDIA_API_URL` | Varsayılan: `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | Örn. `meta/llama-3.1-8b-instruct` |
| `LLM_MOCK` | `true` ise API anahtarı olmadan mock üretim |
| `DATABASE_URL` | SQLite veya PostgreSQL async URL |

## Dilekçe Kategorileri (MVP)

- CİMER: şikayet, bilgi talebi
- Üniversite: izin, itiraz
- Tüketici Hakem Heyeti: şikayet
- İş Hukuku: işe iade, izin

## Test

```bash
LLM_MOCK=true pytest -q
```
