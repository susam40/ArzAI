import pytest


@pytest.mark.asyncio
async def test_list_models(client):
    response = await client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert data["current_model"]
    assert len(data["models"]) >= 1
    assert data["mock_mode"] is True


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_list_templates(client):
    response = await client.get("/api/templates")
    assert response.status_code == 200
    data = response.json()
    assert len(data["templates"]) >= 4
    institutions = {t["institution"] for t in data["templates"]}
    assert "cimer" in institutions
    assert "university" in institutions
    assert "consumer_court" in institutions
    assert "labor_law" in institutions


@pytest.mark.asyncio
async def test_generate_with_custom_model(client):
    payload = {
        "institution": "cimer",
        "petition_type": "complaint",
        "user_input": (
            "Belediye hizmet binasında asansör uzun süredir çalışmıyor. "
            "Yaşlı ve engelli vatandaşlar mağdur oluyor. Acil müdahale talep ediyorum."
        ),
        "metadata": {
            "user_name": "Ahmet Yılmaz",
            "date": "2026-05-19",
            "subject": "Asansör Arızası Şikayeti",
        },
        "model": "meta/llama-3.3-70b-instruct",
    }
    response = await client.post("/api/generate", json=payload)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_generate_cimer(client):
    payload = {
        "institution": "cimer",
        "petition_type": "complaint",
        "user_input": (
            "Belediye hizmet binasında asansör uzun süredir çalışmıyor. "
            "Yaşlı ve engelli vatandaşlar mağdur oluyor. Acil müdahale talep ediyorum."
        ),
        "metadata": {
            "user_name": "Ahmet Yılmaz",
            "date": "2026-05-19",
            "subject": "Asansör Arızası Şikayeti",
            "address": "Ankara",
        },
    }
    response = await client.post("/api/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["petition_id"]
    assert data["generated_body"]
    assert "Gereğini arz ederim" in data["full_text"]
    assert "CİMER" in data["full_text"]


@pytest.mark.asyncio
async def test_generate_all_types(client):
    cases = [
        ("cimer", "info_request"),
        ("university", "leave"),
        ("university", "objection"),
        ("consumer_court", "complaint"),
        ("labor_law", "reinstatement"),
        ("labor_law", "leave"),
    ]
    for institution, petition_type in cases:
        payload = {
            "institution": institution,
            "petition_type": petition_type,
            "user_input": "Konuyla ilgili detaylı başvurum ekteki gibidir. Gerekli işlemlerin yapılmasını talep ediyorum.",
            "metadata": {
                "user_name": "Test Kullanıcı",
                "date": "2026-05-19",
                "institution_name": "Test Kurum",
            },
        }
        response = await client.post("/api/generate", json=payload)
        assert response.status_code == 200, f"Failed for {institution}/{petition_type}"
        assert response.json()["full_text"]


@pytest.mark.asyncio
async def test_export_pdf(client):
    gen = await client.post(
        "/api/generate",
        json={
            "institution": "cimer",
            "petition_type": "complaint",
            "user_input": "Test şikayet metni yeterince uzun olmalıdır.",
            "metadata": {"user_name": "Test", "date": "2026-05-19"},
        },
    )
    petition_id = gen.json()["petition_id"]
    response = await client.post(
        "/api/export/pdf",
        json={"petition_id": petition_id, "title": "Şikayet Dilekçesi"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:4] == b"%PDF"
    assert "filename*=UTF-8" in response.headers["content-disposition"]


@pytest.mark.asyncio
async def test_export_docx(client):
    response = await client.post(
        "/api/export/docx",
        json={"content": "Test dilekçe içeriği\nİkinci satır", "title": "Test"},
    )
    assert response.status_code == 200
    assert "wordprocessingml" in response.headers["content-type"]
    assert len(response.content) > 100


@pytest.mark.asyncio
async def test_petition_crud(client):
    gen = await client.post(
        "/api/generate",
        json={
            "institution": "cimer",
            "petition_type": "complaint",
            "user_input": "Test şikayet metni yeterince uzun olmalıdır.",
            "metadata": {"user_name": "Test", "date": "2026-05-19", "subject": "İlk Konu"},
        },
    )
    assert gen.status_code == 200
    petition_id = gen.json()["petition_id"]

    get_resp = await client.get(f"/api/petitions/{petition_id}")
    assert get_resp.status_code == 200
    detail = get_resp.json()
    assert detail["id"] == petition_id
    assert "Gereğini arz ederim" in detail["content"]

    update_resp = await client.put(
        f"/api/petitions/{petition_id}",
        json={"subject": "Güncel Konu", "content": "Güncellenmiş dilekçe metni yeterince uzundur."},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["subject"] == "Güncel Konu"
    assert updated["content"] == "Güncellenmiş dilekçe metni yeterince uzundur."
    assert updated["has_edits"] is True

    list_resp = await client.get("/api/petitions")
    assert any(p["id"] == petition_id and p["has_edits"] for p in list_resp.json()["petitions"])

    delete_resp = await client.delete(f"/api/petitions/{petition_id}")
    assert delete_resp.status_code == 204

    missing = await client.get(f"/api/petitions/{petition_id}")
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_update_prompt(client):
    response = await client.put(
        "/api/prompts/generate.base_system",
        json={"content": "Updated system prompt for tests."},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "generate.base_system"
    assert data["content"] == "Updated system prompt for tests."
    assert data["updated_at"] is not None


@pytest.mark.asyncio
async def test_invalid_template(client):
    response = await client.post(
        "/api/generate",
        json={
            "institution": "invalid",
            "petition_type": "unknown",
            "user_input": "Bu metin yeterince uzun olmalı test için.",
            "metadata": {},
        },
    )
    assert response.status_code == 404
