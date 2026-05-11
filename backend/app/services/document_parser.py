import re
import zlib
import zipfile
from io import BytesIO
from typing import Optional
from xml.etree import ElementTree


TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".json"}
SUPPORTED_EXTENSIONS = TEXT_EXTENSIONS | {".docx", ".pdf"}


def _extension(filename: str) -> str:
    lowered = filename.lower().strip()
    for extension in SUPPORTED_EXTENSIONS:
        if lowered.endswith(extension):
            return extension
    return ""


def _decode_text(raw: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def _extract_docx(raw: bytes) -> str:
    try:
        with zipfile.ZipFile(BytesIO(raw)) as archive:
            document_xml = archive.read("word/document.xml")
    except (KeyError, zipfile.BadZipFile) as exc:
        raise ValueError("Could not read this DOCX file.") from exc

    try:
        root = ElementTree.fromstring(document_xml)
    except ElementTree.ParseError as exc:
        raise ValueError("Could not parse this DOCX file.") from exc

    namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    paragraphs = []
    for paragraph in root.iter(f"{namespace}p"):
        pieces = [node.text or "" for node in paragraph.iter(f"{namespace}t")]
        text = "".join(pieces).strip()
        if text:
            paragraphs.append(text)

    extracted = "\n".join(paragraphs).strip()
    if not extracted:
        texts = [node.text or "" for node in root.iter() if node.tag.endswith("}t")]
        extracted = "\n".join(text.strip() for text in texts if text and text.strip())
    return extracted


def _decode_pdf_literal(value: str) -> str:
    value = value.replace(r"\(", "(").replace(r"\)", ")").replace(r"\\", "\\")
    value = re.sub(r"\\[nrbtf]", " ", value)
    value = re.sub(r"\\\d{1,3}", " ", value)
    return value


def _extract_pdf_strings(text: str) -> str:
    literals = [_decode_pdf_literal(match) for match in re.findall(r"\((?:\\.|[^\\)])*\)", text)]
    cleaned_literals = [literal[1:-1].strip() for literal in literals if literal.strip()]

    hex_strings = []
    for match in re.findall(r"<([0-9A-Fa-f\s]{8,})>", text):
        compact = re.sub(r"\s+", "", match)
        if len(compact) % 2:
            compact = compact[:-1]
        try:
            decoded = bytes.fromhex(compact).decode("utf-16-be", errors="ignore")
        except ValueError:
            decoded = ""
        if decoded.strip():
            hex_strings.append(decoded.strip())

    return " ".join(cleaned_literals + hex_strings)


def _extract_pdf_with_optional_library(raw: bytes) -> Optional[str]:
    try:
        from pypdf import PdfReader  # type: ignore
    except ImportError:
        return None

    try:
        reader = PdfReader(BytesIO(raw))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception:
        return None
    text = "\n".join(page.strip() for page in pages if page.strip())
    return text or None


def _extract_pdf_best_effort(raw: bytes) -> str:
    library_text = _extract_pdf_with_optional_library(raw)
    if library_text:
        return library_text

    chunks = []
    for stream in re.findall(rb"stream\r?\n(.*?)\r?\nendstream", raw, flags=re.DOTALL):
        payload = stream.strip(b"\r\n")
        try:
            payload = zlib.decompress(payload)
        except zlib.error:
            pass
        chunks.append(_extract_pdf_strings(payload.decode("latin-1", errors="ignore")))

    chunks.append(_extract_pdf_strings(raw.decode("latin-1", errors="ignore")))
    return "\n".join(chunk for chunk in chunks if chunk.strip())


def extract_upload_text(filename: str, content_type: Optional[str], raw: bytes) -> str:
    extension = _extension(filename)
    if not extension and content_type:
        if "pdf" in content_type:
            extension = ".pdf"
        elif "wordprocessingml" in content_type:
            extension = ".docx"
        elif content_type.startswith("text/"):
            extension = ".txt"

    if extension in TEXT_EXTENSIONS:
        text = _decode_text(raw)
    elif extension == ".docx":
        text = _extract_docx(raw)
    elif extension == ".pdf":
        text = _extract_pdf_best_effort(raw)
    else:
        raise ValueError("Unsupported file type. Upload TXT, MD, CSV, JSON, DOCX, or PDF.")

    clean_text = re.sub(r"[ \t]+", " ", text)
    clean_text = re.sub(r"\n{3,}", "\n\n", clean_text).strip()
    if len(clean_text) < 40:
        raise ValueError("Could not extract enough readable text from this file. Paste the text manually instead.")
    return clean_text
