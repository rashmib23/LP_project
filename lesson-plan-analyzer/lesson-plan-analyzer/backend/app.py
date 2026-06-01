"""
Flask application entry point for the Lesson Plan Analyzer.

Runs the API server and exposes the following blueprints:
  - auth        -> /api/auth/*
  - lessons     -> /api/lessons/*
  - performance -> /api/performance/*
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models.database import db
from routes.auth import auth_bp
from routes.lessons import lessons_bp
from routes.performance import performance_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure required folders exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(os.path.join(app.root_path, "instance"), exist_ok=True)
    os.makedirs(app.config["MODEL_DIR"], exist_ok=True)

    # Extensions
    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(lessons_bp, url_prefix="/api/lessons")
    app.register_blueprint(performance_bp, url_prefix="/api/performance")

    @app.route("/api/health")
    def health():
        return jsonify(status="ok", service="lesson-plan-analyzer")

    @app.errorhandler(413)
    def too_large(_):
        return jsonify(error="File too large. Max 16 MB."), 413

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    # NOTE: the auto-reloader is OFF by default.
    # Flask's debug reloader watches every imported module; with PyTorch / OneDrive
    # in the picture, file-timestamp churn triggers it constantly and kills
    # in-flight requests (the upload "Cannot reach the backend" symptom).
    # Set FLASK_USE_RELOADER=1 if you really want auto-restart on code changes.
    debug = os.environ.get("FLASK_DEBUG", "1") != "0"
    use_reloader = os.environ.get("FLASK_USE_RELOADER", "0") == "1"
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=debug,
        use_reloader=use_reloader,
    )
