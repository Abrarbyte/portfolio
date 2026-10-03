/* Render the AI/ML resume to .docx, keeping every link clickable.
 *   node resume/build-docx.js
 * Mirrors resume/aiml.html. Edit both, or regenerate this from that.
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, AlignmentType,
  BorderStyle, convertMillimetersToTwip, TabStopType, TabStopPosition,
} = require('docx');

const PURPLE = '6B3FA0';
const DARK = '3B1F4A';
const INK = '1A1A1A';
const GREY = '555555';

// docx sizes are half-points.
const hp = (pt) => Math.round(pt * 2);

/** Body text run. */
const t = (text, opts = {}) => new TextRun({ text, size: hp(9.4), color: INK, font: 'Calibri', ...opts });

/** A hyperlink that still looks like the surrounding line. */
const link = (text, href, opts = {}) =>
  new ExternalHyperlink({
    link: href,
    children: [new TextRun({ text, size: hp(8.4), color: PURPLE, font: 'Calibri', ...opts })],
  });

/** Section heading with the rule under it. */
const h2 = (text) =>
  new Paragraph({
    spacing: { before: 90, after: 30 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: DARK, space: 1 } },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true, size: hp(9.4), color: DARK, font: 'Calibri', characterSpacing: 22,
      }),
    ],
  });

/** Entry title, optionally with right-aligned links on the same line. */
const entryTitle = (title, links = []) => {
  const children = [new TextRun({ text: title, bold: true, size: hp(9.7), color: INK, font: 'Calibri' })];
  if (links.length) {
    children.push(new TextRun({ text: '\t', size: hp(9.7) }));
    links.forEach((l, i) => {
      if (i) children.push(new TextRun({ text: ' · ', size: hp(8.4), color: '777777', font: 'Calibri' }));
      children.push(link(l.text, l.href));
    });
  }
  return new Paragraph({
    spacing: { before: 50, after: 0 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children,
  });
};

const meta = (text) =>
  new Paragraph({
    spacing: { before: 0, after: 10 },
    children: [new TextRun({ text, italics: true, size: hp(8.6), color: GREY, font: 'Calibri' })],
  });

const bullet = (runs) =>
  new Paragraph({
    numbering: { reference: 'resume-bullets', level: 0 },
    spacing: { before: 0, after: 10, line: 215 },
    children: Array.isArray(runs) ? runs : [t(runs)],
  });

/** "Label: body" skills line. */
const skill = (label, body) =>
  new Paragraph({
    spacing: { before: 0, after: 10, line: 215 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: hp(9.4), color: INK, font: 'Calibri' }),
      t(body),
    ],
  });

const body = (text) =>
  new Paragraph({ spacing: { before: 0, after: 10, line: 215 }, children: [t(text)] });

const doc = new Document({
  creator: 'M. Abrar Patel',
  title: 'M. Abrar Patel — AI/ML Engineer',
  numbering: {
    config: [{
      reference: 'resume-bullets',
      levels: [{
        level: 0, format: 'bullet', text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 200, hanging: 140 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertMillimetersToTwip(11), bottom: convertMillimetersToTwip(11),
          left: convertMillimetersToTwip(13), right: convertMillimetersToTwip(13),
        },
      },
    },
    children: [
      // ---------------------------------------------------------------- header
      new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({
          text: 'M. ABRAR PATEL', bold: true, size: hp(17), color: DARK,
          font: 'Calibri', characterSpacing: 16,
        })],
      }),
      new Paragraph({
        spacing: { before: 20, after: 40 },
        children: [new TextRun({
          text: 'AI/ML Engineer  |  Python · LLMs & Agentic AI · RAG · PyTorch · TensorFlow',
          bold: true, size: hp(10), color: PURPLE, font: 'Calibri',
        })],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: '+91 7249361481  |  abrarpatel454@gmail.com  |  ', size: hp(8.6), color: '444444', font: 'Calibri' }),
          link('abrarbyte-portfolio-web.vercel.app', 'https://abrarbyte-portfolio-web.vercel.app'),
          new TextRun({ text: '  |  ', size: hp(8.6), color: '444444', font: 'Calibri' }),
          link('github.com/Abrarbyte', 'https://github.com/Abrarbyte'),
          new TextRun({ text: '  |  ', size: hp(8.6), color: '444444', font: 'Calibri' }),
          link('linkedin.com/in/abrar-patel', 'https://linkedin.com/in/abrar-patel'),
          new TextRun({ text: '  |  Kolhapur, India · open to remote', size: hp(8.6), color: '444444', font: 'Calibri' }),
        ],
      }),

      // --------------------------------------------------------------- summary
      h2('Profile Summary'),
      body('AI/ML engineer who builds LLM-powered systems and ships them inside real products. Six months of applied ML engineering — data preparation, feature engineering, training and evaluation across NLP and computer vision in TensorFlow/Keras, plus PyTorch fine-tuning of HuggingFace transformers — alongside RAG work: embedding an internal knowledge base, indexing it in FAISS and ChromaDB, and serving semantic retrieval behind a Python API. Shipped a LangChain tool-calling agent that reads and writes live business data in a merchant platform, and build evaluation harnesses that measure whether model output is actually correct. Strong Python and CS fundamentals.'),

      // ------------------------------------------------------------- core skills
      h2('Core Skills'),
      skill('Generative AI & LLMs', 'LangChain, tool calling / function calling, multi-step agent workflows, prompt design and iteration, output evaluation and reliability hardening, OpenAI-compatible APIs, chatbot design'),
      skill('RAG & Retrieval', 'document chunking, OpenAI and Gemini embeddings, semantic search, vector databases — FAISS, ChromaDB, Pinecone, pgvector'),
      skill('Machine Learning & Deep Learning', 'PyTorch, TensorFlow, Keras, HuggingFace Transformers, Scikit-learn, Pandas, NumPy — neural networks, CNNs, sequence models, transfer learning and fine-tuning, feature engineering, model training, evaluation and experimentation'),
      skill('Languages & CS', 'Python (OOP, data structures & algorithms), SQL, JavaScript, TypeScript, C, C++, C# — DSA, OOP, DBMS, operating-system fundamentals'),
      skill('Engineering & Deployment', 'Django REST Framework, Flask, FastAPI, PostgreSQL, MySQL, MongoDB, Celery + Redis, Docker, Git, GitHub Actions, PyTest, Google Cloud Platform'),

      // ---------------------------------------------------------- experience
      h2('Professional Experience'),
      entryTitle('AI/ML Engineering Intern — ABis Infotech Solutions'),
      meta('Remote · 6 months'),
      bullet('Built end-to-end Python ML pipelines in TensorFlow and Keras — data ingestion, preprocessing, feature preparation, model training, evaluation and inference — and fine-tuned pretrained HuggingFace transformer models in PyTorch for downstream tasks.'),
      bullet('Built a RAG pipeline for internal knowledge search: chunked and embedded source documents (OpenAI and Gemini embedding APIs), indexed them in FAISS and ChromaDB, and served semantic retrieval with LLM-generated answers grounded in the retrieved context — tuning chunk size, top-k and prompt structure to cut irrelevant retrievals and hallucinated answers.'),
      bullet('Delivered NLP and computer-vision models — next-word prediction, image captioning, face recognition, mask detection and stock prediction — each evaluated against held-out data before shipping.'),

      entryTitle('Software Developer — Aarmarks Media', [
        { text: 'aarmarksmedia.com', href: 'https://aarmarksmedia.com' },
        { text: 'case study', href: 'https://abrarbyte-portfolio-web.vercel.app/aitremarkiq' },
      ]),
      meta('Aug 2026 – Present · TriMarkity suite, incl. the AITremarkIQ AI product'),
      bullet('Ship features across a live multi-app SaaS suite in Python/Django, including the AITremarkIQ AI product — collaborating with product to turn business requirements into working features.'),

      // ------------------------------------------------------------- projects
      h2('AI Projects'),
      entryTitle('DukaanAI — LangChain Agent for Retail Business Data', [
        { text: 'case study', href: 'https://abrarbyte-portfolio-web.vercel.app/dukaanai' },
        { text: 'github', href: 'https://github.com/Abrarbyte' },
      ]),
      meta('LangChain · Python · Flask · MySQL · SQLAlchemy · Redis · Flutter'),
      bullet('Built a Hindi-language LangChain agent with tool calling: the LLM selects and invokes typed tools that read and write real shop data — inventory, billing, credit — against a Flask + MySQL backend of 8 tables and 45+ REST endpoints, then composes an answer from the tool results.'),
      bullet('Iterated on prompts and tool schemas to make the agent reliable on noisy, code-mixed Hindi input — constraining tool arguments and adding guard rails so the model asks for missing fields instead of inventing them.'),
      bullet('Designed an ML-driven insights layer — dead-stock detection and demand prediction over transaction history — surfaced directly to shop owners as actions, not charts.'),

      entryTitle('ModelReceipt — Verifiable LLM Inference Gateway', [
        { text: 'modelreceipt.vercel.app', href: 'https://modelreceipt.vercel.app' },
        { text: 'github', href: 'https://github.com/Abrarbyte/modelreceipt' },
        { text: 'case study', href: 'https://abrarbyte-portfolio-web.vercel.app/modelreceipt' },
      ]),
      meta('Hackathon demo — simulated attestation, capped at L0  ·  Next.js 15 · TypeScript · Neon Postgres · CooL SDK · Python client'),
      bullet('An OpenAI-compatible drop-in proxy returning a signed receipt for every completion — naming the model, version and deployment, and committing to the prompt and answer without storing either.'),
      bullet("Built an evaluation harness over the gateway: a 20-case golden set with deterministic graders — JSON-shape, numeric, regex and constraint checks — plus an LLM-as-judge tier deliberately held to a lower trust level and scored separately. Each case execution is sealed into a receipt, so every score is independently verifiable against the log rather than taken on the runner's word."),

      entryTitle('Coding-Task Evaluation Harness'),
      meta('Python · Docker · pytest · GitHub Actions'),
      bullet('Built a Docker-based eval harness for code-generation tasks: a Python runner takes a task folder, executes it in an isolated container, runs a hidden pytest suite against the candidate solution and emits a pass/fail JSON report — 20 task environments, 200+ hidden tests, 85% coverage, CI on every push completing in under five minutes.'),
      bullet('Designed tasks around the ways a model fails rather than succeeds — hidden tests the solution cannot read, catching plausible-looking answers that do not satisfy the specification.'),

      // ------------------------------------------------------------ education
      h2('Education'),
      body('Bachelor of Computer Applications (BCA), 2023 – 2026 (final year) — Vivekanand College, Kolhapur  ·  Prepverse ML Contest — strong overall performance'),
    ],
  }],
});

const out = path.join(__dirname, '..', 'Abrar_Patel_AI_ML_Engineer.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log(`${path.basename(out)}  ${(buf.length / 1024).toFixed(0)} KB`);
});
