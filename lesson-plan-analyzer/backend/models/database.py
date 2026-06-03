"""
SQLAlchemy ORM models for the Lesson Plan Analyzer.
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), default="teacher")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    lessons = db.relationship("LessonPlan", backref="user", lazy=True, cascade="all, delete-orphan")
    performances = db.relationship("StudentPerformance", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LessonPlan(db.Model):
    __tablename__ = "lesson_plans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(120))
    course_outcome = db.Column(db.Text)        # CO mapping
    program_outcome = db.Column(db.Text)       # PO mapping
    filename = db.Column(db.String(255))       # original uploaded filename
    stored_path = db.Column(db.String(500))    # path on server
    raw_text = db.Column(db.Text)              # extracted text

    # Classification results
    bloom_level = db.Column(db.String(32))
    bloom_confidence = db.Column(db.Float)
    teaching_strategy = db.Column(db.String(64))
    strategy_confidence = db.Column(db.Float)

    # Recommendations + analysis (JSON-as-text)
    recommendations = db.Column(db.Text)
    analysis_summary = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, include_text=False):
        import json
        try:
            recs = json.loads(self.recommendations) if self.recommendations else []
        except Exception:
            recs = []
        try:
            analysis = json.loads(self.analysis_summary) if self.analysis_summary else {}
        except Exception:
            analysis = {}
        out = {
            "id": self.id,
            "title": self.title,
            "subject": self.subject,
            "course_outcome": self.course_outcome,
            "program_outcome": self.program_outcome,
            "filename": self.filename,
            "bloom_level": self.bloom_level,
            "bloom_confidence": self.bloom_confidence,
            "teaching_strategy": self.teaching_strategy,
            "strategy_confidence": self.strategy_confidence,
            "recommendations": recs,
            "analysis": analysis,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_text:
            out["raw_text"] = self.raw_text
        return out


class StudentPerformance(db.Model):
    __tablename__ = "student_performance"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    lesson_plan_id = db.Column(db.Integer, db.ForeignKey("lesson_plans.id"), nullable=True)

    student_name = db.Column(db.String(120))
    roll_no = db.Column(db.String(64))
    assessment = db.Column(db.String(120))   # e.g. "Quiz 1", "Mid-term"
    score = db.Column(db.Float)
    max_score = db.Column(db.Float, default=100.0)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        pct = (self.score / self.max_score * 100.0) if self.max_score else 0.0
        return {
            "id": self.id,
            "lesson_plan_id": self.lesson_plan_id,
            "student_name": self.student_name,
            "roll_no": self.roll_no,
            "assessment": self.assessment,
            "score": self.score,
            "max_score": self.max_score,
            "percentage": round(pct, 2),
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
