import os
import io
import json
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ai_gateway import ai_gateway, get_env_keys

app = FastAPI(
    title="FixNest AI Backend API",
    description="Enterprise Multi-Provider AI Gateway for Home Repairs & Diagnostics",
    version="2.0.0"
)

# Enable CORS for local Expo Metro bundler & web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    attachments_summary: Optional[str] = None
    image_base64: Optional[str] = None

class ImageGenRequest(BaseModel):
    prompt: str

@app.get("/health")
async def health_check():
    keys = get_env_keys()
    providers_status = [
        {"name": "Google Gemini", "configured": bool(keys["GEMINI"])},
        {"name": "OpenAI GPT-5.5", "configured": bool(keys["OPENAI"])},
        {"name": "Anthropic Claude", "configured": bool(keys["ANTHROPIC"])},
        {"name": "Groq Llama-3", "configured": bool(keys["GROQ"])},
        {"name": "OpenRouter AI", "configured": bool(keys["OPENROUTER"])},
    ]
    
    return {
        "status": "online",
        "service": "FixNest AI Backend Gateway",
        "providers": providers_status
    }

@app.post("/api/ai/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        dict_messages = [{"role": m.role, "content": m.content} for m in req.messages]
        result = await ai_gateway.generate_response(
            messages=dict_messages,
            attachments_summary=req.attachments_summary,
            image_base64=req.image_base64
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat/stream")
async def chat_stream_endpoint(req: ChatRequest):
    dict_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    
    async def event_generator():
        res = await ai_gateway.generate_response(
            messages=dict_messages,
            attachments_summary=req.attachments_summary,
            image_base64=req.image_base64
        )
        full_text = res.get("reply", "")
        provider = res.get("provider_used", "AI Gateway")
        
        # Stream response chunk by chunk for real-time streaming effect
        words = full_text.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + " "
            data = {"chunk": chunk, "provider": provider}
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(0.04)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/ai/generate-image")
async def generate_image_endpoint(req: ImageGenRequest):
    try:
        result = await ai_gateway.generate_image(req.prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/upload-parse")
async def upload_parse_endpoint(file: UploadFile = File(...)):
    """
    Parses PDF, DOCX, TXT documents or video metadata to extract textual context.
    """
    filename = file.filename.lower()
    content_bytes = await file.read()
    extracted_text = ""

    try:
        if filename.endswith(".txt"):
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
        elif filename.endswith(".pdf"):
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
            pages_text = [page.extract_text() for page in pdf_reader.pages if page.extract_text()]
            extracted_text = "\n".join(pages_text)
        elif filename.endswith(".docx"):
            import docx2txt
            extracted_text = docx2txt.process(io.BytesIO(content_bytes))
        elif any(filename.endswith(ext) for ext in [".mp4", ".mov", ".avi", ".mkv"]):
            extracted_text = f"[Video File Attached]: {file.filename} (Size: {len(content_bytes) // 1024} KB). Requesting AI inspection of video clip frame sequence."
        else:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
    except Exception as err:
        extracted_text = f"[File Attachment]: {file.filename} (Text extraction notice: {str(err)})"

    return {
        "filename": file.filename,
        "size_bytes": len(content_bytes),
        "extracted_text": extracted_text[:3000]  # Cap at 3000 chars
    }

PROS_FILE = os.path.join(os.path.dirname(__file__), "registered_professionals.json")
REQS_FILE = os.path.join(os.path.dirname(__file__), "booking_requests.json")

def load_json_file(filepath: str) -> list:
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_json_file(filepath: str, data: list):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[Backend Error] Saving {filepath}:", e)

@app.get("/api/professionals")
async def get_professionals():
    return load_json_file(PROS_FILE)

@app.post("/api/professionals")
async def register_professional(profile: Dict[str, Any]):
    pros = load_json_file(PROS_FILE)
    pro_id = profile.get("id")
    if not pro_id:
        raise HTTPException(status_code=400, detail="Profile must contain id")
    
    # Filter out any legacy default pros
    default_ids = {"pro_1", "pro_2", "pro_3", "pro_4", "pro_5"}
    pros = [p for p in pros if p.get("id") not in default_ids]

    existing_index = next((i for i, p in enumerate(pros) if p.get("id") == pro_id), -1)
    if existing_index >= 0:
        pros[existing_index] = profile
    else:
        pros.insert(0, profile)
    
    save_json_file(PROS_FILE, pros)
    return {"status": "success", "professionals": pros}

@app.get("/api/requests")
async def get_booking_requests():
    return load_json_file(REQS_FILE)

@app.post("/api/requests")
async def create_booking_request(req: Dict[str, Any]):
    reqs = load_json_file(REQS_FILE)
    req_id = req.get("id")
    existing_index = next((i for i, r in enumerate(reqs) if r.get("id") == req_id), -1)
    if existing_index >= 0:
        reqs[existing_index] = req
    else:
        reqs.insert(0, req)
    save_json_file(REQS_FILE, reqs)
    return {"status": "success", "requests": reqs}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
