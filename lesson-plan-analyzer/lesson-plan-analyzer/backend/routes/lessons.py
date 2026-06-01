"""
Lesson plan upload, analysis, listing, and detail routes.
"""
import os
import json
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from models.database import db, LessonPlan, StudentPerformance
from utils.pdf_parser import extract_text_from_file
from utils.classifier import classify_lesson_plan
from utils.recommender import generate_recommendations, summarize_analysis

lessons_bp = Blueprint("lessons", __name__)


def _allowed(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_EXTENSIONS"]


@lessons_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_lesson():
    """Accept a multipart upload, extract text, run DL classification, store result."""
    uid = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify(error="No file part in request"), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify(error="No file selected"), 400
    if not _allowed(f.filename):
        return jsonify(
            error=f"Unsupported file type. Allowed: {sorted(current_app.config['ALLOWED_EXTENSIONS'])}"
        ), 400

    title = (request.form.get("title") or os.path.splitext(f.filename)[0]).strip()
    subject = (request.form.get("subject") or "").strip()
    co = (request.form.get("course_outcome") or "").strip()
    po = (request.form.get("program_outcome") or "").strip()

    safe_name = secure_filename(f.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_name)
    f.save(save_path)

    # 1. Extract text
    try:
        raw_text = extract_text_from_file(save_path)
    except Exception as e:
        return jsonify(error=f"Failed to extract text: {e}"), 500

    if not raw_text or len(raw_text.strip()) < 30:
        return jsonify(error="Could not extract meaningful text from the file."), 422

    # 2. Run DL classifier (Bloom's level + Teaching strategy)
    classification = classify_lesson_plan(raw_text)

    # 3. Generate recommendations + analysis
    recs = generate_recommendations(
        text=raw_text,
        bloom_level=classification["bloom"]["label"],
        teaching_strategy=classification["strategy"]["label"],
        course_outcome=co,
        program_outcome=po,
        subject=subject,
    )
    analysis = summarize_analysis(
        text=raw_text,
        classification=classification,
        course_outcome=co,
        program_outcome=po,
    )

    lp = LessonPlan(
        user_id=uid,
        title=title,
        subject=subject,
        course_outcome=co,
        program_outcome=po,
        filename=safe_name,
        stored_path=save_path,
        raw_text=raw_text[:60000],   # cap stored text
        bloom_level=classification["bloom"]["label"],
        bloom_confidence=classification["bloom"]["confidence"],
        teaching_strategy=classification["strategy"]["label"],
        strategy_confidence=classification["strategy"]["confidence"],
        recommendations=json.dumps(recs),
        analysis_summary=json.dumps(analysis),
    )
    db.session.add(lp)
    db.session.commit()

    return jsonify(lesson=lp.to_dict()), 201


@lessons_bp.route("/", methods=["GET"])
@jwt_required()
def list_lessons():
    uid = int(get_jwt_identity())
    items = LessonPlan.query.filter_by(user_id=uid).order_by(LessonPlan.created_at.desc()).all()
    return jsonify(lessons=[lp.to_dict() for lp in items])


@lessons_bp.route("/<int:lesson_id>", methods=["GET"])
@jwt_required()
def get_lesson(lesson_id):
    uid = int(get_jwt_identity())
    lp = LessonPlan.query.filter_by(id=lesson_id, user_id=uid).first()
    if not lp:
        return jsonify(error="Lesson plan not found"), 404
    # Attach related performance records
    perf = StudentPerformance.query.filter_by(user_id=uid, lesson_plan_id=lesson_id).all()
    data = lp.to_dict(include_text=True)
    data["performance"] = [p.to_dict() for p in perf]
    return jsonify(lesson=data)


@lessons_bp.route("/<int:lesson_id>", methods=["DELETE"])
@jwt_required()
def delete_lesson(lesson_id):
    uid = int(get_jwt_identity())
    lp = LessonPlan.query.filter_by(id=lesson_id, user_id=uid).first()
    if not lp:
        return jsonify(error="Lesson plan not found"), 404
    # Remove file
    try:
        if lp.stored_path and os.path.exists(lp.stored_path):
            os.remove(lp.stored_path)
    except Exception:
        pass
    db.session.delete(lp)
    db.session.commit()
    return jsonify(message="Deleted")


@lessons_bp.route("/analyze-text", methods=["POST"])
@jwt_required()
def analyze_text():
    """Quick endpoint to classify a pasted lesson plan text without saving."""
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    if len(text) < 30:
        return jsonify(error="Please provide at least 30 characters of lesson plan text."), 400
    classification = classify_lesson_plan(text)
    recs = generate_recommendations(
        text=text,
        bloom_level=classification["bloom"]["label"],
        teaching_strategy=classification["strategy"]["label"],
        course_outcome=data.get("course_outcome", ""),
        program_outcome=data.get("program_outcome", ""),
        subject=data.get("subject", ""),
    )
    analysis = summarize_analysis(text=text, classification=classification,
                                  course_outcome=data.get("course_outcome", ""),
                                  program_outcome=data.get("program_outcome", ""))
    return jsonify(classification=classification, recommendations=recs, analysis=analysis)
