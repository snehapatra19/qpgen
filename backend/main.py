from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn, os, json, time, uuid
from typing import Optional
from pathlib import Path
from text_extractor import extract_text
from preprocessor import preprocess_text
from llm_service import generate_questions_and_answers
from pdf_generator import generate_pdf
from analytics import Analytics

app = FastAPI(title="QPGen API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
analytics = Analytics()

@app.get("/")
def root():
    return {"status": "QPGen API is running", "version": "1.0.0"}

@app.get("/api/analytics")
def get_analytics():
    return analytics.get_stats()

@app.post("/api/generate")
async def generate(
    file: UploadFile = File(...),
    num_questions: int = Form(10),
    difficulty: str = Form("medium"),
    question_types: str = Form("mcq,short,long"),
    subject: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None)
):
    session_id = str(uuid.uuid4())
    start_time = time.time()
    allowed_extensions = {".pdf", ".pptx", ".docx", ".txt", ".ppt"}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type {file_ext} not supported.")
    upload_path = UPLOAD_DIR / f"{session_id}{file_ext}"
    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)
    try:
        raw_text = extract_text(str(upload_path), file_ext)
        if not raw_text or len(raw_text.strip()) < 100:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from the file.")
        processed = preprocess_text(raw_text)
        q_types = question_types.split(",")
        result = generate_questions_and_answers(
            text=processed["clean_text"], keywords=processed["keywords"],
            topics=processed["topics"], num_questions=num_questions,
            difficulty=difficulty, question_types=q_types, subject=subject, api_key=api_key
        )
        elapsed = time.time() - start_time
        result_path = OUTPUT_DIR / f"{session_id}.json"
        with open(result_path, "w") as f:
            json.dump(result, f, indent=2)
        analytics.record_session(session_id=session_id, filename=file.filename,
            num_questions=len(result["questions"]), difficulty=difficulty,
            processing_time=elapsed, topics=processed["topics"][:3])
        return {"session_id": session_id, "filename": file.filename,
            "processing_time": round(elapsed, 2), "word_count": processed["word_count"],
            "topics": processed["topics"], "keywords": processed["keywords"][:10],
            "questions": result["questions"], "summary": result.get("summary", ""),
            "bloom_distribution": result.get("bloom_distribution", {})}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    finally:
        if upload_path.exists():
            os.remove(upload_path)

@app.get("/api/download/pdf/{session_id}")
def download_pdf(session_id: str):
    result_path = OUTPUT_DIR / f"{session_id}.json"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    with open(result_path) as f:
        data = json.load(f)
    pdf_path = OUTPUT_DIR / f"{session_id}.pdf"
    generate_pdf(data, str(pdf_path))
    return FileResponse(path=str(pdf_path), media_type="application/pdf", filename="question_paper.pdf")

@app.get("/api/download/txt/{session_id}")
def download_txt(session_id: str):
    result_path = OUTPUT_DIR / f"{session_id}.json"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    with open(result_path) as f:
        data = json.load(f)
    txt_path = OUTPUT_DIR / f"{session_id}.txt"
    with open(txt_path, "w") as f:
        f.write("QUESTION PAPER\n" + "="*60 + "\n\n")
        for i, q in enumerate(data["questions"], 1):
            f.write(f"Q{i}. [{q.get('type','').upper()}] [{q.get('bloom_level','')}]\n{q['question']}\n\n")
            if q.get("options"):
                for opt in q["options"]: f.write(f"   {opt}\n")
                f.write("\n")
            f.write(f"ANSWER: {q['answer']}\n\n" + "-"*60 + "\n\n")
    return FileResponse(path=str(txt_path), media_type="text/plain", filename="question_paper.txt")

@app.post("/api/feedback")
async def submit_feedback(feedback: dict):
    feedback_path = Path("feedback.json")
    existing = []
    if feedback_path.exists():
        with open(feedback_path) as f: existing = json.load(f)
    existing.append({**feedback, "timestamp": time.time()})
    with open(feedback_path, "w") as f: json.dump(existing, f, indent=2)
    analytics.record_feedback(feedback.get("rating", 3))
    return {"status": "Feedback recorded"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
