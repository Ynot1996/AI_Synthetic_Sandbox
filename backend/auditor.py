"""
Stage 1 audit engine: PDF → text → Gemini 2.5 Flash FCA audit → structured JSON.
Uses the new google-genai SDK (google.generativeai is deprecated).
"""

import os
import io
import json
import uuid
import asyncio
from typing import AsyncGenerator

from google import genai
from google.genai import types

from fca_knowledge import AUDIT_SYSTEM_PROMPT, build_audit_prompt

MODEL = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment.")
    return genai.Client(api_key=api_key)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    import pdfplumber
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")


def extract_document_text(filename: str, file_bytes: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    return extract_text_from_txt(file_bytes)


def _call_gemini_audit(document_text: str) -> dict:
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL,
        contents=build_audit_prompt(document_text),
        config=types.GenerateContentConfig(
            system_instruction=AUDIT_SYSTEM_PROMPT,
            temperature=0.1,
            max_output_tokens=8192,
        ),
    )
    raw = response.text.strip()

    # Strip markdown fences if model wraps output
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    result = json.loads(raw)
    if "audit_id" not in result or not result["audit_id"]:
        result["audit_id"] = uuid.uuid4().hex[:8]
    return result


def run_audit(filename: str, file_bytes: bytes) -> dict:
    document_text = extract_document_text(filename, file_bytes)
    if not document_text.strip():
        raise ValueError("Could not extract any text from the uploaded document.")
    return _call_gemini_audit(document_text)


async def stream_audit(filename: str, file_bytes: bytes) -> AsyncGenerator[str, None]:
    def sse(event: str, payload: dict) -> str:
        return f"data: {json.dumps({'event': event, **payload})}\n\n"

    yield sse("log", {"message": "Received document — starting extraction..."})
    await asyncio.sleep(0.05)

    try:
        document_text = await asyncio.get_event_loop().run_in_executor(
            None, extract_document_text, filename, file_bytes
        )
    except Exception as exc:
        yield sse("error", {"message": f"Text extraction failed: {exc}"})
        return

    word_count = len(document_text.split())
    yield sse("log", {"message": f"Extracted {word_count} words from document."})
    await asyncio.sleep(0.05)

    yield sse("log", {"message": "Loading FCA Consumer Duty knowledge base (FG22/5 + PS22/9)..."})
    await asyncio.sleep(0.1)

    yield sse("log", {"message": f"Sending to {MODEL} for compliance audit..."})
    await asyncio.sleep(0.05)

    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None, _call_gemini_audit, document_text
        )
    except json.JSONDecodeError as exc:
        yield sse("error", {"message": f"Model returned malformed JSON: {exc}"})
        return
    except Exception as exc:
        yield sse("error", {"message": f"Audit failed: {exc}"})
        return

    flag_count = len(result.get("flagged_clauses", []))
    passed = result.get("pass", False)
    yield sse("log", {"message": f"Audit complete — {flag_count} issue(s) found. Pass: {passed}"})
    await asyncio.sleep(0.05)

    yield sse("complete", {"result": result})
