# ================================================================
# FastAPI — LawEase Legal AI Backend (STRICT DOMAIN CONTROL)
# ================================================================

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from fastapi import FastAPI, UploadFile, File
import docx
from PyPDF2 import PdfReader
import re

# ================================================================
# Ollama Configuration
# ================================================================
OLLAMA_HTTP = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:1.5b"

# ================================================================
# App Initialization
# ================================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================================================
# In-Memory Storage
# ================================================================
DOCUMENT_MEMORY = ""   # Stores uploaded document text


# ================================================================
# Request Models
# ================================================================
class ChatRequest(BaseModel):
    prompt: str

class TranslateRequest(BaseModel):
    text: str
    from_lang: str
    to_lang: str


# ================================================================
# Ollama HTTP Call
# ================================================================
def generate_with_ollama_http(prompt: str):
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }
        r = requests.post(OLLAMA_HTTP, json=payload, timeout=30)
        r.raise_for_status()
        j = r.json()
        return j.get("response") or j.get("text") or ""
    except Exception as e:
        print("Ollama Error:", e)
        return None


# ================================================================
# LEGAL INTENT DETECTION (KEYWORDS)
# ================================================================
def is_legal_query(prompt: str) -> bool:
    keywords = [
        "law","legal","section","act","article","clause","statute","case",
        "court","judge","judgment","order","petition","appeal","writ",
        "ipc","crpc","fir","bail","arrest","offence","crime",
        "contract","agreement","breach","lease","rent","eviction",
        "divorce","marriage","custody","alimony",
        "consumer","refund","negligence",
        "company","gst","tax","insolvency",
        "copyright","trademark","patent",
        "constitution","fundamental rights"
    ]
    return any(k in prompt.lower() for k in keywords)


# ================================================================
# LEGAL SCENARIO DETECTION (IMPORTANT)
# ================================================================
def is_legal_scenario(prompt: str) -> bool:
    indicators = [
        # Legal roles
        "tenant","landlord","employer","employee","husband","wife",
        "buyer","seller","owner","consumer","accused","complainant",

        # Dispute actions
        "stopped paying","failed to pay","terminated","dismissed",
        "breach","evicted","arrested","harassed","cheated",
        "filed a case","issued notice",

        # Legal intention
        "what can i do","what action","can i file","is it legal",
        "legal action","rights","remedy","punishment",
        "compensation","liable","case against"
    ]
    return any(k in prompt.lower() for k in indicators)


# ================================================================
# PDF / DOCX Extraction
# ================================================================
def extract_pdf_text(file):
    try:
        reader = PdfReader(file)
        return "".join(page.extract_text() + "\n" for page in reader.pages)
    except:
        return ""


# ================================================================
# Upload Document Endpoint
# ================================================================
@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    global DOCUMENT_MEMORY

    if file.filename.endswith(".pdf"):
        DOCUMENT_MEMORY = extract_pdf_text(file.file)

    elif file.filename.endswith(".docx"):
        doc = docx.Document(file.file)
        DOCUMENT_MEMORY = "\n".join(p.text for p in doc.paragraphs)

    else:
        return {"error": "Only PDF or DOCX files are supported"}

    return {
        "filename": file.filename,
        "status": "Document uploaded successfully"
    }


# ================================================================
# Markdown Formatter
# ================================================================
def format_markdown_spacing(text: str) -> str:
    lines = text.split("\n")
    cleaned = []
    prev_blank = False

    for line in lines:
        if line.strip() == "":
            if not prev_blank:
                cleaned.append("")
            prev_blank = True
        else:
            cleaned.append(line)
            prev_blank = False

    return "\n".join(cleaned)


# ================================================================
# Chat Endpoint (STRICT LEGAL CONTROL)
# ================================================================
@app.post("/chat")
async def chat_handler(req: ChatRequest):
    global DOCUMENT_MEMORY
    user_prompt = req.prompt.strip().lower()

    # ------------------------------------------------
    # Follow-up detection (DOCUMENT-AWARE)
    # ------------------------------------------------
    FOLLOWUP_KEYWORDS = [
        "document","clause","section","agreement","contract","policy",
        "explain","simplify","summary","details","highlight","rewrite",
        "previous","above","below","context","continue","more","why","how"
    ]

    is_followup = (
        DOCUMENT_MEMORY and
        any(k in user_prompt for k in FOLLOWUP_KEYWORDS)
    )

    # ------------------------------------------------
    # HARD LEGAL DOMAIN GATE (FINAL AUTHORITY)
    # ------------------------------------------------
    if not (
        is_legal_query(user_prompt)
        or is_legal_scenario(user_prompt)
        or is_followup
    ):
        return {
            "response": "⚠ This system answers only legal questions, legal scenario-based problems, or queries related to the uploaded legal document."
        }

    # ------------------------------------------------
    # Persona Prompt
    # ------------------------------------------------
    persona = (
        "You are LawEase, a STRICT legal-domain AI assistant.\n"
        "Answer ONLY legal questions.\n\n"
        "FORMAT RULES:\n"
        "## **Overview**\n"
        "## **Key Terms**\n"
        "## **Key Points / Provisions**\n"
        "## **Summary**\n\n"
    "• Use bullet points only\n"
    "• Bold all legal terms\n"
    "• Do not use lines, dividers, or separators\n"
    "• No general knowledge\n"
    "• No non-legal explanations\n"
)

    doc_context = (
        f"\n\nUploaded Legal Document:\n{DOCUMENT_MEMORY}\n"
        if DOCUMENT_MEMORY else ""
    )

    final_prompt = (
        f"{persona}\n"
        f"{doc_context}\n"
        f"User Question:\n{user_prompt}\n\n"
        "Answer strictly within legal domain."
    )

    result = generate_with_ollama_http(final_prompt)

    if not result:
        return {"response": "⚠ LLM unavailable"}

    return {"response": format_markdown_spacing(result.strip())}


# ================================================================
# Reset Memory
# ================================================================
@app.post("/reset")
async def reset_chat():
    global DOCUMENT_MEMORY
    DOCUMENT_MEMORY = ""
    return {"status": "reset_success"}


# ================================================================
# Translation Endpoint (UTILITY ONLY)
# ================================================================
@app.post("/translate")
async def translate_handler(req: TranslateRequest):
    prompt = f"""
    Translate word-for-word from {req.from_lang} to {req.to_lang}.
    Return only translated text.

    Text:
    {req.text}
    """
    result = generate_with_ollama_http(prompt)
    return {"translation": result.strip() if result else "Translation failed"}


# ================================================================
# Root
# ================================================================
@app.get("/")
async def root():
    return {"status": "LawEase backend running (STRICT LEGAL MODE)"}
