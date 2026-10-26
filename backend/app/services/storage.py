import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status

# Storage configuration
UPLOAD_DIR = Path("uploads")
PROPERTIES_DIR = UPLOAD_DIR / "properties"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def init_storage():
    """Ensure upload directories exist."""
    PROPERTIES_DIR.mkdir(parents=True, exist_ok=True)


def _validate_magic_bytes(content: bytes, ext: str) -> bool:
    """Validate image magic bytes to prevent masquerading malicious files."""
    if ext in {".jpg", ".jpeg"}:
        return content.startswith(b"\xff\xd8\xff")
    elif ext == ".png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    elif ext == ".webp":
        return content.startswith(b"RIFF") and b"WEBP" in content[8:16]
    return False


async def save_property_image(file: UploadFile) -> Tuple[str, str, int]:
    """
    Validate and save uploaded property image file to object storage directory.
    Returns: (url, filename, size_bytes)
    """
    init_storage()

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Only JPEG, PNG, and WebP images are allowed.",
        )

    # Validate Content-Type
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image content-type '{content_type}'. Must be JPEG, PNG, or WebP.",
        )

    # Read content
    content = await file.read()
    size_bytes = len(content)

    if size_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of 5 MB (size: {size_bytes / (1024 * 1024):.1f} MB).",
        )

    if not _validate_magic_bytes(content, ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid image file. Header signature does not match image format.",
        )

    # Generate secure random filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = PROPERTIES_DIR / unique_filename

    with open(dest_path, "wb") as f:
        f.write(content)

    url = f"/uploads/properties/{unique_filename}"
    return url, unique_filename, size_bytes
