const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

/** 
 * @section Shared Helpers
 * Theme colors and border styles used throughout the document.
 */
const BLUE      = "1F3864";
const BLUE_MID  = "2E75B6";
const BLUE_LITE = "D6E4F0";
const BLUE_HDR  = "BDD7EE";
const TEAL      = "17375E";
const GRAY      = "595959";
const BLACK     = "000000";
const WHITE     = "FFFFFF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const thickBorder = { style: BorderStyle.SINGLE, size: 3, color: BLUE_MID };
const thickBorders = { top: thickBorder, bottom: thickBorder, left: thickBorder, right: thickBorder };

/**
 * Creates a Heading 1 paragraph.
 * @param {string} text - The title text.
 * @returns {Paragraph} A docx Paragraph object.
 */
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_MID, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 34, bold: true, color: BLUE })]
  });
}

/**
 * Creates a Heading 2 paragraph.
 * @param {string} text - The sub-heading text.
 * @returns {Paragraph}
 */
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: BLUE_MID })]
  });
}

/**
 * Creates a standard body paragraph.
 * @param {string} text - Content text.
 * @param {Object} [opts={}] - Additional TextRun options (bold, italics, etc).
 * @returns {Paragraph}
 */
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: BLACK, ...opts })]
  });
}

/**
 * Generates a two-column table with a colored header on the left.
 * @param {Array<string[]>} rows - Array of [Label, Value] arrays.
 * @param {number[]} [colW=[3120, 6240]] - Widths of the two columns.
 * @returns {Table}
 */
function twoColTable(rows, colW = [3120, 6240]) {
  const total = colW[0] + colW[1];
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colW,
    rows: rows.map((r, i) => new TableRow({
      children: [
        new TableCell({ 
          width: { size: colW[0], type: WidthType.DXA }, borders,
          shading: { fill: i === 0 ? BLUE_MID : BLUE_LITE, type: ShadingType.CLEAR }, 
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: r[0], font: "Arial", size: 20, bold: i === 0, color: i === 0 ? WHITE : BLUE })] })] 
        }),
        new TableCell({ 
          width: { size: colW[1], type: WidthType.DXA }, borders,
          shading: { fill: WHITE, type: ShadingType.CLEAR }, 
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: r[1], font: "Arial", size: 20, color: BLACK })] })] 
        })
      ]
    }))
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_MID, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 34, bold: true, color: BLUE })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: BLUE_MID })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: TEAL })]
  });
}
function h4(text) {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: GRAY })]
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: BLACK, ...opts })]
  });
}
function paraRuns(runs) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: BLACK, ...r }))
  });
}
function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: BLACK, bold })]
  });
}
function bulletRuns(runs) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 60 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: BLACK, ...r }))
  });
}
function space(pts = 120) {
  return new Paragraph({ spacing: { before: pts, after: 0 }, children: [new TextRun("")] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── Table helpers ────────────────────────────────────────────────────────────
const cellMargins = { top: 100, bottom: 100, left: 120, right: 120 };

function hdrCell(text, w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders,
    shading: { fill: BLUE_MID, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20, bold: true, color: WHITE })]
    })]
  });
}
function dataCell(text, w, shade = false, bold = false) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders,
    shading: { fill: shade ? BLUE_LITE : WHITE, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20, color: BLACK, bold })]
    })]
  });
}
function twoColTable(rows, colW = [3120, 6240]) {
  const total = colW[0] + colW[1];
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colW,
    rows: rows.map((r, i) => new TableRow({
      children: [
        new TableCell({ width: { size: colW[0], type: WidthType.DXA }, borders,
          shading: { fill: i === 0 ? BLUE_MID : BLUE_LITE, type: ShadingType.CLEAR }, margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: r[0], font: "Arial", size: 20, bold: i === 0, color: i === 0 ? WHITE : BLUE })] })] }),
        new TableCell({ width: { size: colW[1], type: WidthType.DXA }, borders,
          shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: r[1], font: "Arial", size: 20, color: BLACK })] })] })
      ]
    }))
  });
}

function threeColTable(headers, rows) {
  const W = [2640, 3360, 3360];
  const total = W.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: W,
    rows: [
      new TableRow({ children: headers.map((h, i) => hdrCell(h, W[i])) }),
      ...rows.map((r, ri) => new TableRow({
        children: r.map((c, i) => dataCell(c, W[i], ri % 2 === 1))
      }))
    ]
  });
}

function fourColTable(headers, rows, colW) {
  const total = colW.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colW,
    rows: [
      new TableRow({ children: headers.map((h, i) => hdrCell(h, colW[i])) }),
      ...rows.map((r, ri) => new TableRow({
        children: r.map((c, i) => dataCell(c, colW[i], ri % 2 === 1))
      }))
    ]
  });
}

// ─── Document build ───────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "sub-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u25E6",
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_MID },
        paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: TEAL },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 }
      }
    },
    children: [

      // ════════════════════════════════════════════════════════════
      // TITLE PAGE
      // ════════════════════════════════════════════════════════════
      new Paragraph({ spacing: { before: 2000, after: 0 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "LESSON PLAN ANALYZER", font: "Arial", size: 52, bold: true, color: BLUE })] }),
      new Paragraph({ spacing: { before: 100, after: 0 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "AI-Powered Instructional Design Assistant", font: "Arial", size: 28, color: BLUE_MID, italics: true })] }),
      space(400),
      new Paragraph({ spacing: { before: 0, after: 0 }, alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE_MID } },
        children: [new TextRun({ text: "", font: "Arial", size: 22 })] }),
      space(400),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "IMPLEMENTATION REPORT", font: "Arial", size: 36, bold: true, color: TEAL })] }),
      space(600),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Chapter 1 — Implementation", font: "Arial", size: 24, color: GRAY })] }),
      space(800),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Technology: Flask · PyTorch · React · SQLite · scikit-learn · NLTK", font: "Arial", size: 20, color: GRAY, italics: true })] }),

      pageBreak(),

      // ════════════════════════════════════════════════════════════
      // 1  IMPLEMENTATION
      // ════════════════════════════════════════════════════════════
      h1("1.  Implementation"),
      para("This chapter provides a comprehensive technical account of the Lesson Plan Analyzer — an end-to-end, AI-powered web application that helps teachers improve instructional design by automatically classifying uploaded lesson plans against Bloom's Taxonomy and teaching strategies, generating actionable recommendations, and correlating design attributes with student performance data."),

      space(),

      // ────────────────────────────────────────────────────────────
      h2("1.1  Tools Used"),
      para("The project uses a curated set of industry-standard development tools across its full stack. The table below lists every tool, its category, and its role in the system."),
      space(80),

      (() => {
        const W = [2200, 2000, 5160];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Tool / Library", "Category", "Role in the System"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["Python 3.10+", "Runtime", "Server-side language for all backend logic, ML training, and document parsing"],
              ["Flask 3.0", "Web Framework", "Lightweight REST API framework exposing all backend endpoints under /api/*"],
              ["Flask-SQLAlchemy 3.1", "ORM", "Maps Python classes (User, LessonPlan, StudentPerformance) to SQLite tables"],
              ["Flask-JWT-Extended 4.6", "Auth Middleware", "Issues and validates JSON Web Tokens (JWTs) for protected API routes"],
              ["Flask-CORS 4.0", "Middleware", "Enables cross-origin requests so the React dev server can call the Flask API"],
              ["PyTorch 2.1", "Deep Learning", "Trains and runs the 3-layer MLP classifiers for Bloom's level and strategy"],
              ["scikit-learn 1.3", "ML / Feature Eng.", "TF-IDF vectoriser (1–2 grams) that converts lesson text to numeric features"],
              ["NLTK 3.8", "NLP", "Text tokenisation, stop-word removal, and Bloom-verb keyword matching"],
              ["pdfplumber 0.10", "Document Parsing", "Primary PDF text extractor with layout-aware parsing"],
              ["PyPDF2 3.0", "Document Parsing", "Fallback PDF extractor when pdfplumber fails on certain PDF formats"],
              ["python-docx", "Document Parsing", "DOCX paragraph extraction for Word document uploads"],
              ["NumPy / pandas", "Data Science", "Array operations for ML training and CSV performance analytics"],
              ["Werkzeug 3.0", "Security / WSGI", "Password hashing (PBKDF2-SHA256) and secure filename sanitisation"],
              ["SQLite", "Database", "Zero-config file-based relational store for users, plans, and performance data"],
              ["Node.js 16+ / npm", "JS Runtime", "Runs the React development server and package management"],
              ["React 18", "Frontend Library", "Component-based SPA with hooks for state management"],
              ["react-router-dom 6", "Client Routing", "Declarative SPA navigation (Register, Login, Upload, Results, Performance, History)"],
              ["axios", "HTTP Client", "Promise-based HTTP library for all frontend-to-backend API calls"],
              ["recharts", "Data Visualisation", "SVG charts rendering Bloom distribution and performance analytics"],
              ["Hugging Face transformers", "Future NLP", "Included for optional BERT-based embedding upgrades without restructuring"],
              ["VS Code / PyCharm", "IDE", "Development environment used for authoring and debugging code"],
              ["Git", "Version Control", "Source control for tracking changes throughout development"],
            ]).map((r,i) => new TableRow({
              children: r.map((c,j) => dataCell(c, W[j], i%2===1))
            }))
          ]
        });
      })(),

      space(),

      // ────────────────────────────────────────────────────────────
      h2("1.2  Technology Used"),
      para("The system is built on a two-tier client-server architecture. The backend is a Python/Flask REST API with an embedded AI/ML pipeline, and the frontend is a React single-page application. The full technology stack is organised below by layer."),
      space(80),

      (() => {
        const W = [2000, 2800, 4560];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Layer", "Technology", "Key Details"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["Frontend", "React 18 + CRA 5", "JSX components, Context API for auth state, react-router-dom for SPA navigation, recharts for analytics charts"],
              ["HTTP Communication", "axios + CORS", "All calls to /api/* proxied from port 3000 → 5000; JWT sent in Authorization: Bearer header"],
              ["Backend API", "Flask 3.0 (Blueprints)", "Three blueprints: auth_bp, lessons_bp, performance_bp. Auto-creates SQLite DB on first boot."],
              ["Authentication", "JWT (HS256)", "Flask-JWT-Extended issues 12-hour access tokens; Werkzeug PBKDF2-SHA256 for password hashing"],
              ["Database", "SQLite 3 via SQLAlchemy", "Three tables: users, lesson_plans, student_performance. Stored in backend/instance/app.db"],
              ["Document Parsing", "pdfplumber → PyPDF2 fallback; python-docx; UTF-8 for TXT", "Handles PDF, DOCX, TXT uploads up to 16 MB; UUID-prefixed filenames prevent collisions"],
              ["Feature Extraction", "TF-IDF (scikit-learn)", "ngram_range=(1,2), max_features=4000, sublinear_tf=True; produces sparse float32 matrix"],
              ["Deep Learning", "PyTorch MLP", "Two independent 3-layer MLPs; Adam optimizer, CrossEntropyLoss, Dropout regularisation"],
              ["Keyword Fallback", "Regex + Bloom verb map", "Pure-Python keyword classifier using NLTK tokenisation; zero dependencies on trained artifacts"],
              ["Recommendation Engine", "Rule-based Python", "Evaluates 7 heuristic categories over classifier output and heuristic section analysis"],
              ["Training Pipeline", "scikit-learn + PyTorch", "Synthetic corpus, TF-IDF fit, 80/20 stratified split, 40-epoch training with best-checkpoint saving"],
              ["Deployment Target", "Local development", "Flask on port 5000, React CRA dev server on port 3000 with package.json proxy setting"],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      space(),

      // ────────────────────────────────────────────────────────────
      h2("1.3  Overall View of the Project"),
      para("The Lesson Plan Analyzer solves a concrete instructional design problem: teachers spend time writing lesson plans without systematic feedback on cognitive depth, strategy diversity, or outcome alignment. The system automates this critique using an AI pipeline that combines classical machine learning, deep learning, and rule-based reasoning."),
      space(80),
      h3("System Architecture"),
      para("The end-to-end flow operates in five sequential stages:"),
      space(60),

      (() => {
        const W = [1440, 2200, 5720];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Stage", "Component", "Description"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["1", "Document Ingest", "Teacher uploads PDF/DOCX/TXT via React UI. Flask validates file type (allowlist), generates a UUID-prefixed safe filename, and saves to /uploads/."],
              ["2", "Text Extraction", "pdf_parser.py extracts raw text using pdfplumber (primary) or PyPDF2 (fallback). DOCX handled by python-docx; TXT is read directly. Minimum 30-character guard prevents empty-text processing."],
              ["3", "AI Classification", "classifier.py converts text to TF-IDF vectors and runs two PyTorch MLP heads — one for Bloom's level (6 classes) and one for teaching strategy (6 classes). A keyword fallback activates when model artifacts are absent."],
              ["4", "Recommendation", "recommender.py applies 7 rule categories over classifier output, detected sections, CO/PO metadata, and action-verb analysis to produce severity-ranked suggestions."],
              ["5", "Persistence & UI", "Results are stored in SQLite (LessonPlan row). The React Results page renders Bloom/strategy labels, confidence scores, distribution charts (recharts), and recommendation cards. History and Performance pages offer longitudinal views."],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      space(80),
      h3("Key Capabilities"),
      bullet("Multi-format document upload and text extraction (PDF, DOCX, TXT)"),
      bullet("JWT-secured user accounts — each teacher sees only their own data"),
      bullet("Bloom's Taxonomy classification across 6 cognitive levels (Remember → Create)"),
      bullet("Teaching strategy classification across 6 categories (Lecture → Demonstration)"),
      bullet("Rule-based recommendation engine with severity levels (high / medium / low)"),
      bullet("Student performance entry, CSV bulk import, and analytics charts"),
      bullet("Lesson history with full analysis retained per plan"),
      bullet("Graceful fallback keyword classifier — works on fresh clone without training"),

      space(),

      // ────────────────────────────────────────────────────────────
      h2("1.4  Explanation of Algorithm"),
      para("The AI pipeline combines three distinct algorithmic approaches in a hybrid architecture. Each component is described below with its mathematical basis."),

      space(80),
      h3("1.4.1  TF-IDF Feature Extraction"),
      para("Raw lesson text is transformed into a numeric vector using the Term Frequency–Inverse Document Frequency (TF-IDF) scheme. The sublinear variant is used to dampen the effect of high-frequency terms."),
      space(60),
      para("Standard TF (sublinear scaling):"),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "tf(t, d)  =  1 + log( count(t, d) )   if count > 0,  else  0", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),
      para("IDF (smoothed):"),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "idf(t)  =  log( (1 + N) / (1 + df(t)) )  +  1", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),
      para("Final TF-IDF weight:"),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "tfidf(t, d)  =  tf(t, d)  ×  idf(t)", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),
      para("Configuration used in this project:"),
      space(60),
      twoColTable([
        ["Parameter", "Value"],
        ["ngram_range", "(1, 2) — unigrams and bigrams"],
        ["max_features", "4,000 most informative n-grams"],
        ["sublinear_tf", "True — applies 1 + log(tf) scaling"],
        ["min_df", "2 — n-grams appearing in < 2 docs are discarded"],
        ["Output dtype", "float32 dense matrix — input to PyTorch MLP"],
      ], [2400, 6960]),

      space(80),
      h3("1.4.2  Multi-Layer Perceptron (MLP) Classifier"),
      para("Two independent MLP models are trained — one for Bloom's level and one for teaching strategy. Both share the same 3-layer architecture:"),
      space(60),
      twoColTable([
        ["Layer", "Configuration"],
        ["Input", "Dense vector of 4,000 TF-IDF features (float32)"],
        ["Hidden 1", "Linear(4000 → 128)  →  ReLU  →  Dropout(p=0.3)"],
        ["Hidden 2", "Linear(128 → 64)  →  ReLU  →  Dropout(p=0.2)"],
        ["Output", "Linear(64 → num_classes)  — 6 for both heads"],
        ["Activation (output)", "Softmax applied at inference for probability distribution"],
      ], [2400, 6960]),
      space(80),
      para("Forward pass:"),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "h1 = ReLU( W1·x + b1 );   h1_drop = Dropout(h1, p=0.3)", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 80 },
        children: [new TextRun({ text: "h2 = ReLU( W2·h1_drop + b2 );   h2_drop = Dropout(h2, p=0.2)", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 80 },
        children: [new TextRun({ text: "logits = W3·h2_drop + b3", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 80 },
        children: [new TextRun({ text: "P(class_k | x) = exp(logits_k) / Σ exp(logits_j)", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),

      space(80),
      h3("1.4.3  Training Procedure"),
      para("The models are trained using the Adam optimiser with weight decay for L2 regularisation. Cross-entropy loss is minimised over 40 epochs on a synthetic labelled corpus."),
      space(60),
      twoColTable([
        ["Hyperparameter", "Value"],
        ["Optimiser", "Adam — adaptive learning rate with momentum"],
        ["Learning rate", "0.001 (1e-3)"],
        ["Weight decay (L2)", "1e-5 — prevents overfitting"],
        ["Loss function", "Cross-Entropy Loss: L = −Σ y_i · log(p_i)"],
        ["Epochs", "40 — best checkpoint saved by validation accuracy"],
        ["Train / Val split", "80% training / 20% validation (stratified)"],
        ["Random seed", "42 — ensures reproducibility across runs"],
        ["Samples per label", "80 synthetic examples × 6 labels = 480 total"],
      ], [2400, 6960]),

      space(80),
      h3("1.4.4  Keyword Fallback Classifier"),
      para("When trained model artifacts are absent, a pure keyword classifier is activated. It scores each class by counting Bloom's action-verb or strategy-cue matches using word-boundary-aware regular expressions and normalises the counts to produce pseudo-probabilities."),
      space(60),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "score(label) = Σ count( \\b word \\b , text )   for each word in cue_list[label]", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 120 },
        children: [new TextRun({ text: "P(label) = score(label) / Σ score(all labels)", font: "Courier New", size: 22, bold: true, color: TEAL })]
      }),

      space(80),
      h3("1.4.5  Rule-Based Recommendation Engine"),
      para("Seven heuristic rules are evaluated sequentially over the classifier output and parsed section structure. Each rule emits a recommendation dict with category, severity, and suggestion fields. The engine is deterministic and fully explainable — no ML involved."),
      space(60),
      (() => {
        const W = [720, 2040, 4080, 2520];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["#", "Rule Category", "Logic Condition", "Default Severity"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["1", "Cognitive Level", "Bloom label is Remember or Understand", "High"],
              ["2", "Strategy Diversity", "Lecture only AND no second strategy cue detected", "High"],
              ["3", "CO Alignment", "No CO number in text and no CO metadata provided", "High"],
              ["4", "PO Alignment", "No PO number in text and no PO metadata provided", "Medium"],
              ["5", "Section Completeness", "objectives / activities / assessment section absent or < 10 chars", "High / Medium"],
              ["6", "Action Verbs", "Objectives section lacks any Bloom's taxonomy action verb", "High"],
              ["7", "Assessment Alignment", "Assessment is recall-based but Bloom label is Analyze / Evaluate / Create", "Medium"],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      pageBreak(),

      // ════════════════════════════════════════════════════════════
      // 1.5  Implementation of Modules
      // ════════════════════════════════════════════════════════════
      h2("1.5  Implementation of Modules"),
      para("This section details the step-by-step implementation approach, the coding methodologies employed, and a module-by-module breakdown of the entire system."),

      space(),
      h3("1.5.1  Steps Taken to Implement the System"),
      para("The project was implemented in five ordered phases to ensure foundational components were stable before building dependent layers."),
      space(60),

      (() => {
        const W = [1200, 2400, 5760];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Phase", "Name", "Activities Performed"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["Phase 1", "Project Scaffolding", "Created directory structure (backend/, frontend/, train/, utils/, routes/, models/). Initialised Python virtual environment, installed requirements.txt. Bootstrapped CRA React project. Configured Flask application factory pattern in app.py with SQLAlchemy, JWT, and CORS extensions."],
              ["Phase 2", "Data Layer", "Defined three SQLAlchemy ORM models in models/database.py: User (auth), LessonPlan (analysis results), StudentPerformance (outcomes). Configured SQLite at backend/instance/app.db. Implemented Werkzeug password hashing on the User model."],
              ["Phase 3", "AI/ML Pipeline", "Authored classifier.py (TF-IDF + MLP + keyword fallback). Wrote sample_data.py (synthetic corpus generator mixing Bloom-verb and strategy-cue templates). Implemented train_models.py (TF-IDF fit, stratified split, Adam training loop, best-checkpoint saving). Authored recommender.py (7-rule engine + summarize_analysis)."],
              ["Phase 4", "REST API Endpoints", "Implemented three Flask Blueprints: auth_bp (register/login/me), lessons_bp (upload/list/get/delete/analyze-text), performance_bp (add/bulk/list/analytics). Integrated file validation, UUID naming, text extraction, and full AI pipeline in the upload endpoint."],
              ["Phase 5", "React Frontend", "Built AuthContext.js for JWT state management. Implemented six page components: Register, Login, Dashboard, Upload, Results, Performance, History. Wired all components to the Flask API via api.js (axios). Added recharts visualisations for Bloom distribution and performance analytics."],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      space(),
      h3("1.5.2  Coding Methodologies and Algorithms"),
      para("The codebase follows recognised software-engineering patterns to ensure maintainability, testability, and extensibility."),
      space(60),

      (() => {
        const W = [2400, 6960];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Methodology / Pattern", "Application in this Project"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["Application Factory Pattern", "Flask app is created inside create_app() allowing easy configuration injection and test isolation. Extensions (db, JWT, CORS) are initialised after app creation."],
              ["Blueprint Modular Routing", "Each API domain (auth, lessons, performance) is a self-contained Flask Blueprint registered with a URL prefix, preventing routing conflicts and enabling independent development."],
              ["ORM Data Abstraction", "SQLAlchemy models encapsulate all database logic. Python objects are created/queried without writing raw SQL, making DB migrations straightforward."],
              ["Hybrid AI Pipeline", "Deep-learning classifier runs first; keyword classifier activates only when artifacts are missing. This progressive enhancement ensures the application works in all environments."],
              ["Lazy Model Loading", "ML models are loaded once on first request (_ensure_loaded()) and cached as module-level singletons, avoiding repeated disk I/O across requests."],
              ["Defensive File Handling", "Upload endpoint validates extension against an allowlist, sanitises filename with werkzeug.utils.secure_filename, prepends a UUID, and caps stored text at 60,000 characters."],
              ["Component-Based Frontend", "React components are single-responsibility (e.g., Upload.js only handles upload; Results.js only renders analysis). AuthContext wraps the router so any component can access the current user/token."],
              ["Context API Auth State", "JWT token and user profile are stored in React context (not localStorage) for the session lifetime, avoiding XSS risks from persistent storage in development."],
              ["Rule-Based Explainability", "Recommendations are produced by deterministic if-then rules rather than black-box ML, making every suggestion fully auditable by educators."],
              ["Synthetic Corpus Generation", "Training data is programmatically generated in sample_data.py by mixing Bloom-verb sentence templates with strategy-cue templates. Replacing this function with real labelled data requires zero other code changes."],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      pageBreak(),

      // ════════════════════════════════════════════════════════════
      // 1.5.3  Module-wise Implementation
      // ════════════════════════════════════════════════════════════
      h3("1.5.3  Module-wise Implementation"),
      para("The system is decomposed into eleven cohesive modules. Each subsection below covers the module's detailed description, its functionality and purpose, the security measures embedded within it, and any performance optimisations applied."),

      space(),
      // ─── Module 1 ───
      h4("Module 1 — app.py  (Application Entry Point)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("app.py implements the Flask application factory. The create_app() function instantiates the Flask object, loads configuration from config.py, ensures required directories exist (uploads/, instance/, train/artifacts/), binds the db, JWTManager, and CORS extensions, registers all three Blueprints with their URL prefixes, defines the /api/health endpoint, and calls db.create_all() inside the application context to auto-create tables on first boot. The module's __main__ guard reads FLASK_DEBUG and FLASK_USE_RELOADER environment variables so the auto-reloader can be disabled (preventing PyTorch file-watcher conflicts) while still running in debug mode."),

      h4("1.5.3.2 — Functionality and Purpose"),
      bullet("Bootstraps the entire Flask application as a factory (testable, configurable)"),
      bullet("Wires all extensions and Blueprints in one authoritative location"),
      bullet("Provides /api/health GET for uptime monitoring and load-balancer probes"),
      bullet("Handles global 413 Content Too Large error with a descriptive JSON message"),
      bullet("Controls auto-reloader via environment variable to prevent PyTorch conflicts"),

      h4("1.5.3.3 — Security Measures"),
      bullet("Flask-JWT-Extended initialised here enforces JWT validation on every @jwt_required() route globally"),
      bullet("Flask-CORS restricts CORS headers to /api/* paths only, not static files"),
      bullet("Max upload size (16 MB) enforced at the WSGI layer via MAX_CONTENT_LENGTH in Config"),

      h4("1.5.3.4 — Performance Optimisations"),
      bullet("use_reloader=False by default prevents unnecessary process restarts and dropped connections under heavy file I/O"),
      bullet("db.create_all() called once at startup rather than per-request"),

      space(),
      // ─── Module 2 ───
      h4("Module 2 — config.py  (Configuration)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("A single Config class reads all configuration values from environment variables with safe development defaults. It centralises all paths (uploads, model artifacts, SQLite DB) so no other module hard-codes file locations. JWT tokens are set to expire in 12 hours, balancing usability and security."),

      (() => {
        const W = [2400, 2600, 4360];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Config Key", "Default Value", "Purpose"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["SECRET_KEY", "change-me-in-production", "Flask session and general-purpose HMAC signing key"],
              ["JWT_SECRET_KEY", "jwt-change-me-in-production", "Signs and verifies JWT access tokens (HS256)"],
              ["JWT_ACCESS_TOKEN_EXPIRES", "timedelta(hours=12)", "Auto-expiry window for issued tokens"],
              ["SQLALCHEMY_DATABASE_URI", "sqlite:///instance/app.db", "SQLite file location relative to backend/"],
              ["UPLOAD_FOLDER", "backend/uploads/", "Directory for saved lesson plan files"],
              ["MAX_CONTENT_LENGTH", "16 MB (16 × 1024 × 1024)", "Hard upload size limit enforced by Werkzeug"],
              ["ALLOWED_EXTENSIONS", "{pdf, txt, docx}", "Upload allowlist — rejects all other file types"],
              ["BLOOM_MODEL_PATH", "train/artifacts/bloom_model.pkl", "Trained Bloom's MLP artifact location"],
              ["STRATEGY_MODEL_PATH", "train/artifacts/strategy_model.pkl", "Trained strategy MLP artifact location"],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),
      space(60),
      h4("1.5.3.3 — Security Measures"),
      bullet("Secret keys read from environment variables — never hard-coded in production"),
      bullet("ALLOWED_EXTENSIONS set acts as an upload allowlist, rejecting executable and unknown types"),

      space(),
      // ─── Module 3 ───
      h4("Module 3 — models/database.py  (ORM Data Models)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("Defines three SQLAlchemy model classes that map directly to SQLite tables. The User model stores teacher credentials and owns lesson plans and performance records via cascading foreign-key relationships. The LessonPlan model stores all metadata, extracted text (capped at 60,000 chars), classifier outputs, and recommendation/analysis JSON blobs. The StudentPerformance model stores per-student scores linked optionally to a lesson plan."),

      (() => {
        const W = [2000, 2000, 5360];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Model", "Table Name", "Key Columns"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["User", "users", "id, name, email (unique, indexed), password_hash, role, created_at"],
              ["LessonPlan", "lesson_plans", "id, user_id (FK), title, subject, course_outcome, program_outcome, filename, stored_path, raw_text, bloom_level, bloom_confidence, teaching_strategy, strategy_confidence, recommendations (JSON text), analysis_summary (JSON text), created_at"],
              ["StudentPerformance", "student_performance", "id, user_id (FK), lesson_plan_id (FK, nullable), student_name, roll_no, assessment, score, max_score, remarks, created_at"],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),
      space(60),
      h4("1.5.3.3 — Security Measures"),
      bullet("Passwords stored exclusively as Werkzeug PBKDF2-SHA256 hashes — plaintext never persisted"),
      bullet("check_password() uses Werkzeug's constant-time comparison to prevent timing attacks"),
      bullet("Cascade delete ensures all user data is purged when a user account is removed"),
      h4("1.5.3.4 — Performance Optimisations"),
      bullet("email column has a database index for O(log n) login lookups"),
      bullet("raw_text stored with a 60,000-character cap to control row size"),
      bullet("Lazy loading on relationships prevents unnecessary JOIN queries on list endpoints"),

      space(),
      // ─── Module 4 ───
      h4("Module 4 — utils/pdf_parser.py  (Document Extraction)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("Provides three extraction functions: extract_text_from_pdf() tries pdfplumber first (superior layout handling) and falls back to PyPDF2 if pdfplumber returns empty text or raises an exception. extract_text_from_docx() uses python-docx to join paragraph texts. extract_text_from_file() dispatches based on file extension. split_sections() uses a regex-based heuristic to detect common lesson plan headings (title, objectives, outcomes, content, activities, assessment, resources) and return a dict of section texts used by the recommendation engine."),
      h4("1.5.3.2 — Functionality and Purpose"),
      bullet("Abstracts format-specific parsing behind a single extract_text_from_file() call"),
      bullet("Dual-library PDF strategy maximises text extraction success rate across different PDF encodings"),
      bullet("split_sections() enables section-aware recommendations (e.g., detects missing objectives)"),
      h4("1.5.3.3 — Security Measures"),
      bullet("File extension check in extract_text_from_file() raises ValueError for unsupported types as a second line of defence after the upload allowlist"),
      bullet("All file reads are wrapped in try/except — parsing errors surface as RuntimeError messages, not stack traces"),

      space(),
      // ─── Module 5 ───
      h4("Module 5 — utils/classifier.py  (AI Classification Engine)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("The central AI module. It defines the two label sets (BLOOM_LEVELS, STRATEGIES), the verb/cue dictionaries (BLOOM_VERBS, STRATEGY_CUES), the TextMLP wrapper class that reconstructs and runs a PyTorch MLP from a pickled artifact, and the public classify_lesson_plan(text) function. Models are loaded lazily on first call via _ensure_loaded() and cached as module-level globals. If loading fails (artifact missing or torch unavailable), _keyword_score() provides a fully functional keyword fallback."),
      h4("1.5.3.2 — Functionality and Purpose"),
      bullet("classify_lesson_plan(text) → dict with bloom and strategy sub-dicts each containing label, confidence, scores (per-class probabilities), and model (deep | keyword) fields"),
      bullet("TextMLP.predict() runs TF-IDF transform + forward pass + softmax in a single no_grad() block"),
      bullet("_keyword_score() counts word-boundary regex matches and normalises them to pseudo-probabilities"),
      bullet("Supports runtime model introspection — caller knows whether deep or keyword model was used"),
      h4("1.5.3.4 — Performance Optimisations"),
      bullet("torch.no_grad() disables gradient tracking during inference, reducing memory use by ~50%"),
      bullet("Module-level singleton caching prevents repeated pickle deserialization per request"),
      bullet("model.eval() switches BatchNorm and Dropout to inference mode, ensuring deterministic predictions"),

      space(),
      // ─── Module 6 ───
      h4("Module 6 — utils/recommender.py  (Recommendation Engine)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("Implements generate_recommendations() and summarize_analysis(). The recommendation function accepts classifier output, parsed section dict, and optional CO/PO metadata, then sequentially evaluates seven rules producing a list of {category, severity, suggestion} dicts. summarize_analysis() computes word count, sentence count, detected/missing sections, bloom and strategy probability distributions, higher-order thinking share, and which model type was used."),
      h4("1.5.3.2 — Functionality and Purpose"),
      bullet("Translates AI classification output into human-readable, actionable teacher feedback"),
      bullet("Higher-order thinking share: sum of probabilities for Apply + Analyze + Evaluate + Create"),
      bullet("Severity levels (high / medium / low) allow the UI to prioritise recommendations visually"),
      bullet("CO/PO alignment rules enforce outcome-based education (OBE) compliance checks"),
      h4("1.5.3.4 — Performance Optimisations"),
      bullet("All rules are O(n) regex or dict lookups — negligible computation time"),
      bullet("summarize_analysis() computes word/sentence counts with compiled regex patterns"),

      space(),
      // ─── Module 7 ───
      h4("Module 7 — train/train_models.py  (Model Training Pipeline)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("A standalone script invoked with python -m train.train_models. It loads the synthetic corpus from sample_data.generate_corpus(), fits a TF-IDF vectorizer, performs an 80/20 stratified train-val split, trains the MLP for 40 epochs with the Adam optimiser, tracks the best validation accuracy checkpoint, and serialises the vectorizer + state_dict + labels + hidden size into a pickle artifact. Two independent runs produce bloom_model.pkl and strategy_model.pkl."),

      (() => {
        const W = [2400, 6960];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Training Parameter", "Value / Setting"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["Corpus size", "80 samples × 6 labels = 480 total training examples"],
              ["Vectorizer", "TF-IDF, ngram_range=(1,2), max_features=4000, sublinear_tf=True"],
              ["Split strategy", "80% train / 20% validation — stratified to balance class distribution"],
              ["Random seed", "42 (numpy, torch, random) for full reproducibility"],
              ["MLP shape", "input(4000) → 128 → ReLU → Dropout(0.3) → 64 → ReLU → Dropout(0.2) → 6"],
              ["Optimiser", "Adam, lr=0.001, weight_decay=1e-5"],
              ["Loss function", "CrossEntropyLoss (combines log-softmax + NLLLoss)"],
              ["Epochs", "40 — best checkpoint restored before saving"],
              ["Artifact format", "Pickle dict: {vectorizer, state_dict, labels, hidden, val_accuracy}"],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      space(),
      // ─── Module 8 ───
      h4("Module 8 — routes/auth.py  (Authentication API)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("Implements the auth Blueprint with three endpoints. POST /api/auth/register validates name/email/password, checks for duplicate email, hashes the password, creates the User row, and immediately returns a JWT plus user dict. POST /api/auth/login looks up by email, verifies the hash, and returns a new JWT. GET /api/auth/me is a @jwt_required() route that returns the current user's profile."),
      h4("1.5.3.3 — Security Measures"),
      bullet("Email validated by regex before DB query — prevents malformed input reaching the ORM"),
      bullet("Password minimum length of 6 characters enforced server-side"),
      bullet("Duplicate email returns HTTP 409 Conflict with a generic message — avoids user enumeration through different status codes"),
      bullet("Passwords never returned in any response body — only the hash is stored"),
      bullet("401 Unauthorized returned for wrong credentials with a single generic message (no distinction between wrong email vs wrong password)"),

      space(),
      // ─── Module 9 ───
      h4("Module 9 — routes/lessons.py  (Lesson Plan API)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("The most complex Blueprint. POST /api/lessons/upload is the core endpoint: it validates the uploaded file, saves it with a UUID prefix via secure_filename(), extracts text, runs the full AI pipeline (classify → recommend → summarise), persists a LessonPlan row, and returns the full analysis JSON. GET / lists all plans for the authenticated user ordered by date. GET /<id> returns a plan with its linked performance records. DELETE /<id> removes the plan. POST /analyze-text accepts raw text for quick analysis without file upload."),
      h4("1.5.3.2 — Functionality and Purpose"),
      bullet("UUID-prefixed filenames prevent collisions and server-side path traversal"),
      bullet("Minimum 30-character text guard rejects empty or unreadable uploads early"),
      bullet("All routes are @jwt_required() — unauthenticated requests return 401"),
      bullet("User-scoping on all queries (filter_by(user_id=uid)) prevents cross-user data access"),
      h4("1.5.3.3 — Security Measures"),
      bullet("secure_filename() from Werkzeug strips path components and dangerous characters from filenames"),
      bullet("UUID prefix makes uploaded filenames unguessable — prevents direct URL enumeration of other users' files"),
      bullet("Raw text capped at 60,000 characters before DB insert — prevents excessively large rows"),

      space(),
      // ─── Module 10 ───
      h4("Module 10 — routes/performance.py  (Student Performance API)"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("Manages student performance data. POST /api/performance/ adds a single record. POST /api/performance/bulk accepts a CSV file (parsed server-side) and batch-inserts rows. GET /api/performance/ lists records optionally filtered by lesson_plan_id. GET /api/performance/analytics returns aggregated statistics (mean score, standard deviation, pass rate, distribution by Bloom level and strategy) for charting in the React UI."),
      h4("1.5.3.2 — Functionality and Purpose"),
      bullet("Percentage calculated as (score / max_score) × 100 and returned with every record"),
      bullet("CSV bulk import uses Python's csv.DictReader — no pandas dependency on the route layer"),
      bullet("Analytics endpoint correlates mean performance with lesson Bloom level and strategy via JOIN queries"),
      h4("1.5.3.3 — Security Measures"),
      bullet("All performance records are user-scoped — a teacher can only query their own students' data"),
      bullet("CSV upload validated for expected column headers before bulk insert"),

      space(),
      // ─── Module 11 ───
      h4("Module 11 — Frontend React Components"),
      space(40),
      h4("1.5.3.1 — Detailed Description"),
      para("The frontend consists of six page components plus supporting context and API files:"),
      space(60),
      (() => {
        const W = [2000, 7360];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Component", "Description"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["AuthContext.js", "React Context providing login(), logout(), user, and token state. JWT stored in context memory for the session. All API calls read token from context for the Authorization header."],
              ["api.js", "Centralised axios instance with baseURL pointing to /api/. Interceptor attaches Authorization: Bearer token to every outgoing request."],
              ["Register.js", "Form collects name, email, password. Calls POST /api/auth/register. On success, stores returned token in AuthContext and redirects to Dashboard."],
              ["Login.js", "Email/password form calling POST /api/auth/login. Error messages displayed inline. Redirects authenticated users to Dashboard."],
              ["Dashboard.js", "Landing page post-login. Shows quick-access links to Upload, Performance, and History. Displays count of analyzed lesson plans."],
              ["Upload.js", "Multi-field form: file picker (PDF/DOCX/TXT), title, subject, course outcome, program outcome. On submit, sends multipart/form-data to POST /api/lessons/upload. Renders loading spinner during processing."],
              ["Results.js", "Renders the full analysis: Bloom level badge, strategy badge, confidence bars, recharts RadarChart for Bloom distribution, recharts BarChart for strategy distribution, and colour-coded recommendation cards (red=high, amber=medium, green=low)."],
              ["Performance.js", "Dual-mode: manual entry form and CSV upload. Fetches GET /api/performance/analytics and renders recharts LineChart of scores over time and BarChart of mean score by Bloom level."],
              ["History.js", "Fetches GET /api/lessons/ and renders a paginated table of past uploads with date, Bloom level, strategy, and a link to the full Results view. Supports delete."],
              ["Navbar.js", "Persistent top navigation with auth-conditional links. Logout clears AuthContext and redirects to Login."],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),
      space(60),
      h4("1.5.3.3 — Security Measures"),
      bullet("JWT stored in React context memory — never written to localStorage or cookies, reducing XSS attack surface in the development context"),
      bullet("All API calls gate behind AuthContext.token — unauthenticated state automatically redirects to Login via react-router-dom PrivateRoute pattern"),
      bullet("File input accepts only .pdf,.docx,.txt at the HTML level as a UX hint (server-side validation remains the authoritative check)"),

      pageBreak(),

      // ════════════════════════════════════════════════════════════
      // 1.5.4  Challenges and Solutions
      // ════════════════════════════════════════════════════════════
      h3("1.5.4  Challenges and Solutions"),
      para("Several non-trivial engineering problems were encountered during the development of this system. Each challenge is documented with its root cause and the remedial approach applied."),

      space(80),
      h4("1.5.4.1  Problems Encountered During Implementation"),
      space(60),

      (() => {
        const W = [720, 2640, 5000];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["#", "Problem", "Root Cause / Symptom"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["P1", "Flask auto-reloader killing uploads", "PyTorch watches imported module files via mtime. The auto-reloader detects these timestamp changes and restarts the worker process mid-upload, causing the frontend to receive a connection reset error ('Cannot reach the backend')."],
              ["P2", "PDF text extraction failures", "Some PDFs are scanned images without an embedded text layer. pdfplumber and PyPDF2 both return empty strings on such files because they have no text to extract — only pixel data."],
              ["P3", "Small synthetic corpus causing low classifier accuracy", "With only 80 samples per label, the MLP had insufficient training signal to generalise beyond verb-heavy template sentences. Overfitting to specific n-grams was observed on diverse real lesson plan text."],
              ["P4", "CORS errors during React → Flask API calls", "The CRA dev server runs on port 3000 while Flask runs on port 5000. Without correct CORS headers, browsers block cross-origin requests from the React app to the API."],
              ["P5", "JWT token expiry causing silent API failures", "After 12 hours, the stored JWT expires. Subsequent axios calls return 401 Unauthorized, but the React UI did not surface a clear session-expired message, leaving users on blank pages."],
              ["P6", "Inconsistent section detection across plan formats", "Teachers use different heading names ('Aims', 'Learning Outcomes', 'Methods') not always matching the regex patterns in split_sections(), causing false 'missing section' recommendations."],
              ["P7", "CSV bulk import column mismatches", "Teachers provided CSV files with different column orderings or extra columns. A strict positional parser would silently import wrong data or throw unhelpful KeyErrors."],
              ["P8", "PyTorch not available in lightweight environments", "In environments where torch is not installed (e.g., minimal Docker images for demonstration), importing classifier.py at startup would fail with ImportError, crashing the entire Flask server."],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      space(),
      h4("1.5.4.2  Remedial for Challenges"),
      space(60),

      (() => {
        const W = [720, 2640, 5000];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["#", "Problem", "Solution Applied"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["P1", "Flask auto-reloader killing uploads", "use_reloader defaulted to False via os.environ.get('FLASK_USE_RELOADER', '0'). Debug mode is kept on for error logging while the reloader is disabled, eliminating file-watcher interference with PyTorch module files."],
              ["P2", "PDF text extraction failures", "Documented in troubleshooting as a known limitation. Users are advised to convert scanned PDFs to searchable PDFs using an OCR tool before uploading. The API returns HTTP 422 Unprocessable Entity with a descriptive message when extracted text is too short."],
              ["P3", "Low classifier accuracy on small corpus", "The keyword fallback classifier was implemented as a co-equal alternative, not just an emergency measure. When deep model confidence is low or artifacts are absent, the keyword path produces reliable results using the Anderson & Krathwohl verb taxonomy. Increasing samples_per_label in sample_data.py or substituting real labelled data improves the deep model without code changes."],
              ["P4", "CORS errors during development", "Flask-CORS is configured with resources={r'/api/*': {'origins': '*'}}. The React package.json sets 'proxy': 'http://localhost:5000' so all /api/* calls from CRA are transparently proxied, eliminating cross-origin issues in development entirely."],
              ["P5", "Silent JWT expiry failures", "The axios instance in api.js uses a response interceptor to detect 401 responses and call the AuthContext logout() function, which clears the token and redirects to the Login page with a 'Session expired' message displayed via React state."],
              ["P6", "Inconsistent section detection", "The regex patterns in split_sections() were extended with alternates (e.g., 'aims?' matches 'aim' and 'aims', 'outcomes?' matches both singular and plural). Multiple synonym patterns were added per section type using the regex pipe (|) operator."],
              ["P7", "CSV bulk import column mismatches", "The bulk import endpoint uses csv.DictReader which accesses columns by name, not position. Required column names are validated against the reader's fieldnames property before any row is processed, returning a clear 400 error listing missing columns."],
              ["P8", "PyTorch import failure in lightweight environments", "torch is imported inside _torch_available() using a try/except block that returns False on ImportError. All MLP code paths are guarded by this check. The classifier module is fully importable and functional using only the keyword path even without torch installed."],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      pageBreak(),

      // ════════════════════════════════════════════════════════════
      // 1.6  Summary
      // ════════════════════════════════════════════════════════════
      h2("1.6  Summary"),
      para("The Lesson Plan Analyzer is a full-stack, AI-powered web application that successfully integrates classical machine learning, deep learning, rule-based reasoning, and modern web technologies into a cohesive instructional design tool. The following table summarises the key technical attributes of the completed implementation."),
      space(80),

      (() => {
        const W = [2800, 6560];
        const total = W.reduce((a,b)=>a+b,0);
        return new Table({
          width: { size: total, type: WidthType.DXA },
          columnWidths: W,
          rows: [
            new TableRow({ children: ["Attribute", "Summary"].map((h,i) => hdrCell(h,W[i])) }),
            ...([
              ["Architecture", "Two-tier client-server: React SPA (port 3000) + Flask REST API (port 5000) with SQLite persistence"],
              ["AI Pipeline", "Hybrid: TF-IDF feature extraction → PyTorch MLP (primary) → keyword/verb-cue fallback (secondary)"],
              ["Classification Tasks", "Bloom's Taxonomy level (6 classes) + Teaching Strategy (6 classes) — two independent model heads"],
              ["Recommendation Engine", "7-category rule-based engine producing severity-ranked, actionable suggestions per lesson plan"],
              ["Document Support", "PDF (pdfplumber + PyPDF2 fallback), DOCX (python-docx), TXT — up to 16 MB per upload"],
              ["Authentication", "JWT (HS256, 12-hour expiry) with Werkzeug PBKDF2-SHA256 password hashing"],
              ["Database", "SQLite with 3 tables (users, lesson_plans, student_performance) — zero configuration required"],
              ["Frontend", "React 18 with Context API, react-router-dom 6, axios, recharts — 10 components"],
              ["Training Pipeline", "Synthetic corpus (480 samples), TF-IDF fit, 80/20 stratified split, Adam, 40 epochs, best-checkpoint"],
              ["Key Challenges Solved", "Auto-reloader conflict, JWT expiry handling, CORS configuration, lazy torch loading, CSV column validation"],
              ["Extensibility", "Swap sample_data.py for real corpus data with no other code changes; plug in BERT embeddings via transformers"],
              ["Deployment", "Local development ready; production deployment requires environment variable injection of secret keys and a production WSGI server (e.g., Gunicorn)"],
            ]).map((r,i) => new TableRow({ children: r.map((c,j) => dataCell(c, W[j], i%2===1)) }))
          ]
        });
      })(),

      space(120),
      para("The implementation demonstrates a practical application of instructional design theory (Bloom's Taxonomy, Anderson & Krathwohl 2001), applied machine learning (TF-IDF, MLP), software engineering best practices (Blueprint architecture, ORM, JWT auth, factory pattern), and modern web development (React Context, recharts, axios). The system is designed for immediate usability via its keyword fallback classifier while providing a clear upgrade path to a fully trained deep-learning pipeline through the modular training pipeline and synthetic corpus generator."),

      space(200),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 0 },
        children: [new TextRun({ text: "— End of Chapter 1: Implementation —", font: "Arial", size: 20, color: GRAY, italics: true })]
      }),

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/LessonPlanAnalyzer_Implementation_Report.docx', buf);
  console.log('Done');
});