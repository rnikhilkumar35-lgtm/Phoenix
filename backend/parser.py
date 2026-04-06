import fitz  # PyMuPDF
import docx
import os


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file given its bytes."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return f"[Error reading PDF: {e}]"


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract all text from a DOCX file given its bytes."""
    try:
        import tempfile
        # Write to a temp file since python-docx needs a file path
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        doc = docx.Document(tmp_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        os.unlink(tmp_path)
        return text.strip()
    except Exception as e:
        return f"[Error reading DOCX: {e}]"


def extract_text(filename: str, file_bytes: bytes) -> str:
    """Route extraction based on file extension."""
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        return file_bytes.decode("utf-8", errors="ignore")
