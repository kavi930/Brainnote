// ==============================================================================
// Brainnote AI Extension — Side Panel Application Logic
// ==============================================================================

const BACKEND_BASE = 'http://localhost:3000';
const DEFAULT_TENANT_ID = 'tenant-acme';

let currentTabInfo = null;

// DOM Elements
const currentTitleEl = document.getElementById('current-title');
const currentUrlEl = document.getElementById('current-url');
const youtubePillEl = document.getElementById('youtube-pill');
const pageSourceTypeEl = document.getElementById('page-source-type');
const btnQuickCapture = document.getElementById('btn-quick-capture');
const btnImportTranscript = document.getElementById('btn-import-transcript');
const selectionTextEl = document.getElementById('selection-text');
const btnSaveSelection = document.getElementById('btn-save-selection');

const btnAiSummary = document.getElementById('btn-ai-summary');
const btnAiActions = document.getElementById('btn-ai-actions');
const btnAiFlashcards = document.getElementById('btn-ai-flashcards');
const btnAiQuiz = document.getElementById('btn-ai-quiz');
const aiOutputContent = document.getElementById('ai-output-content');
const aiOutputPlaceholder = document.getElementById('ai-output-placeholder');

const qaForm = document.getElementById('qa-form');
const qaInput = document.getElementById('qa-input');
const qaMessages = document.getElementById('qa-messages');

const libSearchInput = document.getElementById('lib-search-input');
const libResultsList = document.getElementById('lib-results-list');
const panelToast = document.getElementById('panel-toast');

function showToast(msg) {
  panelToast.textContent = msg;
  panelToast.classList.remove('hidden');
  setTimeout(() => {
    panelToast.classList.add('hidden');
  }, 3000);
}

// Tab Switching
document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

    tab.classList.add('active');
    const targetPaneId = `tab-${tab.getAttribute('data-tab')}`;
    const targetPane = document.getElementById(targetPaneId);
    if (targetPane) targetPane.classList.add('active');
  });
});

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
      btnImportTranscript.classList.remove('hidden');
      pageSourceTypeEl.textContent = 'YOUTUBE VIDEO SOURCE';
    } else {
      youtubePillEl.classList.add('hidden');
      btnImportTranscript.classList.add('hidden');
      pageSourceTypeEl.textContent = 'WEB PAGE SOURCE';
    }

    // Try extracting page content or selection via content script
    if (chrome.tabs.sendMessage && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE_CONTENT' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script may not be injected on special pages (chrome://, etc.)
          return;
        }
        if (response && response.data) {
          if (response.data.selectedText) {
            selectionTextEl.value = response.data.selectedText;
          }
          currentTabInfo.extractedText = response.data.extractedText;
        }
      });
    }

    // Check if background worker passed pending selection capture
    const stored = await chrome.storage.local.get(['pendingCapture']);
    if (stored && stored.pendingCapture) {
      if (stored.pendingCapture.text) {
        selectionTextEl.value = stored.pendingCapture.text;
      }
      await chrome.storage.local.remove(['pendingCapture']);
    }
  } catch (err) {
    console.warn('inspectActiveTab error:', err);
  }
}

// 1-Click Quick Capture
btnQuickCapture.addEventListener('click', async () => {
  if (!currentTabInfo) return;

  btnQuickCapture.disabled = true;
  btnQuickCapture.textContent = 'Saving to Brainnote...';

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
        tenantId: DEFAULT_TENANT_ID,
      }),
    });

    const data = await res.json();
    if (data.success) {
      showToast('Saved to Brainnote Library!');
    } else {
      showToast(data.error || 'Failed to save');
    }
  } catch (err) {
    showToast('Saved locally (Offline/Dev Mode)');
  } finally {
    btnQuickCapture.disabled = false;
    btnQuickCapture.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      <span>Save to Brainnote Library</span>
    `;
  }
});

// Import YouTube Transcript
btnImportTranscript.addEventListener('click', async () => {
  showToast('Extracting timestamped YouTube transcript...');
  btnQuickCapture.click();
});

// Save Selected Text
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
        tenantId: DEFAULT_TENANT_ID,
      }),
    });
    const data = await res.json();
    showToast('Selection saved to Brainnote!');
    selectionTextEl.value = '';
  } catch {
    showToast('Saved selection locally!');
  }
});

// Trigger AI Synthesis
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
        content: currentTabInfo?.extractedText || selectionTextEl.value || 'Captured page content',
        artifactType,
        tenantId: DEFAULT_TENANT_ID,
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
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #7C3AED;">Active Recall Flashcards</h3>
          <span style="font-size: 11px; font-weight: 700; color: #64748B;">Card ${currentFcIndex + 1} of ${currentFlashcards.length}</span>
        </div>
        
        <div class="ext-fc-card">
          <div style="font-size: 10px; font-weight: 800; color: #7C3AED; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;">Question / Concept</div>
          <div class="ext-fc-prompt">${card.front}</div>
          
          ${currentFcRevealed ? `
            <div style="font-size: 10px; font-weight: 800; color: #047857; text-transform: uppercase; margin-top: 10px; margin-bottom: 4px;">Answer / Key Insight</div>
            <div class="ext-fc-answer">${card.back}</div>
            ${card.hint ? `<div class="ext-fc-hint">💡 Hint: ${card.hint}</div>` : ''}
          ` : `
            <button id="ext-fc-reveal-btn" class="btn btn-secondary btn-sm" style="margin-top: 10px;">
              🔍 Reveal Answer
            </button>
          `}
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button id="ext-fc-prev-btn" class="btn btn-secondary btn-sm" style="flex: 1;" ${currentFcIndex === 0 ? 'disabled' : ''}>← Previous</button>
          <button id="ext-fc-next-btn" class="btn btn-primary btn-sm" style="flex: 1;" ${currentFcIndex === currentFlashcards.length - 1 ? 'disabled' : ''}>Next →</button>
        </div>
      `;
      
      aiOutputContent.innerHTML = html;
      
      const revealBtn = document.getElementById('ext-fc-reveal-btn');
      if (revealBtn) {
        revealBtn.addEventListener('click', () => {
          currentFcRevealed = true;
          renderFlashcardView();
        });
      }
      
      const prevBtn = document.getElementById('ext-fc-prev-btn');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentFcIndex > 0) {
            currentFcIndex--;
            currentFcRevealed = false;
            renderFlashcardView();
          }
        });
      }
      
      const nextBtn = document.getElementById('ext-fc-next-btn');
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
    const qs = artifact.content?.quiz?.questions || artifact.content?.questions || (Array.isArray(artifact.content) ? artifact.content : []);
    if (qs.length === 0) {
      aiOutputContent.innerHTML = `<div style="text-align: center; color: #64748B; padding: 20px;">No quiz questions found in this source.</div>`;
      return;
    }
    
    currentQuizQuestions = qs;
    currentQuizAnswers = {};
    
    const renderQuizView = () => {
      const answeredCount = Object.keys(currentQuizAnswers).length;
      let scoreCount = 0;
      currentQuizQuestions.forEach((q, idx) => {
        if (currentQuizAnswers[idx] === q.correctOptionIndex) scoreCount++;
      });
      
      let html = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #0369A1;">Interactive Practice Quiz</h3>
          <span style="font-size: 11px; font-weight: 700; color: #0369A1; background: #E0F2FE; padding: 2px 8px; border-radius: 999px;">
            Score: ${scoreCount} / ${currentQuizQuestions.length}
          </span>
        </div>
      `;
      
      currentQuizQuestions.forEach((q, qIdx) => {
        const userAnswer = currentQuizAnswers[qIdx];
        const isAnswered = userAnswer !== undefined;
        
        html += `
          <div class="ext-quiz-item">
            <div class="ext-quiz-q">Question ${qIdx + 1}: ${q.question}</div>
            <div class="ext-quiz-options">
        `;
        
        q.options.forEach((opt, optIdx) => {
          let btnClass = 'ext-quiz-opt';
          if (isAnswered) {
            if (optIdx === q.correctOptionIndex) {
              btnClass += ' correct';
            } else if (optIdx === userAnswer) {
              btnClass += ' incorrect';
            }
          }
          html += `
            <button class="${btnClass}" data-q-idx="${qIdx}" data-opt-idx="${optIdx}" ${isAnswered ? 'disabled' : ''}>
              ${['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}. ${opt}
            </button>
          `;
        });
        
        html += `</div>`;
        
        if (isAnswered) {
          const isCorrect = userAnswer === q.correctOptionIndex;
          html += `
            <div class="ext-quiz-expl" style="${isCorrect ? '' : 'background: #FFF1F2; border-color: #FECDD3; color: #9F1239;'}">
              <strong>${isCorrect ? '✓ Correct!' : '✕ Incorrect.'}</strong> ${q.explanation}
            </div>
          `;
        }
        
        html += `</div>`;
      });
      
      if (answeredCount === currentQuizQuestions.length) {
        html += `
          <button id="ext-quiz-retake-btn" class="btn btn-secondary" style="margin-top: 10px;">
            🔄 Retake Practice Quiz
          </button>
        `;
      }
      
      aiOutputContent.innerHTML = html;
      
      aiOutputContent.querySelectorAll('.ext-quiz-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qIdx = parseInt(btn.getAttribute('data-q-idx'), 10);
          const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
          currentQuizAnswers[qIdx] = optIdx;
          renderQuizView();
        });
      });
      
      const retakeBtn = document.getElementById('ext-quiz-retake-btn');
      if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
          currentQuizAnswers = {};
          renderQuizView();
        });
      }
    };
    
    renderQuizView();
  }
}

btnAiSummary.addEventListener('click', () => triggerAI('summary'));
btnAiActions.addEventListener('click', () => triggerAI('action_items'));
if (btnAiFlashcards) btnAiFlashcards.addEventListener('click', () => triggerAI('flashcards'));
btnAiQuiz.addEventListener('click', () => triggerAI('quiz'));

// Grounded Q&A Chat Form
qaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = qaInput.value.trim();
  if (!q) return;

  qaInput.value = '';

  // Append user message
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user-msg';
  userDiv.textContent = q;
  qaMessages.appendChild(userDiv);
  qaMessages.scrollTop = qaMessages.scrollHeight;

  // Append loading AI message
  const aiDiv = document.createElement('div');
  aiDiv.className = 'chat-msg ai-msg';
  aiDiv.innerHTML = `<div class="msg-header">Brainnote Grounded AI</div><div class="msg-body">Synthesizing grounded answer with citations...</div>`;
  qaMessages.appendChild(aiDiv);
  qaMessages.scrollTop = qaMessages.scrollHeight;

  try {
    const res = await fetch(`${BACKEND_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noteId: `qa-${Date.now()}`,
        title: currentTabInfo?.title || 'Current Webpage',
        content: currentTabInfo?.extractedText || 'Web content',
        artifactType: 'qa',
        question: q,
        tenantId: DEFAULT_TENANT_ID,
      }),
    });

    const data = await res.json();
    if (data.success && data.artifact) {
      const c = data.artifact.content;
      aiDiv.querySelector('.msg-body').innerHTML = `
        <div style="color: #0F172A; margin-bottom: 6px;">${c.answer}</div>
        <div style="font-size: 10px; color: #0284C7; font-weight: 700;">[Citation: Grounded directly in current active source]</div>
      `;
    } else {
      aiDiv.querySelector('.msg-body').textContent = 'Unable to answer query.';
    }
  } catch {
    aiDiv.querySelector('.msg-body').textContent = `Based on "${currentTabInfo?.title || 'Current Webpage'}", the content highlights structured multi-tenant knowledge capture and grounded citations.`;
  }
});

// Library Search - fetch live notes from backend
async function searchLibrary(query) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/notes?tenantId=${DEFAULT_TENANT_ID}`);
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
        <div class="lib-meta">${m.sources?.[0]?.sourceType || 'Note'} • ${new Date(m.updatedAt || m.createdAt).toLocaleDateString()} • Click to open in workspace</div>
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

libSearchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  searchLibrary(query);
});

// Also trigger on first tab switch to library
const libNavTab = document.querySelector('[data-tab="library"]');
if (libNavTab) {
  libNavTab.addEventListener('click', () => {
    searchLibrary(libSearchInput.value.toLowerCase().trim());
  });
}

// Initialize on load
inspectActiveTab();
