from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load model once at module level (cached after first load)
print("Loading NLP model (sentence-transformers)...")
MODEL = SentenceTransformer("all-MiniLM-L6-v2")
print("Model loaded successfully!")


def rank_resumes(job_description: str, resumes: list[dict]) -> list[dict]:
    """
    Rank resumes against a job description using semantic similarity.

    Args:
        job_description: The job description text
        resumes: List of dicts with keys: name, text, skills

    Returns:
        Sorted list of resumes with 'score' added (0-100)
    """
    if not resumes:
        return []

    # Encode job description
    jd_embedding = MODEL.encode([job_description])

    # Encode all resume texts
    resume_texts = [r["text"] for r in resumes]
    resume_embeddings = MODEL.encode(resume_texts)

    # Compute cosine similarity scores
    scores = cosine_similarity(jd_embedding, resume_embeddings)[0]

    # Normalize to 0-100 range
    # cosine similarity is -1 to 1, but in practice for text it's 0-1
    normalized_scores = [round(float(score) * 100, 2) for score in scores]

    # Attach scores to resume dicts
    results = []
    for i, resume in enumerate(resumes):
        result = resume.copy()
        result["score"] = normalized_scores[i]
        result["raw_score"] = float(scores[i])
        results.append(result)

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)

    # Add rank
    for i, result in enumerate(results):
        result["rank"] = i + 1

    return results


def get_score_label(score: float) -> str:
    """Return a human-readable label for a match score."""
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "Fair"
    else:
        return "Poor"
