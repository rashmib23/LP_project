"""
Student performance routes.

Allows uploading individual records or a CSV bulk file, listing, and aggregate
analytics tied to a particular lesson plan or user-wide.
"""
import csv
import io
from collections import defaultdict
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.database import db, StudentPerformance, LessonPlan

performance_bp = Blueprint("performance", __name__)


@performance_bp.route("/", methods=["POST"])
@jwt_required()
def add_performance():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    try:
        score = float(data.get("score", 0))
        max_score = float(data.get("max_score", 100) or 100)
    except (TypeError, ValueError):
        return jsonify(error="score and max_score must be numbers"), 400

    lp_id = data.get("lesson_plan_id")
    if lp_id:
        if not LessonPlan.query.filter_by(id=lp_id, user_id=uid).first():
            return jsonify(error="Lesson plan not found"), 404

    rec = StudentPerformance(
        user_id=uid,
        lesson_plan_id=lp_id,
        student_name=(data.get("student_name") or "").strip(),
        roll_no=(data.get("roll_no") or "").strip(),
        assessment=(data.get("assessment") or "").strip(),
        score=score,
        max_score=max_score,
        remarks=(data.get("remarks") or "").strip(),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(performance=rec.to_dict()), 201


@performance_bp.route("/bulk", methods=["POST"])
@jwt_required()
def bulk_upload():
    """Upload a clean CSV file linked directly to a selected Lesson Plan dropdown option.

    Form fields:
       file            - the CSV data spreadsheet file (required)
       lesson_plan_id  - the target lesson ID parameter chosen from the UI dropdown (optional)
    """
    uid = int(get_jwt_identity())
    if "file" not in request.files:
        return jsonify(error="CSV file is required"), 400
    f = request.files["file"]

    raw = f.read()
    # Strip a UTF-8 BOM if Excel saved one — otherwise the first column header
    # ends up named "﻿student_name" and DictReader misses it.
    if raw[:3] == b"\xef\xbb\xbf":
        raw = raw[3:]
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        return jsonify(error="CSV must be UTF-8 encoded"), 400

    # Extract single lesson_plan_id sent dynamically from the frontend dropdown form field parameters
    form_lp_id = request.form.get("lesson_plan_id")
    lp_id = None

    if form_lp_id and form_lp_id.strip() != "":
        try:
            target_id = int(form_lp_id)
            # Secure database authorization context checks
            if LessonPlan.query.filter_by(id=target_id, user_id=uid).first():
                lp_id = target_id
            else:
                return jsonify(error="The selected lesson plan was not found or access is unauthorized"), 404
        except ValueError:
            return jsonify(error="Invalid lesson plan ID parameter provided"), 400

    reader = csv.DictReader(io.StringIO(content))
    created = 0
    errors = []
    
    for i, row in enumerate(reader, start=2):  # data rows start at line 2
        try:
            # All lines automatically attach directly to the dropdown value target lp_id
            rec = StudentPerformance(
                user_id=uid,
                lesson_plan_id=lp_id,
                student_name=(row.get("student_name") or "").strip(),
                roll_no=(row.get("roll_no") or "").strip(),
                assessment=(row.get("assessment") or "").strip(),
                score=float(row.get("score") or 0),
                max_score=float(row.get("max_score") or 100),
                remarks=(row.get("remarks") or "").strip(),
            )
            db.session.add(rec)
            created += 1
        except Exception as e:
            errors.append(f"Row {i}: {e}")
            
    db.session.commit()
    return jsonify(created=created, relinked=0, errors=errors)


@performance_bp.route("/", methods=["GET"])
@jwt_required()
def list_performance():
    uid = int(get_jwt_identity())
    lp_id = request.args.get("lesson_plan_id", type=int)
    q = StudentPerformance.query.filter_by(user_id=uid)
    if lp_id:
        q = q.filter_by(lesson_plan_id=lp_id)
    items = q.order_by(StudentPerformance.created_at.desc()).all()
    return jsonify(records=[r.to_dict() for r in items])


@performance_bp.route("/<int:rec_id>", methods=["DELETE"])
@jwt_required()
def delete_record(rec_id):
    uid = int(get_jwt_identity())
    r = StudentPerformance.query.filter_by(id=rec_id, user_id=uid).first()
    if not r:
        return jsonify(error="Record not found"), 404
    db.session.delete(r)
    db.session.commit()
    return jsonify(message="Deleted")


@performance_bp.route("/analytics", methods=["GET"])
@jwt_required()
def analytics():
    """Aggregate stats — overall and per-lesson."""
    uid = int(get_jwt_identity())
    items = StudentPerformance.query.filter_by(user_id=uid).all()
    if not items:
        return jsonify(overall={}, by_lesson=[])

    pcts = [(r.score / r.max_score * 100.0) if r.max_score else 0.0 for r in items]
    avg = sum(pcts) / len(pcts)
    overall = {
        "count": len(items),
        "average_percentage": round(avg, 2),
        "max_percentage": round(max(pcts), 2),
        "min_percentage": round(min(pcts), 2),
        "pass_rate": round(sum(1 for p in pcts if p >= 40) / len(pcts) * 100.0, 2),
    }

    grouped = defaultdict(list)
    for r in items:
        grouped[r.lesson_plan_id or 0].append(r)

    by_lesson = []
    for lp_id, recs in grouped.items():
        ps = [(r.score / r.max_score * 100.0) if r.max_score else 0.0 for r in recs]
        title = "Unlinked"
        bloom = strategy = None
        if lp_id:
            lp = LessonPlan.query.filter_by(id=lp_id, user_id=uid).first()
            if lp:
                title = lp.title
                bloom = lp.bloom_level
                strategy = lp.teaching_strategy
        by_lesson.append({
            "lesson_plan_id": lp_id or None,
            "title": title,
            "bloom_level": bloom,
            "teaching_strategy": strategy,
            "count": len(recs),
            "average_percentage": round(sum(ps) / len(ps), 2),
            "pass_rate": round(sum(1 for p in ps if p >= 40) / len(ps) * 100.0, 2),
        })

    return jsonify(overall=overall, by_lesson=by_lesson)