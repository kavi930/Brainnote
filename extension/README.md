# Brainnote AI — Chrome & Microsoft Edge Browser Extension (Manifest V3)

Production-ready Manifest V3 browser extension with **Side Panel** support for Chrome, Brave, and Microsoft Edge. Capture any webpage, technical article, or YouTube video and generate deep notes and Staff/Senior interview preparation questions directly in your browser.

---

## 🌟 Key Features

1. **Native Browser Side Panel (`Ctrl+Shift+B` / `Cmd+Shift+B`)**:
   - Stays open alongside any website without interrupting your reading or research workflow.
2. **1-Click Webpage & Technical Article Ingestion**:
   - Automatically extracts clean markdown, author metadata, and `<pre><code>` blocks from technical articles (e.g. `machinelearningmastery.com`, Medium, ArXiv, GitHub docs).
   - Ingests the 4 modular architecture components (Dataset Manager, Model Interface, Metrics Pipeline, Results Logger) directly into Brainnote.
3. **Technical Interview Preparation Studio**:
   - Generates 4+ Staff/Senior technical interview questions, difficulty ratings, authoritative model answers, interviewer rubrics ("What Interviewers Look For"), and copyable Python code patterns.
   - Expandable accordion interface with "Mastered" status tracking.
4. **Preset Testing Support**:
   - One-click `🔥 ML Mastery Preset` button to instantly test with the Machine Learning Mastery LLM Evaluation Harness article.
5. **Multi-Tenant Workspace Selector**:
   - Switch between workspaces on the fly: `Acme Corp (Alex)`, `ScaleUp SaaS (Jordan)`, or `Solopreneur (Dev)`.
6. **Configurable Backend Connectivity**:
   - Supports both `http://localhost:3000` for local dev and cloud Vercel deployments.
7. **Right-Click Context Menu**:
   - Right-click any selected text: *"Save selection to Brainnote"*.
   - Right-click anywhere on the page: *"💼 Generate Technical Interview Q&A with Brainnote AI"*.
8. **Active Recall Study Tools & Grounded Q&A**:
   - Spaced-repetition flashcards with flip animations.
   - Interactive multiple-choice study quizzes with instant grading.
   - Grounded Q&A chat with verifiable citations.

---

## 🚀 How to Install in Chrome or Microsoft Edge (30 Seconds)

1. Open **Google Chrome** or **Microsoft Edge**.
2. In the address bar, open the Extensions page:
   - **Chrome**: `chrome://extensions`
   - **Edge**: `edge://extensions`
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. In the top-left, click **Load unpacked**.
5. Select this folder:
   ```text
   C:\Users\HP\.gemini\antigravity-ide\scratch\brainnote\extension
   ```
   *(Or `D:\Brainnote\extension` if running from Drive D)*
6. The **Brainnote AI** icon will appear in your browser toolbar!
7. Click the extension icon in your toolbar, or press **`Ctrl+Shift+B`** (**`Cmd+Shift+B`** on macOS) to open the side panel while browsing any website or article.

---

## 🔗 Live Backend Verification

Ensure the Brainnote web backend is running:
```powershell
cd C:\Users\HP\.gemini\antigravity-ide\scratch\brainnote
npm run dev
```
By default, the extension communicates with `http://localhost:3000`. To point to a production Vercel deployment, simply click the status pill (`:3000`) in the side panel header and paste your Vercel URL.
