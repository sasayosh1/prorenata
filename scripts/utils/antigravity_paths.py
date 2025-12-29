import os
from datetime import datetime


def _truthy(value: str | None) -> bool:
    v = str(value or "").strip().lower()
    return v in ("1", "true", "yes", "on")


def antigravity_root() -> str:
    """
    Centralized output root for any generated images/diagrams.
    Default is outside iCloud-managed folders: ~/ _inbox / antigravity
    """
    return os.path.expanduser(os.environ.get("ANTIGRAVITY_ROOT_DIR", "~/_inbox/antigravity"))


def project_root(project_name: str) -> str:
    return os.path.join(antigravity_root(), project_name)


def ensure_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


def assert_not_public_path(path: str) -> None:
    """
    Prevent scripts from writing into repo `public/**` by default.
    Set ALLOW_PUBLIC_WRITE=1 to override intentionally.
    """
    if _truthy(os.environ.get("ALLOW_PUBLIC_WRITE")):
        return
    normalized = path.replace("\\", "/")
    if "/public/" in normalized or normalized.startswith("public/") or normalized == "public":
        raise RuntimeError(f"Refusing to write into public/: {path} (set ALLOW_PUBLIC_WRITE=1 to override)")


def inbox_dir(project_name: str, *parts: str) -> str:
    path = os.path.join(project_root(project_name), *parts)
    assert_not_public_path(path)
    return ensure_dir(path)


def timestamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def unique_path(path: str) -> str:
    """
    If the target path already exists, append a timestamp before the extension.
    """
    assert_not_public_path(path)
    if not os.path.exists(path):
        return path
    base, ext = os.path.splitext(path)
    return f"{base}-{timestamp()}{ext}"

