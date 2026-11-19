import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

UPLOAD_DIR = Path(
    os.environ.get("UPLOAD_FOLDER", str(BASE_DIR / "uploads"))
)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class Config:

    SECRET_KEY = os.environ.get(
        "SECRET_KEY",
        "nexbot-development-secret-key"
    )

    DATABASE_URL = os.environ.get("DATABASE_URL")

    if DATABASE_URL:
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace(
                "postgres://",
                "postgresql://",
                1
            )

        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        SQLALCHEMY_DATABASE_URI = (
            f"sqlite:///{(INSTANCE_DIR / 'nexbot.db').as_posix()}"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    ALLOWED_EXTENSIONS = {"pdf"}

    UPLOAD_FOLDER = str(UPLOAD_DIR)

    DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() == "true"

    JSON_SORT_KEYS = False