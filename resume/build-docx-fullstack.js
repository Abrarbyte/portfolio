/* Render the Full Stack Developer resume to .docx, keeping every link clickable.
 *   node resume/build-docx-fullstack.js
 * Mirrors resume/fullstack.html. Edit both, or regenerate this from that.
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

/** Bold lead-in label inside a bullet, e.g. "Python (Django/DRF) — strong:". */
const lead = (text) => t(text, { bold: true });

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

const body = (runs) =>
  new Paragraph({
    spacing: { before: 0, after: 10, line: 215 },
    children: Array.isArray(runs) ? runs : [t(runs)],
  });

const doc = new Document({
  creator: 'M. Abrar Patel',
  title: 'M. Abrar Patel — Full Stack Developer',
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
          text: 'Full Stack Developer  |  Django/DRF · React · Next.js · React Native · PostgreSQL · AWS · Docker',
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
          new TextRun({ text: '  |  Mumbai / India · open to relocate', size: hp(8.6), color: '444444', font: 'Calibri' }),
        ],
      }),

      // --------------------------------------------------------------- summary
      h2('Profile Summary'),
      body([
        t('Full stack developer who ships complete products end-to-end: data model, REST APIs, web and mobile clients, tests, deployment and production support. As the '),
        lead('sole developer at Aarmarks Media, shipped 2 production applications in under 3 months'),
        t(' on Django/DRF with React Native and Flutter clients, deployed on AWS. Also built and launched '),
        lead('DukaanAI'),
        t(', a business platform with 45+ REST endpoints, UPI payments and an LLM assistant. Works well with high ownership in small, fast-moving teams, and uses AI tools every day to build and debug faster.'),
      ]),

      // ---------------------------------------------------------------- skills
      h2('Technical Skills'),
      skill('Languages', 'Python, JavaScript, TypeScript, SQL  ·  also C, C++, C#, PHP'),
      new Paragraph({
        spacing: { before: 0, after: 10, line: 215 },
        children: [
          lead('Front-end: '), t('React, Next.js 15, HTML/CSS    '),
          lead('Mobile: '), t('React Native, Flutter'),
        ],
      }),
      skill('Back-end', 'Django, Django REST Framework, Flask, FastAPI, REST API design, JWT auth, WebSockets (Django Channels), Celery + Redis'),
      skill('Databases', 'PostgreSQL, MySQL, MongoDB, SQLite, Redis  ·  schema design and query optimisation'),
      skill('Cloud & DevOps', 'AWS, Docker, GitHub CI/CD, Nginx, Vercel, Google Cloud Platform'),
      skill('Testing & Practices', 'PyTest, unittest, Git workflows, data structures, design patterns'),
      skill('AI / LLM', 'LangChain, tool-calling agents, OpenAI-compatible gateways, TensorFlow, Keras'),

      // ------------------------------------------------------------ experience
      h2('Experience'),
      entryTitle('Full Stack Developer (Sole Developer) — Aarmarks Media', [
        { text: 'aarmarksmedia.com', href: 'https://aarmarksmedia.com' },
        { text: 'case study', href: 'https://abrarbyte-portfolio-web.vercel.app/aitremarkiq' },
      ]),
      meta('Aug 2026 – Present · TriMarkity SaaS suite'),
      meta('Django 6.1 / DRF · React Native · Flutter · PostgreSQL · MongoDB · Redis · Celery · Docker · AWS · JWT'),
      bullet([lead('Shipped 2 production applications in under 3 months as the only engineer'), t(', owning the data model, REST APIs, mobile clients, tests, AWS deployment and production debugging.')]),
      bullet([lead('SocialSnap: '), t('built a React Native app on a Django/DRF + MongoDB backend that runs a keyword-triggered social-media automation engine.')]),
      bullet([lead('Field-sales CRM: '), t('built a Flutter + Django/DRF + PostgreSQL + Redis app covered by '), lead('~388 automated tests'), t('. Celery Beat generates daily reports at 19:30, and an analytics layer aggregates GPS visits, calls, sales and travel allowance per visit.')]),
      bullet('Centralised role-based access in a single visible_users() policy, so every endpoint applies the same visibility rules.'),
      bullet('Fixed a JWT signature-verification vulnerability and shipped cross-app session revocation to production across the suite.'),

      entryTitle('AI/ML Intern, Backend — ABis Infotech Solutions'),
      meta('Remote · Nov 2025 – May 2026'),
      bullet('Built Django REST Framework APIs that served model-backed features in a live production codebase.'),
      bullet('Added real-time updates with WebSockets (Django Channels); built Python data pipelines with TensorFlow and Keras and supported cloud deployment.'),

      // -------------------------------------------------------------- projects
      h2('Projects'),
      entryTitle('DukaanAI — Business Platform for Shop Owners (Founder)', [
        { text: 'github', href: 'https://github.com/Abrarbyte' },
        { text: 'case study', href: 'https://abrarbyte-portfolio-web.vercel.app/dukaanai' },
      ]),
      meta('Flask · MySQL · SQLAlchemy · Redis · LangChain · Flutter · AWS · Razorpay'),
      bullet([t('Designed, built and deployed the full stack on AWS on my own: Flask API with JWT + bcrypt auth, '), lead('45+ REST endpoints'), t(' over an 8-table MySQL schema, and a '), lead('16-screen'), t(' Flutter app.')]),
      bullet('Integrated Razorpay/UPI payments and WhatsApp automation; added a LangChain tool-calling chatbot in Hindi, plus dead-stock detection and demand prediction.'),

      entryTitle('ModelReceipt — Verifiable Inference Gateway', [
        { text: 'modelreceipt.vercel.app', href: 'https://modelreceipt.vercel.app' },
        { text: 'github', href: 'https://github.com/Abrarbyte/modelreceipt' },
      ]),
      meta('Next.js 15 · React · TypeScript · Neon Postgres · GitHub CI/CD'),
      bullet('Built an OpenAI-compatible proxy in Next.js / TypeScript with provider routing and a durable, append-only Postgres log.'),
      bullet('Built the React verify-and-forge UI and shipped it through a push-to-deploy GitHub CI/CD pipeline.'),

      // ---------------------------------------------------------- achievements
      h2('Achievements'),
      bullet([lead('Reverse Hackathon by COOL — finalist: '), t('qualified for the Product Round (final) '), lead('ranked 2nd of 32 finalists'), t(' from 1,200 participants  ·  '), link('Certificate', 'https://abrarbyte-portfolio-web.vercel.app/certificates/cool-reverse-hackathon.pdf', { size: hp(9.4) })]),

      // ------------------------------------------------------------ education
      h2('Education'),
      body([lead('Bachelor of Computer Applications (BCA)'), t(', 2023 – 2026 — Vivekanand College, Kolhapur')]),
    ],
  }],
});

const out = path.join(__dirname, '..', 'Abrar_Patel_Full_Stack_Developer.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log(`${path.basename(out)}  ${(buf.length / 1024).toFixed(0)} KB`);
});
