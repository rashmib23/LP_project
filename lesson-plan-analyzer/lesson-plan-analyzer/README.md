# Lesson Plan Analyzer

A full-stack, AI-powered web application that helps teachers improve their
instructional design. Teachers upload a lesson plan (PDF / DOCX / TXT) and the
system automatically:

1. Extracts the text from the document.
2. Classifies it against **Bloom's Taxonomy** (cognitive level) and the
   **teaching strategy** used.
3. Generates **actionable recommendations** to strengthen the plan.
4. Correlates the lesson's classified attributes with **student performance
   data** so teachers can see how their teaching design impacts learning
   outcomes.

The project combines deep-learning text classification, classical NLP, a
rule-based recommendation engine, and an interactive React dashboard.

---

## Project Structure

```
lesson-plan-analyzer/
├── backend/        # Flask API + PyTorch deep-learning classifiers
│   ├── app.py
│   ├── config.py
│   ├── models/             # SQLAlchemy models (User, LessonPlan, Performance)
│   ├── routes/             # auth, lessons, performance endpoints
│   ├── utils/              # PDF parsing, classifier, recommender
│   ├── train/              # Synthetic data + model training pipeline
│   │   └── artifacts/      # Saved bloom_model.pkl, strategy_model.pkl
│   ├── uploads/            # User-uploaded lesson plans
│   └── requirements.txt
├── frontend/       # React (CRA) UI
│   ├── src/
│   │   ├── api.js
│   │   ├── context/AuthContext.js
│   │   └── index.js
│   └── package.json
├── samples/                # Sample CSV for bulk performance import
└── README.md
```

---

## Key Features

- **Authentication** — register, login, and JWT-protected routes via
  Flask-JWT-Extended.
- **Document upload & extraction** — accepts PDF, DOCX, and TXT; uses
  `pdfplumber` with a `PyPDF2` fallback for robust text extraction.
- **Two deep-learning classifiers** (TF-IDF + PyTorch MLP):
  - **Bloom's level:** `Remember | Understand | Apply | Analyze | Evaluate | Create`
  - **Teaching strategy:** `Lecture | Inquiry | Activity | Project | Discussion | Demonstration`
  - Falls back to a Bloom-verb / strategy-cue **keyword classifier** when no
    trained artifacts are present, so the prototype works out of the box.
- **Recommendation engine** — rule-based logic over classifier output that
  inspects cognitive level, strategy diversity, CO/PO alignment, section
  completeness, objective verbs, and assessment alignment.
- **Student performance module** — single-record entry, CSV bulk import, and
  analytics charts that link outcomes to the lesson's classified attributes.
- **Lesson history** — every analyzed plan is stored per user with full
  results retained for later review.

---

## Tech Stack

### Backend (Python / Flask)
- **Flask 3.0** — REST API framework
- **Flask-SQLAlchemy 3.1** — ORM
- **Flask-JWT-Extended 4.6** — JWT authentication
- **Flask-CORS 4.0** — cross-origin handling
- **SQLite** — file-based database (`backend/instance/app.db`)
- **Werkzeug 3.0** — WSGI utilities and password hashing
- **python-dotenv** — environment configuration
- **PyPDF2 3.0** + **pdfplumber 0.10** — PDF text extraction (with fallback)

### Frontend (JavaScript / React)
- **React 18** — UI library
- **react-router-dom 6** — client-side routing
- **axios** — HTTP client for the backend API
- **recharts** — interactive analytics and performance charts
- **react-scripts (CRA 5)** — build / dev tooling

### Database
- **SQLite** — lightweight, zero-config storage for users, lesson plans, and
  performance records.

---

## AI / ML Components

The project uses a hybrid AI pipeline that combines deep learning, classical
machine learning, and rule-based reasoning.

### 1. Deep-Learning Classifiers (PyTorch)
- **Framework:** **PyTorch 2.1**
- **Architecture:** A **3-layer Multi-Layer Perceptron (MLP)** with shape
  `input → 128 → 64 → num_classes`, using **ReLU activations** and **Dropout**
  for regularization.
- **Optimizer:** **Adam**
- **Loss:** Cross-entropy
- **Two independent heads** (one per task) trained on the same input text:
  - Bloom's Taxonomy classifier (6 classes)
  - Teaching strategy classifier (6 classes)

### 2. Feature Extraction (scikit-learn)
- **scikit-learn 1.3** is used to convert raw lesson-plan text into numeric
  features via a **TF-IDF vectorizer** with **1–2 gram** tokens, which is
  then fed into the PyTorch MLP.

### 3. Natural Language Processing
- **NLTK 3.8** — text preprocessing, tokenization, and Bloom-verb keyword
  matching.
- **NumPy** + **pandas** — data manipulation, training-data assembly, and
  performance analytics.

### 4. Optional Transformer Support
- **Hugging Face transformers 4.36** is included in `requirements.txt` so
  future iterations can swap in transformer-based embeddings (e.g. BERT) for
  richer text representations without restructuring the pipeline.

### 5. Rule-Based Fallback Classifier
- When trained model artifacts (`bloom_model.pkl`, `strategy_model.pkl`) are
  not present, the system uses a **keyword/verb-cue classifier** that maps
  Bloom verbs and strategy cues onto labels. This guarantees the full UX
  works on a fresh clone without training.

### 6. Recommendation Engine
- A **rule-based engine** layered on top of the classifier outputs. It
  evaluates cognitive level distribution, strategy diversity, section
  completeness (objectives, activities, assessment), CO/PO alignment, and
  verb alignment to produce concrete improvement suggestions.

### 7. Synthetic Training Corpus
- `train/sample_data.py` programmatically generates labeled examples that
  mix Bloom-verb templates with strategy templates so the MLP learns to
  discriminate both axes. It is designed to be replaced with a real labeled
  corpus by swapping the loader function — no other code changes required.

---

## End-to-End Architecture

```
              +-----------+        +----------------+
PDF / DOCX -> | Extractor | -----> |  Classifier    | --+
              +-----------+        |  TF-IDF + MLP  |   |
                                   +----------------+   |
                                                        v
                                             +---------------------+
                                             | Recommendation      |
                                             | engine (rules over  |
                                             | classifier output + |
                                             | section heuristics) |
                                             +---------------------+
                                                        |
                                                        v
                                             {bloom, strategy, recs,
                                              analysis, distributions}
                                                        |
                                                        v
                                             SQLite (per user) ---->  React UI
```

---

## How to Run the Project

Follow these steps end-to-end to get the application running locally on your
machine.

### Prerequisites

Make sure the following are installed on your system:

- **Python 3.10+** — `python --version`
- **Node.js 16+** and **npm 8+** — `node -v` / `npm -v`
- **Git** (optional, only if cloning) — `git --version`
- A modern browser (Chrome, Edge, Firefox)

You will need **two terminal windows open at the same time** — one for the
backend, one for the frontend.

### Step 1 — Get the Code

```bash
cd lesson-plan-analyzer
```

(Or simply open the project folder in your IDE / terminal if you already have
it locally.)

### Step 2 — Run the Backend (Terminal 1)

#### 2.1 Create and activate a virtual environment

```bash
cd backend
python -m venv .venv
```

Activate it:

- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
- **Windows (CMD):**        `.venv\Scripts\activate.bat`
- **macOS / Linux:**        `source .venv/bin/activate`

#### 2.2 Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, PyTorch, scikit-learn, NLTK, pdfplumber, PyPDF2, and the
rest of the backend stack.

#### 2.3 (Optional but recommended) Train the deep-learning models

```bash
python -m train.train_models
```

This generates the trained artifacts:

```
backend/train/artifacts/bloom_model.pkl
backend/train/artifacts/strategy_model.pkl
```

If you skip this step, the API automatically falls back to a keyword/verb-cue
classifier so the full UI still works.

#### 2.4 Start the Flask API

```bash
python app.py
```

You should see the server start on `http://localhost:5000`. Verify it with a
health check in your browser or via curl:

```
GET http://localhost:5000/api/health
```

The SQLite database (`backend/instance/app.db`) and the uploads folder are
created automatically on first boot.

> Keep this terminal running. **Do not close it** while using the app.

### Step 3 — Run the Frontend (Terminal 2)

Open a **new** terminal in the project root.

#### 3.1 Install Node dependencies

```bash
cd frontend
npm install
```

#### 3.2 Start the React dev server

```bash
npm start
```

The React app launches on `http://localhost:3000` and automatically proxies
all `/api/*` requests to the Flask backend on port 5000 (configured in
`frontend/package.json`).

> Keep this terminal running too.

### Step 4 — Use the Application

Open your browser and visit:

```
http://localhost:3000
```

Then:

1. Go to **Register** and create a teacher account.
2. Log in with your new credentials.
3. On the **Upload** page, upload a lesson plan (PDF / DOCX / TXT).
4. View the **Bloom's level**, **teaching strategy**, and
   **recommendations** on the result page.
5. On the **Performance** page, add student scores manually or bulk-import
   via CSV (use `samples/student_performance_sample.csv` as a template).
6. Browse all your previously analyzed lesson plans under **History**.

### Step 5 — Stop the Application

In each terminal, press:

```
Ctrl + C
```

Then deactivate the Python virtual environment when you're done:

```bash
deactivate
```

### Quick Reference — Run Commands

| Step | Terminal | Command                                  |
|------|----------|------------------------------------------|
| 1    | Backend  | `cd backend`                             |
| 2    | Backend  | `python -m venv .venv`                   |
| 3    | Backend  | `.venv\Scripts\activate` (Win) / `source .venv/bin/activate` (Mac/Linux) |
| 4    | Backend  | `pip install -r requirements.txt`        |
| 5    | Backend  | `python -m train.train_models` *(optional)* |
| 6    | Backend  | `python app.py`                          |
| 7    | Frontend | `cd frontend`                            |
| 8    | Frontend | `npm install`                            |
| 9    | Frontend | `npm start`                              |
| 10   | Browser  | Open `http://localhost:3000`             |

### Troubleshooting

- **`python: command not found`** — try `python3` instead, or install Python
  from [python.org](https://www.python.org/).
- **Port 5000 already in use** — another process is using it. Stop that
  process or change the port in `backend/app.py`.
- **Port 3000 already in use** — when prompted by `npm start`, press `Y` to
  run on a different port.
- **`pip install` fails on PyTorch** — install the matching CPU-only build
  from [pytorch.org/get-started](https://pytorch.org/get-started/locally/),
  e.g. `pip install torch --index-url https://download.pytorch.org/whl/cpu`.
- **CORS / 401 errors in the browser** — make sure the backend is running on
  port 5000 *before* loading the React app, and that you're logged in (the
  JWT is sent via the `Authorization` header).
- **PDF upload returns empty text** — the PDF may be a scanned image. The
  current pipeline does not OCR; convert to a searchable PDF first.

---

## API Summary

| Method | Endpoint                         | Description                     |
|--------|----------------------------------|---------------------------------|
| POST   | `/api/auth/register`             | Create account                  |
| POST   | `/api/auth/login`                | Get JWT                         |
| GET    | `/api/auth/me`                   | Current user                    |
| POST   | `/api/lessons/upload`            | Upload + analyze a plan         |
| GET    | `/api/lessons/`                  | List my plans                   |
| GET    | `/api/lessons/<id>`              | Plan + analysis + linked perf.  |
| DELETE | `/api/lessons/<id>`              | Delete                          |
| POST   | `/api/lessons/analyze-text`      | Quick text-only analysis        |
| POST   | `/api/performance/`              | Add one record                  |
| POST   | `/api/performance/bulk`          | CSV bulk import                 |
| GET    | `/api/performance/`              | List (filter by lesson_plan_id) |
| GET    | `/api/performance/analytics`     | Aggregate analytics             |

All authenticated endpoints require an `Authorization: Bearer <token>` header.

---

## Tech Stack at a Glance

| Layer            | Technologies                                                     |
|------------------|------------------------------------------------------------------|
| Frontend         | React 18, react-router-dom 6, axios, recharts                    |
| Backend API      | Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS        |
| Database         | SQLite                                                           |
| Document Parsing | pdfplumber, PyPDF2                                               |
| ML / DL          | PyTorch (MLP), scikit-learn (TF-IDF), NLTK, NumPy, pandas        |
| NLP (optional)   | Hugging Face transformers                                        |
| Reasoning Layer  | Custom rule-based recommendation engine                          |
