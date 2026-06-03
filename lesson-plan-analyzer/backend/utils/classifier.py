"""
Lesson plan classifier.

Two heads:
  1. Bloom's Taxonomy level: Remember | Understand | Apply | Analyze | Evaluate | Create
  2. Teaching strategy:      Lecture | Inquiry | Activity | Project | Discussion | Demonstration

Architecture:
  TF-IDF vectorizer  ->  PyTorch MLP (deep learning model)  ->  softmax probs

If the trained artifacts under train/artifacts/ are missing, falls back to a
verb / keyword-based classifier so the system still works out-of-the-box.

Bloom's verb taxonomy reference: Anderson & Krathwohl (2001).
"""
from __future__ import annotations
import os
import pickle
import re
from typing import Dict, List, Tuple

import numpy as np

# ----------------------- Label sets -----------------------

BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

STRATEGIES = ["Lecture-based", "Inquiry-based", "Activity-based",
              "Project-based", "Discussion-based", "Demonstration-based"]

# Anderson & Krathwohl revised Bloom's verb cues
BLOOM_VERBS: Dict[str, List[str]] = {
    "Remember":   ["define", "list", "recall", "name", "identify", "state",
                   "describe", "recognize", "label", "memorize", "repeat",
                   "select", "match", "outline", "reproduce"],
    "Understand": ["explain", "summarize", "interpret", "classify", "compare",
                   "discuss", "paraphrase", "infer", "predict", "translate",
                   "exemplify", "illustrate", "report", "review"],
    "Apply":      ["apply", "use", "demonstrate", "implement", "execute",
                   "solve", "operate", "compute", "construct", "perform",
                   "practice", "calculate", "modify", "show"],
    "Analyze":    ["analyze", "differentiate", "organize", "compare",
                   "contrast", "examine", "investigate", "categorize",
                   "distinguish", "deconstruct", "structure", "attribute"],
    "Evaluate":   ["evaluate", "judge", "critique", "assess", "appraise",
                   "argue", "defend", "select", "support", "value", "test",
                   "monitor", "validate"],
    "Create":     ["create", "design", "develop", "compose", "construct",
                   "formulate", "generate", "plan", "produce", "invent",
                   "devise", "build", "synthesize", "assemble"],
}

STRATEGY_CUES: Dict[str, List[str]] = {
    "Lecture-based":       ["lecture", "explain", "presentation", "slides",
                            "introduce the topic", "verbal instruction",
                            "blackboard", "whiteboard", "notes"],
    "Inquiry-based":       ["inquiry", "investigate", "questioning",
                            "hypothesis", "explore", "research", "ask questions",
                            "find out", "discover"],
    "Activity-based":      ["activity", "hands-on", "exercise", "worksheet",
                            "task", "practice", "drill", "simulation",
                            "role-play", "experiment"],
    "Project-based":       ["project", "build", "design and develop", "team project",
                            "deliverable", "prototype", "case study",
                            "long-term", "milestone"],
    "Discussion-based":    ["discussion", "debate", "dialogue", "think-pair-share",
                            "brainstorm", "group discussion", "seminar"],
    "Demonstration-based": ["demonstration", "demonstrate", "show how",
                            "modeling", "live example", "walkthrough",
                            "tutorial"],
}


# ----------------------- Deep learning model -----------------------

# We import torch lazily so that environments without GPU/torch can still
# fall back to keyword classification (e.g. quick demos).
def _torch_available():
    try:
        import torch  # noqa: F401
        return True
    except Exception:
        return False


class TextMLP:
    """
    Wrapper around a PyTorch MLP classifier and its TF-IDF vectorizer.

    Saved artifacts are a pickled dict: {"vectorizer": ..., "state_dict": ...,
    "labels": [...], "hidden": int}.
    """

    def __init__(self, vectorizer, state_dict, labels, hidden=128):
        import torch
        import torch.nn as nn

        self.labels = labels
        self.vectorizer = vectorizer
        in_dim = len(vectorizer.get_feature_names_out())

        class MLP(nn.Module):
            def __init__(self, in_dim, hidden, out_dim):
                super().__init__()
                self.net = nn.Sequential(
                    nn.Linear(in_dim, hidden),
                    nn.ReLU(),
                    nn.Dropout(0.3),
                    nn.Linear(hidden, hidden // 2),
                    nn.ReLU(),
                    nn.Dropout(0.2),
                    nn.Linear(hidden // 2, out_dim),
                )

            def forward(self, x):
                return self.net(x)

        self.model = MLP(in_dim, hidden, len(labels))
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self._torch = torch

    def predict(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        torch = self._torch
        x = self.vectorizer.transform([text]).toarray().astype("float32")
        with torch.no_grad():
            logits = self.model(torch.from_numpy(x))
            probs = torch.softmax(logits, dim=1).numpy()[0]
        idx = int(np.argmax(probs))
        per_label = {self.labels[i]: float(probs[i]) for i in range(len(self.labels))}
        return self.labels[idx], float(probs[idx]), per_label


def _load(path: str):
    if not os.path.exists(path) or not _torch_available():
        return None
    try:
        with open(path, "rb") as fh:
            blob = pickle.load(fh)
        return TextMLP(blob["vectorizer"], blob["state_dict"], blob["labels"],
                       blob.get("hidden", 128))
    except Exception:
        return None


_BLOOM_MODEL: TextMLP | None = None
_STRATEGY_MODEL: TextMLP | None = None


def _ensure_loaded():
    global _BLOOM_MODEL, _STRATEGY_MODEL
    if _BLOOM_MODEL is None or _STRATEGY_MODEL is None:
        # Lazy import config (so this module is import-safe outside Flask)
        from config import Config
        if _BLOOM_MODEL is None:
            _BLOOM_MODEL = _load(Config.BLOOM_MODEL_PATH)
        if _STRATEGY_MODEL is None:
            _STRATEGY_MODEL = _load(Config.STRATEGY_MODEL_PATH)


# ----------------------- Keyword fallback -----------------------

def _keyword_score(text: str, cues: Dict[str, List[str]]) -> Tuple[str, float, Dict[str, float]]:
    text_l = text.lower()
    counts = {label: 0 for label in cues}
    for label, words in cues.items():
        for w in words:
            counts[label] += len(re.findall(rf"\b{re.escape(w)}\b", text_l))
    total = sum(counts.values())
    if total == 0:
        # Return uniform with low confidence
        per = {l: 1.0 / len(cues) for l in cues}
        # default to a sensible neutral pick
        first = list(cues.keys())[1]
        return first, 0.2, per
    probs = {l: c / total for l, c in counts.items()}
    label = max(probs.items(), key=lambda kv: kv[1])[0]
    return label, probs[label], probs


# ----------------------- Public API -----------------------

def classify_lesson_plan(text: str) -> Dict:
    """
    Returns:
      {
        "bloom":    {"label": "...", "confidence": 0.78, "scores": {...}, "model": "deep|keyword"},
        "strategy": {"label": "...", "confidence": 0.65, "scores": {...}, "model": "deep|keyword"},
      }
    """
    _ensure_loaded()
    out = {}

    if _BLOOM_MODEL is not None:
        label, conf, scores = _BLOOM_MODEL.predict(text)
        out["bloom"] = {"label": label, "confidence": round(conf, 4),
                        "scores": {k: round(v, 4) for k, v in scores.items()},
                        "model": "deep"}
    else:
        label, conf, scores = _keyword_score(text, BLOOM_VERBS)
        out["bloom"] = {"label": label, "confidence": round(conf, 4),
                        "scores": {k: round(v, 4) for k, v in scores.items()},
                        "model": "keyword"}

    if _STRATEGY_MODEL is not None:
        label, conf, scores = _STRATEGY_MODEL.predict(text)
        out["strategy"] = {"label": label, "confidence": round(conf, 4),
                           "scores": {k: round(v, 4) for k, v in scores.items()},
                           "model": "deep"}
    else:
        label, conf, scores = _keyword_score(text, STRATEGY_CUES)
        out["strategy"] = {"label": label, "confidence": round(conf, 4),
                           "scores": {k: round(v, 4) for k, v in scores.items()},
                           "model": "keyword"}
    return out
