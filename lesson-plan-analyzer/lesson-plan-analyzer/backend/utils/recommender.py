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


def _has_section(sections: dict, name: str) -> bool:
    return bool(sections.get(name) and len(sections[name].strip()) >= 10)


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
                "For example, include a problem-solving task, a comparative analysis, "
                "or a small design challenge."
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

    # 2. Teaching strategy diversity
    cue_hits = {s: 0 for s in STRATEGIES}
    cue_terms = {
        "Lecture-based": ["lecture", "slides", "explain"],
        "Inquiry-based": ["inquiry", "investigate", "hypothesis"],
        "Activity-based": ["activity", "hands-on", "exercise"],
        "Project-based": ["project", "prototype", "deliverable"],
        "Discussion-based": ["discussion", "debate", "brainstorm"],
        "Demonstration-based": ["demonstration", "demonstrate", "show how"],
    }
    for s, words in cue_terms.items():
        cue_hits[s] = sum(text_l.count(w) for w in words)
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
                "strategy (e.g. demonstration + activity, or lecture + discussion) "
                "broadens learning styles supported."
            ),
        })
    else:
        recs.append({
            "category": "Teaching strategy",
            "severity": "low",
            "suggestion": (
                f"Good strategy mix detected (primary: {teaching_strategy}). "
                "Document time allocation per strategy to keep pacing realistic."
            ),
        })

    # 3. CO / PO alignment
    if not course_outcome.strip() and not re.search(r"\b(co\d+|course outcome)\b", text_l):
        recs.append({
            "category": "CO/PO alignment",
            "severity": "high",
            "suggestion": (
                "No Course Outcome (CO) mapping was provided. Tag this lesson to "
                "specific CO numbers (e.g. CO2, CO3) and indicate the level of "
                "attainment expected."
            ),
        })
    if not program_outcome.strip() and not re.search(r"\b(po\d+|program outcome)\b", text_l):
        recs.append({
            "category": "CO/PO alignment",
            "severity": "medium",
            "suggestion": (
                "Program Outcomes (POs) are not mapped. Linking this lesson to "
                "POs (e.g. PO1 Engineering Knowledge, PO3 Design) makes "
                "outcome-based assessment auditable."
            ),
        })

    # 4. Section completeness
    missing = [s for s in ["objectives", "activities", "assessment"] if not _has_section(sections, s)]
    if missing:
        recs.append({
            "category": "Lesson structure",
            "severity": "high" if "objectives" in missing else "medium",
            "suggestion": (
                "The following sections are missing or thin: "
                + ", ".join(missing)
                + ". Add explicit Learning Objectives, Activities, and Assessment "
                "items so the lesson plan is self-sufficient."
            ),
        })

    # 5. Action-verb specificity in objectives
    obj_text = sections.get("objectives", "") or ""
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
    assess_text = sections.get("assessment", "") or ""
    if assess_text:
        if re.search(r"\b(mcq|multiple choice|recall|true/false)\b", assess_text.lower()) \
           and bloom_level in {"Analyze", "Evaluate", "Create"}:
            recs.append({
                "category": "Assessment alignment",
                "severity": "medium",
                "suggestion": (
                    f"Assessment looks recall-oriented but the lesson targets "
                    f"{bloom_level}. Add open-ended, rubric-based questions or a "
                    "short project to assess higher-order outcomes."
                ),
            })

    # 7. Topic relevance / freshness
    if subject and len(subject) > 0:
        if subject.lower() not in text_l:
            recs.append({
                "category": "Topic relevance",
                "severity": "low",
                "suggestion": (
                    f"The subject '{subject}' is not explicitly mentioned in the "
                    "body of the plan. Reinforce vocabulary so students can "
                    "connect the lesson to its course context."
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

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "sections_detected": list(sections.keys()),
        "missing_sections": [s for s in ["objectives", "activities", "assessment", "outcomes"]
                              if s not in sections],
        "bloom_distribution": bloom_dist,
        "strategy_distribution": strategy_dist,
        "higher_order_thinking_share": round(higher_order_share, 4),
        "co_provided": bool(course_outcome.strip()),
        "po_provided": bool(program_outcome.strip()),
        "model_used": {
            "bloom": classification.get("bloom", {}).get("model", "keyword"),
            "strategy": classification.get("strategy", {}).get("model", "keyword"),
        },
    }
