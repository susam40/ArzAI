.DEFAULT_GOAL := help

PYTHON ?= python3
VENV := .venv
VENV_BIN := $(VENV)/bin
PIP := $(VENV_BIN)/pip
PY := $(VENV_BIN)/python
FRONTEND_DIR := frontend
API_URL ?= http://127.0.0.1:8000
COMPOSE := docker compose

export LLM_MOCK ?= true

.PHONY: help install install-dev env dev dev-api dev-frontend \
	frontend-install test lint clean \
	docker-up docker-down docker-down-v docker-build docker-mock docker-logs

help: ## Bu yardım metnini göster
	@grep -E '^[a-zA-Z0-9_.-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

$(VENV)/bin/python:
	$(PYTHON) -m venv $(VENV)

install: $(VENV)/bin/python ## Python bağımlılıklarını kur (.venv)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

install-dev: install ## Test araçlarını da kur (pytest)
	$(PIP) install pytest pytest-asyncio

env: ## .env yoksa .env.example'dan kopyala
	@test -f .env || cp .env.example .env
	@echo ".env hazır"

frontend-install: ## Frontend npm bağımlılıklarını kur
	cd $(FRONTEND_DIR) && npm install

dev-api: install env ## API'yi yerelde çalıştır (uvicorn --reload)
	$(PY) main.py

dev-frontend: frontend-install env ## Next.js dev sunucusu
	cd $(FRONTEND_DIR) && NEXT_PUBLIC_API_URL=$(API_URL) npm run dev

dev: ## API + frontend'i paralel başlat
	@$(MAKE) -j2 dev-api dev-frontend

test: install-dev ## Pytest (LLM_MOCK=true)
	LLM_MOCK=true $(VENV_BIN)/pytest -q

lint: frontend-install ## Next.js lint
	cd $(FRONTEND_DIR) && npm run lint

clean: ## Önbellek ve derleme artıklarını temizle
	rm -rf .pytest_cache .coverage htmlcov
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf $(FRONTEND_DIR)/.next

docker-build: ## Docker imajlarını derle
	$(COMPOSE) build

docker-up: env ## Tüm servisleri Docker ile başlat
	$(COMPOSE) up --build

docker-mock: env ## Docker + LLM mock modu
	LLM_MOCK=true $(COMPOSE) up --build

docker-down: ## Docker servislerini durdur
	$(COMPOSE) down

docker-down-v: ## Docker servislerini durdur + volume sil
	$(COMPOSE) down -v

docker-logs: ## Docker loglarını izle
	$(COMPOSE) logs -f
