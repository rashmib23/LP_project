"""
PDF / DOCX / TXT extraction helpers.

We try `pdfplumber` first (better layout handling), then fall back to PyPDF2.
"""
import os


def extract_text_from_pdf(path: str) -> str:
    text = ""
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        if text.strip():
            return text
    except Exception:
        pass

    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(path)
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as e:
        raise RuntimeError(f"PDF parsing failed: {e}")
    return text


def extract_text_from_docx(path: str) -> str:
    try:
        import docx  # python-docx (optional)
    except ImportError:
        raise RuntimeError("python-docx is not installed. Install it or upload PDF/TXT.")
    document = docx.Document(path)
    return "\n".join(p.text for p in document.paragraphs)


def extract_text_from_file(path: str) -> str:
    ext = os.path.splitext(path)[1].lower().lstrip(".")
    if ext == "pdf":
        return extract_text_from_pdf(path)
    if ext == "docx":
        return extract_text_from_docx(path)
    if ext in ("txt", "md"):
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    raise ValueError(f"Unsupported file type: {ext}")


def split_sections(text: str) -> dict:
    """
    Heuristic section splitter for common lesson plan headings.
    Returns a dict like {"objectives": "...", "content": "...", "activities": "..."}.
    """
    import re
    headings = [
        ("title", r"(?:^|\n)\s*(title|topic|lesson title)\s*[:\-]"),
        ("objectives", r"(?:^|\n)\s*(learning objectives?|objectives?|aims?)\s*[:\-]"),
        ("outcomes", r"(?:^|\n)\s*(course outcomes?|learning outcomes?|outcomes?|co)\s*[:\-]"),
        ("content", r"(?:^|\n)\s*(content|topic content|lesson content|description)\s*[:\-]"),
        ("activities", r"(?:^|\n)\s*(activities|teaching activities|methods?|teaching methods?|teaching strategy|strategies)\s*[:\-]"),
        ("assessment", r"(?:^|\n)\s*(assessment|evaluation|assessment strategy)\s*[:\-]"),
        ("resources", r"(?:^|\n)\s*(resources|materials|references)\s*[:\-]"),
    ]
    spans = []
    for name, pat in headings:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            spans.append((m.end(), name))
    spans.sort()
    sections = {}
    for i, (start, name) in enumerate(spans):
        end = spans[i + 1][0] if i + 1 < len(spans) else len(text)
        sections[name] = text[start:end].strip()
    return sections
