"""
Train the Bloom-level and Teaching-strategy classifiers.

Architecture: TF-IDF features -> 2-layer MLP (PyTorch) with ReLU + Dropout.

Run:
    cd backend
    python -m train.train_models

Artifacts produced under train/artifacts/:
  - bloom_model.pkl      (vectorizer + state_dict + labels)
  - strategy_model.pkl
"""
from __future__ import annotations
import os
import pickle
import random
from typing import List, Tuple

import numpy as np
import torch
import torch.nn as nn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split

from .sample_data import generate_corpus

ART_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ART_DIR, exist_ok=True)

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)


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


def _train_one(texts: List[str], labels: List[str], hidden=128, epochs=40, lr=1e-3) -> dict:
    label_set = sorted(set(labels))
    label_to_idx = {l: i for i, l in enumerate(label_set)}
    y = np.array([label_to_idx[l] for l in labels], dtype=np.int64)

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=4000,
                                  sublinear_tf=True)
    X = vectorizer.fit_transform(texts).toarray().astype("float32")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model = MLP(X.shape[1], hidden, len(label_set))
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    crit = nn.CrossEntropyLoss()

    Xt = torch.from_numpy(X_train)
    yt = torch.from_numpy(y_train)
    Xv = torch.from_numpy(X_val)
    yv = torch.from_numpy(y_val)

    best_state = None
    best_acc = 0.0
    for epoch in range(epochs):
        model.train()
        opt.zero_grad()
        logits = model(Xt)
        loss = crit(logits, yt)
        loss.backward()
        opt.step()

        model.eval()
        with torch.no_grad():
            v_pred = model(Xv).argmax(dim=1)
            acc = (v_pred == yv).float().mean().item()
        if acc > best_acc:
            best_acc = acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        if (epoch + 1) % 10 == 0:
            print(f"  epoch {epoch+1:>3d}  loss={loss.item():.4f}  val_acc={acc:.4f}")

    print(f"  best val_acc = {best_acc:.4f}  ({len(label_set)} labels)")
    return {
        "vectorizer": vectorizer,
        "state_dict": best_state,
        "labels": label_set,
        "hidden": hidden,
        "val_accuracy": best_acc,
    }


def main():
    print("Generating synthetic lesson plan corpus ...")
    rows: List[Tuple[str, str, str]] = generate_corpus(samples_per_label=80)
    texts = [r[0] for r in rows]
    bloom_labels = [r[1] for r in rows]
    strat_labels = [r[2] for r in rows]
    print(f"  total samples: {len(texts)}")

    print("\nTraining Bloom's level classifier ...")
    bloom_blob = _train_one(texts, bloom_labels)
    with open(os.path.join(ART_DIR, "bloom_model.pkl"), "wb") as fh:
        pickle.dump(bloom_blob, fh)
    print("  saved -> train/artifacts/bloom_model.pkl")

    print("\nTraining Teaching strategy classifier ...")
    strat_blob = _train_one(texts, strat_labels)
    with open(os.path.join(ART_DIR, "strategy_model.pkl"), "wb") as fh:
        pickle.dump(strat_blob, fh)
    print("  saved -> train/artifacts/strategy_model.pkl")

    print("\nDone.")


if __name__ == "__main__":
    main()
