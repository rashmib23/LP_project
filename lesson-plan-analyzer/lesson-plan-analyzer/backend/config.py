"""
Configuration for the Lesson Plan Analyzer backend.
"""
import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-change-me-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # SQLite DB stored under instance/
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "instance", "app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}

    # Model artifact paths
    MODEL_DIR = os.path.join(BASE_DIR, "train", "artifacts")
    BLOOM_MODEL_PATH = os.path.join(MODEL_DIR, "bloom_model.pkl")
    STRATEGY_MODEL_PATH = os.path.join(MODEL_DIR, "strategy_model.pkl")
