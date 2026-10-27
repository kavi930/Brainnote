// ==============================================================================
// Brainnote AI Extension — Background Service Worker (Manifest V3)
// Handles side panel activation, context menus, and background capture events
// ==============================================================================

chrome.runtime.onInstalled.addListener(() => {
  // Configure side panel to open on toolbar action click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('sidePanel.setPanelBehavior error:', err);
    });
  }

  // Create Context Menus
  chrome.contextMenus.create({
    id: 'brainnote-capture-selection',
    title: 'Save selection to Brainnote',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'brainnote-summarize-page',
    title: 'Summarize page with Brainnote AI',
    contexts: ['page'],
  });
});

// Explicit action click handler to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab) {
    try {
      if (tab.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
    } catch (err) {
      if (tab.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
    }
  }
});

// Context Menu Action Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'brainnote-capture-selection') {
    const selectedText = info.selectionText || '';
    // Store captured text in extension storage for sidepanel pickup
    await chrome.storage.local.set({
      pendingCapture: {
        type: 'selection',
        text: selectedText,
        pageUrl: tab.url,
        pageTitle: tab.title,
        timestamp: new Date().toISOString(),
      },
    });

    // Open side panel
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  } else if (info.menuItemId === 'brainnote-summarize-page') {
    await chrome.storage.local.set({
      pendingCapture: {
        type: 'page_summary',
        pageUrl: tab.url,
        pageTitle: tab.title,
        timestamp: new Date().toISOString(),
      },
    });

    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  }
});
