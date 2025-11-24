# added upload helper for server-side uploads
import os
import requests
from urllib.parse import quote
from typing import Optional

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
STORAGE_BUCKET = os.getenv("SUPABASE_BUCKET", "student-photos")


def get_public_url(path: str | None) -> str | None:
    if not path:
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{quote(path)}"


def delete_object(path: str) -> None:
    if not path:
        return

    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        raise RuntimeError("Supabase service credentials not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).")

    encoded_path = quote(path, safe="")
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{encoded_path}"

    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "apikey": SERVICE_ROLE_KEY,
    }

    resp = requests.delete(url, headers=headers, timeout=15)
    if not resp.ok:
        raise RuntimeError(f"Failed to delete storage object ({resp.status_code}): {resp.text}")


def upload_object(file_bytes: bytes, dest_path: str, content_type: str | None = None) -> str:
    """
    Upload raw bytes to Supabase Storage using the service role key (server-side).

    Args:
      file_bytes: file content as bytes
      dest_path: storage path inside the bucket (e.g. "student_photos/uuid.jpg")
      content_type: optional mime type (e.g. "image/jpeg")

    Returns:
      dest_path (the storage key to store in DB)

    Raises:
      RuntimeError on misconfiguration or upload failure.
    """
    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        raise RuntimeError("Supabase service credentials not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).")

    if not dest_path:
        raise ValueError("dest_path is required")

    encoded_path = quote(dest_path, safe="")
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{encoded_path}"

    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "apikey": SERVICE_ROLE_KEY,
    }
    # Let the caller set Content-Type when available
    if content_type:
        headers["Content-Type"] = content_type

    resp = requests.put(upload_url, data=file_bytes, headers=headers, timeout=30)
    if not resp.ok:
        raise RuntimeError(f"Failed to upload storage object ({resp.status_code}): {resp.text}")

    return dest_path