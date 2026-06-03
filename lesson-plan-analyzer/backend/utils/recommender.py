"""
Rule + heuristic recommendation engine for lesson plans.

Inputs the classification output and surface text and produces a list of
actionable suggestions to improve instructional design.
"""
from __future__ import annotations
import re
from typing import Dict, List

from .classifier import BLOOM_LEVELS, STRATEGIES, BLOOM_VERBS
from .pdf_parser import split_sections


# Higher-order Bloom levels we encourage teachers to also include
HIGHER_ORDER = {"Apply", "Analyze", "Evaluate", "Create"}


def _has_section(sections: dict, primary_name: str) -> bool:
    """
    Robust context-aware section validator. 
    Checks synonymous variations of system text headers to verify actual content presence.
    """
    synonyms = {
        "objectives": ["objectives", "learning_objectives", "aims", "learning objectives"],
        "activities": ["activities", "teaching_activities", "methods", "teaching_methods", "strategies", "content outline"],
        "assessment": ["assessment", "evaluation", "assessment_strategy", "assessment strategy"]
    }
    
    target_keys = synonyms.get(primary_name, [primary_name])
    for key in target_keys:
        if key in sections and sections[key] and len(str(sections[key]).strip()) >= 15:
            return True
    return False


def _get_section_content(sections: dict, primary_name: str) -> str:
    """Safe extraction helper to collect text payloads from synonymous dictionary keys."""
    synonyms = {
        "objectives": ["objectives", "learning_objectives", "aims", "learning objectives"],
        "activities": ["activities", "teaching_activities", "methods", "teaching_methods", "strategies", "content outline"],
        "assessment": ["assessment", "evaluation", "assessment_strategy", "assessment strategy"]
    }
    
    target_keys = synonyms.get(primary_name, [primary_name])
    for key in target_keys:
        if key in sections and sections[key]:
            return str(sections[key]).strip()
    return ""


def generate_recommendations(*, text: str, bloom_level: str, teaching_strategy: str,
                             course_outcome: str = "", program_outcome: str = "",
                             subject: str = "") -> List[Dict]:
    """
    Returns a list of {category, severity, suggestion} dicts.
    """
    text_l = text.lower()
    sections = split_sections(text)
    recs: List[Dict] = []

    # 1. Cognitive level coverage
    if bloom_level in {"Remember", "Understand"}:
        recs.append({
            "category": "Cognitive level",
            "severity": "high",
            "suggestion": (
                f"The lesson is dominated by lower-order thinking ({bloom_level}). "
                f"Add at least one higher-order activity (Apply / Analyze / Evaluate / Create). "
                f"For example, include a problem-solving task, a comparative analysis, "
                f"or a small design challenge."
            ),
        })
    elif bloom_level == "Apply":
        recs.append({
            "category": "Cognitive level",
            "severity": "medium",
            "suggestion": (
                "Good use of application-level tasks. Push further by adding an "
                "Analyze/Evaluate component (e.g. compare two solutions, justify a "
                "design choice) to deepen learning."
            ),
        })
    else:
        recs.append({
            "category": "Cognitive level",
            "severity": "low",
            "suggestion": (
                f"Strong cognitive depth ({bloom_level}). Ensure prerequisite "
                "Remember/Understand objectives are explicitly listed for scaffolding."
            ),
        })

    # 2. Teaching strategy diversity (Enhanced with token regex bounds to eliminate substring overlap)
    cue_hits = {s: 0 for s in STRATEGIES}
    cue_patterns = {
        "Lecture-based": [r"\blecture\b", r"\bslides\b", r"\bexplain\b", r"\bpresentation\b"],
        "Inquiry-based": [r"\binquiry\b", r"\binvestigate\b", r"\bhypothesis\b", r"\bresearch\b"],
        "Activity-based": [r"\bactivity\b", r"\bhands-on\b", r"\bexercise\b", r"\bworksheet\b", r"\btask\b"],
        "Project-based": [r"\bproject\b", r"\bprototype\b", r"\bdeliverable\b", r"\bbuild\b"],
        "Discussion-based": [r"\bdiscussion\b", r"\bdebate\b", r"\bbrainstorm\b", r"\bpeer critique\b"],
        "Demonstration-based": [r"\bdemonstration\b", r"\bdemonstrate\b", r"\bshow how\b", r"\bwalkthrough\b"],
    }
    for s, patterns in cue_patterns.items():
        cue_hits[s] = sum(len(re.findall(p, text_l)) for p in patterns)
    distinct = sum(1 for v in cue_hits.values() if v > 0)

    if teaching_strategy == "Lecture-based" and distinct <= 1:
        recs.append({
            "category": "Teaching strategy",
            "severity": "high",
            "suggestion": (
                "The lesson appears to rely primarily on lecture. Blend in an "
                "active-learning component — e.g. think-pair-share, a short "
                "in-class activity, or a guided inquiry segment — to improve "
                "engagement and retention."
            ),
        })
    elif distinct < 2:
        recs.append({
            "category": "Teaching strategy",
            "severity": "medium",
            "suggestion": (
                f"Primary strategy is {teaching_strategy}. Adding a second "
                f"strategy (e.g. demonstration + activity, or lecture + discussion) "
                f"broadens learning styles supported."
            ),
        })
    else:
        recs.append({
            "category": "Teaching strategy",
            "severity": "low",
            "suggestion": (
                f"Good strategy mix detected (primary: {teaching_strategy}). "
                f"Document time allocation per strategy to keep pacing realistic."
            ),
        })

    # 3. CO / PO alignment
    has_co_marker = re.search(r"\b(co\d+|course outcome|course_outcomes)\b", text_l)
    if not course_outcome.strip() and not has_co_marker:
        recs.append({
            "category": "CO/PO alignment",
            "severity": "high",
            "suggestion": (
                "No Course Outcome (CO) mapping was provided. Tag this lesson to "
                "specific CO numbers (e.g. CO2, CO3) and indicate the level of "
                "attainment expected."
            ),
        })
        
    has_po_marker = re.search(r"\b(po\d+|program outcome|program_outcomes)\b", text_l)
    if not program_outcome.strip() and not has_po_marker:
        recs.append({
            "category": "CO/PO alignment",
            "severity": "medium",
            "suggestion": (
                "Program Outcomes (POs) are not mapped. Linking this lesson to "
                "POs (e.g. PO1 Engineering Knowledge, PO3 Design) makes "
                "outcome-based assessment auditable."
            ),
        })

    # 4. Section completeness (Utilizes context helper to evaluate synonyms accurately)
    missing = [s for s in ["objectives", "activities", "assessment"] if not _has_section(sections, s)]
    if missing:
        recs.append({
            "category": "Lesson structure",
            "severity": "high" if "objectives" in missing else "medium",
            "suggestion": (
                "The following sections are missing or thin: "
                + ", ".join(missing)
                + ". Add explicit Learning Objectives, Activities, and Assessment "
                f"items so the lesson plan is self-sufficient."
            ),
        })

    # 5. Action-verb specificity in objectives
    obj_text = _get_section_content(sections, "objectives")
    if obj_text:
        obj_l = obj_text.lower()
        verbs_seen = set()
        for level, vs in BLOOM_VERBS.items():
            for v in vs:
                if re.search(rf"\b{re.escape(v)}\b", obj_l):
                    verbs_seen.add(level)
        if not verbs_seen:
            recs.append({
                "category": "Learning objectives",
                "severity": "high",
                "suggestion": (
                    "Objectives do not contain measurable Bloom's-aligned action "
                    "verbs. Rewrite with verbs like 'analyze', 'design', 'evaluate' "
                    "instead of 'know' or 'understand'."
                ),
            })
        elif not (verbs_seen & HIGHER_ORDER):
            recs.append({
                "category": "Learning objectives",
                "severity": "medium",
                "suggestion": (
                    "Objectives only target lower-order thinking. Add at least one "
                    "objective targeting Apply, Analyze, Evaluate, or Create."
                ),
            })

    # 6. Assessment alignment
    assess_text = _get_section_content(sections, "assessment")
    if assess_text:
        if re.search(r"\b(mcq|multiple choice|recall|true/false|quiz|oral|verbal)\b", assess_text.lower()) \
           and bloom_level in {"Analyze", "Evaluate", "Create"}:
            recs.append({
                "category": "Assessment alignment",
                "severity": "medium",
                "suggestion": (
                    f"Assessment looks recall-oriented but the lesson targets "
                    f"{bloom_level}. Add open-ended, rubric-based questions or a "
                    f"short project to assess higher-order outcomes."
                ),
            })

    # 7. Topic relevance / freshness
    if subject and len(subject.strip()) > 0:
        clean_subject = subject.split('(')[0].strip().lower() # strips course code postfix blocks
        if clean_subject not in text_l:
            recs.append({
                "category": "Topic relevance",
                "severity": "low",
                "suggestion": (
                    f"The subject '{subject}' is not explicitly mentioned in the "
                    f"body of the plan. Reinforce vocabulary so students can "
                    f"connect the lesson to its course context."
                ),
            })

    return recs


def summarize_analysis(*, text: str, classification: Dict,
                       course_outcome: str = "", program_outcome: str = "") -> Dict:
    """Compact analysis bundle for the UI."""
    sections = split_sections(text)
    word_count = len(re.findall(r"\w+", text))
    sentence_count = max(1, len(re.findall(r"[.!?]+", text)))

    bloom_dist = classification.get("bloom", {}).get("scores", {})
    strategy_dist = classification.get("strategy", {}).get("scores", {})

    higher_order_share = sum(bloom_dist.get(l, 0.0) for l in HIGHER_ORDER)
    
    # Validates logical visibility mapping accurately for structural metrics tracking
    detected_keys = list(sections.keys())
    missing_sections = []
    for s in ["objectives", "activities", "assessment"]:
        if not _has_section(sections, s):
            missing_sections.append(s)

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "sections_detected": detected_keys,
        "missing_sections": missing_sections,
        "bloom_distribution": bloom_dist,
        "strategy_distribution": strategy_dist,
        "higher_order_thinking_share": round(higher_order_share, 4),
        "co_provided": bool(course_outcome.strip() or re.search(r"\b(co\d+|course outcome)\b", text.lower())),
        "po_provided": bool(program_outcome.strip() or re.search(r"\b(po\d+|program outcome)\b", text.lower())),
        "model_used": {
            "bloom": classification.get("bloom", {}).get("model", "keyword"),
            "strategy": classification.get("strategy", {}).get("model", "keyword"),
        },
    }