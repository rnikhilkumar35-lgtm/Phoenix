from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List
import os
import uvicorn

from parser import extract_text
from skills import extract_skills, extract_contact_info
from ranker import rank_resumes, get_score_label

app = FastAPI(
    title="ResumeRanker API",
    description="AI-powered resume ranking using NLP and semantic embeddings",
    version="1.0.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve frontend directory path
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))


@app.get("/")
async def serve_frontend():
    """Serve the main frontend page."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "ResumeRanker API is running! Frontend not found."}


@app.get("/style.css")
async def serve_css():
    """Serve the CSS stylesheet."""
    return FileResponse(os.path.join(FRONTEND_DIR, "style.css"), media_type="text/css")


@app.get("/app.js")
async def serve_js():
    """Serve the JavaScript file."""
    return FileResponse(os.path.join(FRONTEND_DIR, "app.js"), media_type="application/javascript")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "ResumeRanker API is running"}


@app.post("/upload")
async def upload_and_rank(
    job_description: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Upload resumes and rank them against a job description.
    
    - **job_description**: The job description text to rank against
    - **files**: One or more resume files (PDF, DOCX, TXT)
    
    Returns ranked list of resumes with scores and skill extraction.
    """
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")

    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one resume")

    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 resumes allowed at once")

    # Process each uploaded file
    resumes = []
    errors = []

    for file in files:
        try:
            # Validate file type
            allowed_types = {"pdf", "docx", "doc", "txt"}
            ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
            if ext not in allowed_types:
                errors.append(f"{file.filename}: Unsupported file type. Use PDF, DOCX, or TXT.")
                continue

            # Read file bytes
            file_bytes = await file.read()

            if len(file_bytes) == 0:
                errors.append(f"{file.filename}: File is empty")
                continue

            # Extract text
            text = extract_text(file.filename, file_bytes)

            if not text or len(text.strip()) < 50:
                errors.append(f"{file.filename}: Could not extract enough text from this file")
                continue

            # Extract skills and contact info
            skills_data = extract_skills(text)
            contact_info = extract_contact_info(text)

            resumes.append({
                "name": file.filename,
                "text": text,
                "skills": skills_data,
                "contact": contact_info,
                "char_count": len(text)
            })

        except Exception as e:
            errors.append(f"{file.filename}: Processing error - {str(e)}")

    if not resumes:
        raise HTTPException(
            status_code=422,
            detail=f"No resumes could be processed. Errors: {'; '.join(errors)}"
        )

    # Rank the resumes
    ranked = rank_resumes(job_description, resumes)

    # Format response
    results = []
    for resume in ranked:
        results.append({
            "rank": resume["rank"],
            "name": resume["name"],
            "score": resume["score"],
            "score_label": get_score_label(resume["score"]),
            "skills": resume["skills"]["matched_skills"],
            "skills_by_category": resume["skills"]["by_category"],
            "skill_count": resume["skills"]["count"],
            "contact": resume["contact"],
            "char_count": resume["char_count"]
        })

    return {
        "success": True,
        "total_processed": len(resumes),
        "total_uploaded": len(files),
        "errors": errors,
        "job_description_preview": job_description[:200] + "..." if len(job_description) > 200 else job_description,
        "results": results
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
