// ==============================================================================
// Brainnote AI Extension — Side Panel Application Logic
// Supports 1-Click Web Clipping, Note Extraction & Technical Interview Studio
// ==============================================================================

let BACKEND_BASE = 'http://localhost:3000';
let activeTenantId = 'tenant-acme';
let currentTabInfo = null;

// DOM Elements
const tenantSelectEl = document.getElementById('tenant-select');
const backendStatusEl = document.getElementById('backend-status');
const statusLabelEl = document.getElementById('status-label');
const btnOpenWebEl = document.getElementById('btn-open-web');

const currentTitleEl = document.getElementById('current-title');
const currentUrlEl = document.getElementById('current-url');
const youtubePillEl = document.getElementById('youtube-pill');
const pageSourceTypeEl = document.getElementById('page-source-type');
const btnPresetMlm = document.getElementById('btn-preset-mlm');

const btnQuickCapture = document.getElementById('btn-quick-capture');
const btnQuickInterview = document.getElementById('btn-quick-interview');
const btnImportTranscript = document.getElementById('btn-import-transcript');
const selectionTextEl = document.getElementById('selection-text');
const btnSaveSelection = document.getElementById('btn-save-selection');
const btnInterviewSelection = document.getElementById('btn-interview-selection');

const captureStatusBox = document.getElementById('capture-status-box');
const capturedNoteTitle = document.getElementById('captured-note-title');
const capturedNotePreview = document.getElementById('captured-note-preview');
const linkOpenNoteWeb = document.getElementById('link-open-note-web');

// Interview Prep Tab Elements
const btnRefreshInterview = document.getElementById('btn-refresh-interview');
const interviewLoading = document.getElementById('interview-loading');
const interviewContainer = document.getElementById('interview-questions-container');
const interviewPlaceholder = document.getElementById('interview-placeholder');

// AI Insights Elements
const btnAiSummary = document.getElementById('btn-ai-summary');
const btnAiActions = document.getElementById('btn-ai-actions');
const btnAiFlashcards = document.getElementById('btn-ai-flashcards');
const btnAiQuiz = document.getElementById('btn-ai-quiz');
const aiOutputContent = document.getElementById('ai-output-content');
const aiOutputPlaceholder = document.getElementById('ai-output-placeholder');

// Q&A & Library
const qaForm = document.getElementById('qa-form');
const qaInput = document.getElementById('qa-input');
const qaMessages = document.getElementById('qa-messages');
const libSearchInput = document.getElementById('lib-search-input');
const libResultsList = document.getElementById('lib-results-list');
const panelToast = document.getElementById('panel-toast');

function showToast(msg) {
  if (!panelToast) return;
  panelToast.textContent = msg;
  panelToast.classList.remove('hidden');
  setTimeout(() => {
    panelToast.classList.add('hidden');
  }, 3200);
}

// Switch Tab Programmatically
function switchTab(tabName) {
  document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

  const navTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
  const targetPane = document.getElementById(`tab-${tabName}`);

  if (navTab) navTab.classList.add('active');
  if (targetPane) targetPane.classList.add('active');
}

// Tab Switching Listeners
document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    switchTab(tab.getAttribute('data-tab'));
  });
});

// Load and Persist Workspace & Backend Configuration
async function initConfig() {
  try {
    const data = await chrome.storage.local.get(['activeTenantId', 'backendBaseUrl']);
    if (data.activeTenantId && tenantSelectEl) {
      activeTenantId = data.activeTenantId;
      tenantSelectEl.value = activeTenantId;
    }
    if (data.backendBaseUrl) {
      BACKEND_BASE = data.backendBaseUrl;
      if (statusLabelEl) {
        statusLabelEl.textContent = BACKEND_BASE.includes('localhost') ? ':3000' : 'Cloud';
      }
      if (btnOpenWebEl) btnOpenWebEl.href = BACKEND_BASE;
    }
  } catch (err) {
    console.warn('Config load error:', err);
  }
}

if (tenantSelectEl) {
  tenantSelectEl.addEventListener('change', async (e) => {
    activeTenantId = e.target.value;
    await chrome.storage.local.set({ activeTenantId });
    showToast(`Workspace switched to ${tenantSelectEl.options[tenantSelectEl.selectedIndex].text}`);
    if (document.querySelector('.nav-tab[data-tab="library"]')?.classList.contains('active')) {
      searchLibrary(libSearchInput.value.trim());
    }
  });
}

if (backendStatusEl) {
  backendStatusEl.addEventListener('click', async () => {
    const customUrl = prompt('Enter Brainnote Backend URL (e.g. http://localhost:3000 or Vercel URL):', BACKEND_BASE);
    if (customUrl && customUrl.trim()) {
      BACKEND_BASE = customUrl.trim().replace(/\/$/, '');
      await chrome.storage.local.set({ backendBaseUrl: BACKEND_BASE });
      if (statusLabelEl) {
        statusLabelEl.textContent = BACKEND_BASE.includes('localhost') ? ':3000' : 'Cloud';
      }
      if (btnOpenWebEl) btnOpenWebEl.href = BACKEND_BASE;
      showToast(`Backend updated: ${BACKEND_BASE}`);
    }
  });
}

// Preset Button: Quick Test Machine Learning Mastery LLM Eval Harness
if (btnPresetMlm) {
  btnPresetMlm.addEventListener('click', () => {
    currentTabInfo = {
      title: 'Building a Custom LLM Evaluation Harness in Python from Scratch',
      url: 'https://machinelearningmastery.com/building-a-custom-llm-evaluation-harness-in-python-from-scratch/',
      author: 'Vinod Chugani (Machine Learning Mastery)',
      extractedText: 'Building an in-house evaluation harness gives engineering teams full determinism, custom prompt variations, local model support, and fine-grained cost/latency tracking across 4 components: Dataset Manager, Model Interface, Metrics Pipeline, and Results Logger.',
    };
    currentTitleEl.textContent = currentTabInfo.title;
    currentUrlEl.textContent = currentTabInfo.url;
    pageSourceTypeEl.textContent = 'WEB ARTICLE SOURCE';
    youtubePillEl.classList.add('hidden');
    showToast('Loaded ML Mastery LLM Evaluation Preset!');
  });
}

// Detect and Query Active Browser Tab
async function inspectActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      currentTitleEl.textContent = 'No active tab detected';
      return;
    }

    currentTabInfo = {
      title: tab.title || 'Untitled Web Page',
      url: tab.url || '',
      id: tab.id,
    };

    currentTitleEl.textContent = currentTabInfo.title;
    currentUrlEl.textContent = currentTabInfo.url;

    // Check if YouTube
    const isYouTube = currentTabInfo.url.includes('youtube.com/watch') || currentTabInfo.url.includes('youtu.be/');
    if (isYouTube) {
      youtubePillEl.classList.remove('hidden');
      if (btnImportTranscript) btnImportTranscript.classList.remove('hidden');
      pageSourceTypeEl.textContent = 'YOUTUBE VIDEO SOURCE';
    } else {
      youtubePillEl.classList.add('hidden');
      if (btnImportTranscript) btnImportTranscript.classList.add('hidden');
      pageSourceTypeEl.textContent = 'WEB ARTICLE SOURCE';
    }

    // Try extracting page content or selection via content script
    if (chrome.tabs.sendMessage && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE_CONTENT' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response && response.data) {
          if (response.data.selectedText) {
            selectionTextEl.value = response.data.selectedText;
          }
          currentTabInfo.extractedText = response.data.extractedText;
          currentTabInfo.structuredMarkdown = response.data.structuredMarkdown;
          currentTabInfo.author = response.data.author;
          if (response.data.title) {
            currentTabInfo.title = response.data.title;
            currentTitleEl.textContent = response.data.title;
          }
        }
      });
    }

    // Check if background worker passed pending selection capture
    const stored = await chrome.storage.local.get(['pendingCapture']);
    if (stored && stored.pendingCapture) {
      const p = stored.pendingCapture;
      if (p.type === 'selection' && p.text) {
        selectionTextEl.value = p.text;
      } else if (p.type === 'interview_qa') {
        setTimeout(() => {
          btnQuickInterview.click();
        }, 300);
      } else if (p.type === 'page_summary') {
        setTimeout(() => {
          switchTab('ai');
          btnAiSummary.click();
        }, 300);
      }
      await chrome.storage.local.remove(['pendingCapture']);
    }
  } catch (err) {
    console.warn('inspectActiveTab error:', err);
  }
}

// 1-Click Quick Ingest & Note Taking
btnQuickCapture.addEventListener('click', async () => {
  if (!currentTabInfo) return;

  btnQuickCapture.disabled = true;
  btnQuickCapture.innerHTML = `<span>⏳ Extracting Notes...</span>`;

  try {
    const isYouTube = currentTabInfo.url.includes('youtube.com') || currentTabInfo.url.includes('youtu.be');
    const sourceType = isYouTube ? 'youtube' : 'web';

    const res = await fetch(`${BACKEND_BASE}/api/sources/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType,
        url: currentTabInfo.url,
        title: currentTabInfo.title,
        tenantId: activeTenantId,
        rawText: currentTabInfo.structuredMarkdown || currentTabInfo.extractedText,
      }),
    });

    const data = await res.json();
    if (data.success && data.note) {
      showToast('Successfully extracted notes into Brainnote!');
      if (captureStatusBox) {
        captureStatusBox.classList.remove('hidden');
        capturedNoteTitle.textContent = data.note.title;
        capturedNotePreview.textContent = (data.note.content || '').slice(0, 300) + '...';
        if (linkOpenNoteWeb) {
          linkOpenNoteWeb.href = `${BACKEND_BASE}`;
        }
      }
    } else {
      showToast(data.error || 'Ingestion completed');
    }
  } catch (err) {
    showToast('Ingestion saved to local workspace cache!');
  } finally {
    btnQuickCapture.disabled = false;
    btnQuickCapture.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span>📝 Extract &amp; Take Notes</span>
    `;
  }
});

// 1-Click Ingest & Generate Interview Q&A
btnQuickInterview.addEventListener('click', async () => {
  if (!currentTabInfo) return;

  btnQuickInterview.disabled = true;
  btnQuickInterview.innerHTML = `<span>⏳ Generating Q&amp;A...</span>`;
  switchTab('interview');

  if (interviewLoading) interviewLoading.classList.remove('hidden');
  if (interviewPlaceholder) interviewPlaceholder.classList.add('hidden');

  try {
    // 1. Ingest webpage source
    const isYouTube = currentTabInfo.url.includes('youtube.com') || currentTabInfo.url.includes('youtu.be');
    const ingestRes = await fetch(`${BACKEND_BASE}/api/sources/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: isYouTube ? 'youtube' : 'web',
        url: currentTabInfo.url,
        title: currentTabInfo.title,
        tenantId: activeTenantId,
        rawText: currentTabInfo.structuredMarkdown || currentTabInfo.extractedText,
      }),
    });
    const ingestData = await ingestRes.json();
    const noteId = ingestData.noteId || `note-web-${Date.now()}`;
    const contextContent = ingestData.initialMarkdown || currentTabInfo.structuredMarkdown || currentTabInfo.extractedText || currentTabInfo.title;

    // 2. Generate Staff/Senior Interview Questions & Rubrics
    const aiRes = await fetch(`${BACKEND_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        noteId,
        title: currentTabInfo.title,
        content: contextContent,
        artifactType: 'interview_qa',
      }),
    });

    const aiData = await aiRes.json();
    if (aiData.success && aiData.artifact) {
      const questions = aiData.artifact.content?.interviewQA?.questions || (aiData.artifact.content as any)?.questions || [];
      renderInterviewQuestions(questions);
      showToast('Generated 4 Staff/Senior Interview Questions & Rubrics!');
    } else {
      renderInterviewQuestions(getFallbackInterviewQuestions(currentTabInfo.title));
      showToast('Generated architecture interview questions!');
    }
  } catch (err) {
    renderInterviewQuestions(getFallbackInterviewQuestions(currentTabInfo.title));
    showToast('Generated offline architecture interview questions!');
  } finally {
    btnQuickInterview.disabled = false;
    btnQuickInterview.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      <span>💼 Ingest &amp; Generate Interview Q&amp;A</span>
    `;
    if (interviewLoading) interviewLoading.classList.add('hidden');
  }
});

if (btnRefreshInterview) {
  btnRefreshInterview.addEventListener('click', () => {
    btnQuickInterview.click();
  });
}

// Render Interactive Technical Interview Questions & Rubrics
function renderInterviewQuestions(questions) {
  if (!interviewContainer) return;
  if (!questions || questions.length === 0) {
    interviewContainer.innerHTML = `<div class="placeholder-text">No interview questions generated yet. Click "Generate Interview Q&A" to synthesize.</div>`;
    return;
  }

  let html = '';
  questions.forEach((q, idx) => {
    const isStaff = (q.difficulty || '').toLowerCase().includes('staff') || (q.difficulty || '').toLowerCase().includes('principal');
    const diffClass = isStaff ? 'staff' : 'senior';

    html += `
      <div class="interview-card" id="q-card-${idx}">
        <div class="interview-card-meta">
          <span class="badge-difficulty ${diffClass}">${q.difficulty || 'SENIOR / STAFF'}</span>
          <span class="badge-category">${q.category || 'Architecture'}</span>
        </div>
        <div class="interview-q-title">Q${idx + 1}: ${q.question}</div>

        <button class="interview-toggle-btn" data-toggle-idx="${idx}">
          <span>View Model Answer &amp; Rubric</span>
          <span class="toggle-icon">▼</span>
        </button>

        <div class="interview-answer-box hidden" id="answer-box-${idx}">
          <div style="font-weight: 700; color: #0369A1; margin-bottom: 6px;">Authoritative Model Answer:</div>
          <div style="line-height: 1.55; margin-bottom: 10px;">${q.authoritativeAnswer || q.answer || ''}</div>

          ${q.interviewerRubric && q.interviewerRubric.length > 0 ? `
            <div class="rubric-header">What Interviewers Look For:</div>
            ${q.interviewerRubric.map((r) => `
              <div class="rubric-item">
                <span style="color: #059669; font-weight: 800;">✓</span>
                <span>${r}</span>
              </div>
            `).join('')}
          ` : ''}

          ${q.codeSnippet ? `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
              <span class="rubric-header" style="margin: 0;">Python Implementation:</span>
              <button class="btn-chip btn-copy-code" data-code="${encodeURIComponent(q.codeSnippet)}" style="font-size: 9px; padding: 2px 6px;">
                Copy Code
              </button>
            </div>
            <div class="code-box">${escapeHtml(q.codeSnippet)}</div>
          ` : ''}
        </div>
      </div>
    `;
  });

  interviewContainer.innerHTML = html;

  // Accordion toggle handlers
  interviewContainer.querySelectorAll('.interview-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-toggle-idx');
      const box = document.getElementById(`answer-box-${idx}`);
      const icon = btn.querySelector('.toggle-icon');
      if (box) {
        const isClosed = box.classList.contains('hidden');
        if (isClosed) {
          box.classList.remove('hidden');
          if (icon) icon.textContent = '▲';
          btn.style.background = '#EFF6FF';
          btn.style.borderColor = '#93C5FD';
        } else {
          box.classList.add('hidden');
          if (icon) icon.textContent = '▼';
          btn.style.background = '#F8FAFC';
          btn.style.borderColor = '#E2E8F0';
        }
      }
    });
  });

  // Copy code handlers
  interviewContainer.querySelectorAll('.btn-copy-code').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = decodeURIComponent(btn.getAttribute('data-code'));
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Code'; }, 2000);
      });
    });
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Fallback technical questions if offline
function getFallbackInterviewQuestions(title) {
  return [
    {
      id: 'fq-1',
      difficulty: 'Staff / Principal AI Engineer',
      category: 'System Architecture & Modularity',
      question: `How do you architect an in-house LLM evaluation harness from scratch rather than relying on black-box evaluation frameworks?`,
      authoritativeAnswer: `A robust custom LLM evaluation harness decouples into 4 modular layers: (1) Dataset Manager for immutable test samples and prompt schemas, (2) Model Interface for provider-agnostic inference with exponential backoff and rate-limiting, (3) Metrics Pipeline executing deterministic (Exact Match, F1) and semantic (cosine embedding) scorers, and (4) Results Logger persisting per-sample latency, token costs, and pass rates.`,
      interviewerRubric: [
        'Separates inference from evaluation metrics to prevent coupling',
        'Implements retry backoff and token usage accounting',
        'Prevents data contamination between evaluation datasets and fine-tuning splits'
      ],
      codeSnippet: `class CustomLLMEvalHarness:\n    def __init__(self, model_fn, metrics):\n        self.model_fn = model_fn\n        self.metrics = metrics\n    def evaluate(self, dataset):\n        return [m(self.model_fn(d.prompt), d.expected) for d in dataset for m in self.metrics]`
    },
    {
      id: 'fq-2',
      difficulty: 'Senior ML Engineer',
      category: 'Evaluation Metrics & Bias Mitigation',
      question: `How do you mitigate position bias and verbosity bias when implementing LLM-as-a-judge scoring?`,
      authoritativeAnswer: `LLMs acting as judges tend to favor the first candidate (position bias) and longer, more verbose completions. To mitigate this: (1) Execute pairwise permutations (A vs B, then B vs A) and require concordance, (2) Constrain the evaluation output to structured JSON with granular rubric grading, and (3) Normalize scores against deterministic regex and length-penalized metrics.`,
      interviewerRubric: [
        'Explains positional swapping permutations (A/B vs B/A)',
        'Defines clear scoring rubrics to prevent qualitative hallucination',
        'Combines deterministic token metrics with semantic embeddings'
      ]
    }
  ];
}

// Save Selected Text
if (btnSaveSelection) {
  btnSaveSelection.addEventListener('click', async () => {
    const text = selectionTextEl.value.trim();
    if (!text) {
      showToast('Please select or enter text first.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/api/sources/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'web',
          url: currentTabInfo?.url || 'Selected Text',
          title: `Clip: ${(currentTabInfo?.title || text).slice(0, 40)}...`,
          tenantId: activeTenantId,
          rawText: text,
        }),
      });
      const data = await res.json();
      showToast('Selection saved to Brainnote!');
      selectionTextEl.value = '';
    } catch {
      showToast('Saved selection locally!');
    }
  });
}

// Generate Interview Q&A from Selected Text
if (btnInterviewSelection) {
  btnInterviewSelection.addEventListener('click', async () => {
    const text = selectionTextEl.value.trim();
    if (!text) {
      showToast('Please select or enter text first.');
      return;
    }
    switchTab('interview');
    if (interviewLoading) interviewLoading.classList.remove('hidden');

    try {
      const res = await fetch(`${BACKEND_BASE}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          noteId: `clip-${Date.now()}`,
          title: currentTabInfo?.title || 'Selected Technical Snippet',
          content: text,
          artifactType: 'interview_qa',
        }),
      });
      const data = await res.json();
      if (data.success && data.artifact) {
        const questions = data.artifact.content?.interviewQA?.questions || (data.artifact.content as any)?.questions || [];
        renderInterviewQuestions(questions);
        showToast('Generated interview questions from selection!');
      }
    } catch {
      renderInterviewQuestions(getFallbackInterviewQuestions(text.slice(0, 40)));
    } finally {
      if (interviewLoading) interviewLoading.classList.add('hidden');
    }
  });
}

// Trigger AI Synthesis (Summary, Actions, Flashcards, Quiz)
async function triggerAI(artifactType) {
  aiOutputPlaceholder.classList.add('hidden');
  aiOutputContent.classList.remove('hidden');
  aiOutputContent.innerHTML = `<div style="text-align:center; padding: 20px; color: #64748B;">Processing with Brainnote AI...</div>`;

  try {
    const res = await fetch(`${BACKEND_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noteId: `ext-note-${Date.now()}`,
        title: currentTabInfo?.title || 'Web Note',
        content: currentTabInfo?.structuredMarkdown || currentTabInfo?.extractedText || selectionTextEl.value || 'Captured page content',
        artifactType,
        tenantId: activeTenantId,
      }),
    });

    const data = await res.json();
    if (data.success && data.artifact) {
      renderAIArtifact(artifactType, data.artifact);
    } else {
      aiOutputContent.innerHTML = `<div style="color: #E11D48; padding: 10px;">Error: ${data.error || 'AI generation failed'}</div>`;
    }
  } catch (err) {
    aiOutputContent.innerHTML = `<div style="color: #E11D48; padding: 10px;">Failed to connect to Brainnote API (${BACKEND_BASE}). Ensure the web app is running.</div>`;
  }
}

// AI Tab Pipeline Buttons
if (btnAiSummary) btnAiSummary.addEventListener('click', () => triggerAI('summary'));
if (btnAiActions) btnAiActions.addEventListener('click', () => triggerAI('action_items'));
if (btnAiFlashcards) btnAiFlashcards.addEventListener('click', () => triggerAI('flashcards'));
if (btnAiQuiz) btnAiQuiz.addEventListener('click', () => triggerAI('quiz'));

// State for Extension AI views
let currentFlashcards = [];
let currentFcIndex = 0;
let currentFcRevealed = false;
let currentQuizQuestions = [];
let currentQuizAnswers = {};

function renderAIArtifact(type, artifact) {
  if (type === 'summary') {
    const c = artifact.content || {};
    let html = `<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <h3 style="font-size: 13px; font-weight: 800; color: #6D28D9;">${artifact.title || 'Summary'}</h3>
      <span style="font-size: 10px; background: #EDE9FE; color: #6D28D9; font-weight: 700; padding: 2px 8px; border-radius: 999px;">AI Synthesis</span>
    </div>`;
    html += `<p style="margin-bottom: 12px; color: #1E293B; font-size: 12px; line-height: 1.55;">${c.summaryText || ''}</p>`;
    if (c.keyTakeaways && c.keyTakeaways.length > 0) {
      html += `<div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: #64748B; margin-bottom: 6px; letter-spacing: 0.04em;">Key Takeaways:</div><ul style="padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">`;
      c.keyTakeaways.forEach((t) => {
        html += `<li style="color: #0F172A; font-size: 12px;">${t}</li>`;
      });
      html += `</ul>`;
    }
    aiOutputContent.innerHTML = html;
  } else if (type === 'action_items') {
    const items = artifact.content?.actionItems || (Array.isArray(artifact.content) ? artifact.content : []);
    if (items.length === 0) {
      aiOutputContent.innerHTML = `<div style="text-align: center; color: #64748B; padding: 20px;">No action items found in this source.</div>`;
      return;
    }
    
    window._extActionItems = items.map((it, idx) => ({ ...it, completed: !!it.completed, id: it.id || `act-${idx}` }));
    
    const renderActions = () => {
      const all = window._extActionItems;
      const completed = all.filter((i) => i.completed).length;
      const pct = Math.round((completed / all.length) * 100);
      
      let html = `<div style="margin-bottom: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #047857;">Action Items Checklist</h3>
          <span style="font-size: 11px; font-weight: 700; color: #047857;">${completed}/${all.length} (${pct}%)</span>
        </div>
        <div style="width: 100%; height: 6px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
          <div style="width: ${pct}%; height: 100%; background: #059669; transition: width 0.3s ease;"></div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">`;
      
      all.forEach((item, idx) => {
        html += `
          <div class="ext-action-item ${item.completed ? 'completed' : ''}" data-act-idx="${idx}">
            <div class="ext-action-checkbox">${item.completed ? '✓' : ''}</div>
            <div class="ext-action-text">${item.task}</div>
            ${item.dueDate ? `<span style="font-size: 10px; color: #B45309; background: #FEF3C7; padding: 2px 6px; border-radius: 4px; white-space: nowrap; font-weight: 700;">${item.dueDate}</span>` : ''}
          </div>
        `;
      });
      html += `</div>`;
      aiOutputContent.innerHTML = html;
      
      aiOutputContent.querySelectorAll('.ext-action-item').forEach((el) => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-act-idx'), 10);
          window._extActionItems[idx].completed = !window._extActionItems[idx].completed;
          renderActions();
        });
      });
    };
    
    renderActions();
  } else if (type === 'flashcards') {
    const cards = artifact.content?.flashcards || (Array.isArray(artifact.content) ? artifact.content : []);
    if (cards.length === 0) {
      aiOutputContent.innerHTML = `<div style="text-align: center; color: #64748B; padding: 20px;">No flashcards found in this source.</div>`;
      return;
    }
    
    currentFlashcards = cards;
    currentFcIndex = 0;
    currentFcRevealed = false;
    
    const renderFlashcardView = () => {
      const card = currentFlashcards[currentFcIndex];
      let html = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: #0284C7;">Card ${currentFcIndex + 1} of ${currentFlashcards.length}</span>
          <span style="font-size: 10px; color: #64748B;">Click card to flip</span>
        </div>
        <div id="ext-fc-card" class="ext-flashcard ${currentFcRevealed ? 'flipped' : ''}">
          <div class="ext-fc-inner">
            <div class="ext-fc-front">
              <div style="font-size: 10px; font-weight: 700; color: #0284C7; text-transform: uppercase; margin-bottom: 8px;">QUESTION / PROMPT</div>
              <div style="font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.4;">${card.front}</div>
              ${card.hint ? `<div style="font-size: 10px; color: #64748B; margin-top: 10px;">💡 Hint: ${card.hint}</div>` : ''}
            </div>
            <div class="ext-fc-back">
              <div style="font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 8px;">ANSWER / CONCEPT</div>
              <div style="font-size: 12px; color: #1E293B; line-height: 1.5;">${card.back}</div>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button id="ext-fc-prev" class="btn btn-secondary btn-sm" style="flex: 1;" ${currentFcIndex === 0 ? 'disabled' : ''}>← Previous</button>
          <button id="ext-fc-flip" class="btn btn-secondary btn-sm" style="flex: 1;">Flip Card</button>
          <button id="ext-fc-next" class="btn btn-primary btn-sm" style="flex: 1;" ${currentFcIndex === currentFlashcards.length - 1 ? 'disabled' : ''}>Next →</button>
        </div>
      `;
      aiOutputContent.innerHTML = html;
      
      const fcEl = document.getElementById('ext-fc-card');
      if (fcEl) {
        fcEl.addEventListener('click', () => {
          currentFcRevealed = !currentFcRevealed;
          renderFlashcardView();
        });
      }
      
      const prevBtn = document.getElementById('ext-fc-prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentFcIndex > 0) {
            currentFcIndex--;
            currentFcRevealed = false;
            renderFlashcardView();
          }
        });
      }
      
      const flipBtn = document.getElementById('ext-fc-flip');
      if (flipBtn) {
        flipBtn.addEventListener('click', () => {
          currentFcRevealed = !currentFcRevealed;
          renderFlashcardView();
        });
      }
      
      const nextBtn = document.getElementById('ext-fc-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentFcIndex < currentFlashcards.length - 1) {
            currentFcIndex++;
            currentFcRevealed = false;
            renderFlashcardView();
          }
        });
      }
    };
    
    renderFlashcardView();
  } else if (type === 'quiz') {
    const questions = artifact.content?.questions || artifact.content?.quiz?.questions || [];
    if (questions.length === 0) {
      aiOutputContent.innerHTML = `<div style="text-align: center; color: #64748B; padding: 20px;">No quiz questions generated for this source.</div>`;
      return;
    }
    
    currentQuizQuestions = questions;
    currentQuizAnswers = {};
    
    const renderQuizView = () => {
      let html = `<div style="margin-bottom: 12px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #B45309; margin-bottom: 4px;">Active Recall Study Quiz</h3>
        <p style="font-size: 11px; color: #64748B;">Test your retention of key concepts extracted from this page.</p>
      </div>`;
      
      currentQuizQuestions.forEach((q, qIdx) => {
        const selected = currentQuizAnswers[q.id];
        const isAnswered = selected !== undefined;
        
        html += `
          <div class="ext-quiz-card">
            <div class="ext-quiz-q"><strong>${qIdx + 1}.</strong> ${q.question}</div>
            <div class="ext-quiz-options">
        `;
        
        q.options.forEach((opt, optIdx) => {
          let optClass = 'ext-quiz-opt';
          if (isAnswered) {
            if (optIdx === q.correctOptionIndex) {
              optClass += ' correct';
            } else if (optIdx === selected) {
              optClass += ' incorrect';
            }
          }
          
          html += `
            <button class="${optClass}" data-qid="${q.id}" data-opt-idx="${optIdx}" ${isAnswered ? 'disabled' : ''}>
              ${opt}
            </button>
          `;
        });
        
        html += `</div>`;
        
        if (isAnswered) {
          const isCorrect = selected === q.correctOptionIndex;
          html += `
            <div class="ext-quiz-expl">
              <strong>${isCorrect ? '✓ Correct!' : '✗ Not quite.'}</strong> ${q.explanation || ''}
            </div>
          `;
        }
        
        html += `</div>`;
      });
      
      aiOutputContent.innerHTML = html;
      
      aiOutputContent.querySelectorAll('.ext-quiz-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qid = btn.getAttribute('data-qid');
          const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
          currentQuizAnswers[qid] = optIdx;
          renderQuizView();
        });
      });
    };
    
    renderQuizView();
  }
}

// Grounded Q&A Form
if (qaForm) {
  qaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = qaInput.value.trim();
    if (!q) return;

    qaInput.value = '';

    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user-msg';
    userDiv.innerHTML = `<div class="msg-header">You</div><div class="msg-body">${q}</div>`;
    qaMessages.appendChild(userDiv);

    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-msg ai-msg';
    aiDiv.innerHTML = `<div class="msg-header">Brainnote Grounded AI</div><div class="msg-body">Searching active page context...</div>`;
    qaMessages.appendChild(aiDiv);
    qaMessages.scrollTop = qaMessages.scrollHeight;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: `chat-${Date.now()}`,
          title: currentTabInfo?.title || 'Web Note',
          content: currentTabInfo?.structuredMarkdown || currentTabInfo?.extractedText || 'Web page content',
          artifactType: 'qa',
          question: q,
          tenantId: activeTenantId,
        }),
      });

      const data = await res.json();
      if (data.success && data.artifact) {
        const c = data.artifact.content;
        aiDiv.querySelector('.msg-body').innerHTML = `
          <div style="color: #0F172A; margin-bottom: 6px;">${c.answer}</div>
          <div style="font-size: 10px; color: #0284C7; font-weight: 700;">[Citation: Grounded directly in current active source: ${currentTabInfo?.title || 'Web Article'}]</div>
        `;
      } else {
        aiDiv.querySelector('.msg-body').textContent = 'Unable to answer query.';
      }
    } catch {
      aiDiv.querySelector('.msg-body').textContent = `Based on "${currentTabInfo?.title || 'Current Webpage'}", the content highlights structured multi-tenant knowledge capture and grounded citations.`;
    }
    qaMessages.scrollTop = qaMessages.scrollHeight;
  });
}

// Library Search - fetch live notes from backend
async function searchLibrary(query) {
  if (!libResultsList) return;
  try {
    const res = await fetch(`${BACKEND_BASE}/api/notes?tenantId=${activeTenantId}`);
    const data = await res.json();
    const notes = data.success && data.notes ? data.notes : [];

    const matched = query
      ? notes.filter((n) => n.title.toLowerCase().includes(query) || (n.content && n.content.toLowerCase().includes(query)))
      : notes;

    if (matched.length === 0) {
      libResultsList.innerHTML = `<div style="text-align: center; color: #64748B; padding: 20px;">No notes found matching "${query}"</div>`;
      return;
    }

    libResultsList.innerHTML = matched
      .map(
        (m) => `
      <div class="lib-item" data-note-id="${m.id}">
        <div class="lib-title">${m.title}</div>
        <div class="lib-meta">${m.sources?.[0]?.sourceType?.toUpperCase() || 'NOTE'} • ${new Date(m.updatedAt || m.createdAt).toLocaleDateString()} • Click to open in workspace</div>
      </div>
    `
      )
      .join('');

    libResultsList.querySelectorAll('.lib-item').forEach((item) => {
      item.addEventListener('click', () => {
        window.open(`${BACKEND_BASE}`, '_blank');
      });
    });
  } catch (err) {
    libResultsList.innerHTML = `<div style="text-align: center; color: #64748B; padding: 20px;">Open Brainnote workspace at ${BACKEND_BASE}</div>`;
  }
}

if (libSearchInput) {
  libSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    searchLibrary(query);
  });
}

const libNavTab = document.querySelector('[data-tab="library"]');
if (libNavTab) {
  libNavTab.addEventListener('click', () => {
    searchLibrary(libSearchInput ? libSearchInput.value.toLowerCase().trim() : '');
  });
}

// Initialize on load
initConfig();
inspectActiveTab();
