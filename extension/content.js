// ==============================================================================
// Brainnote AI Extension — On-Demand Content Extraction Script
// Executed only with activeTab permission without global script injection
// ==============================================================================

(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PAGE_CONTENT') {
      try {
        const title = document.title || '';
        const url = window.location.href || '';
        const selectedText = window.getSelection()?.toString().trim() || '';

        // Check if YouTube
        const isYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/');
        let youtubeVideoId = null;
        if (isYouTube) {
          const urlObj = new URL(url);
          youtubeVideoId = urlObj.searchParams.get('v') || url.split('/').pop();
        }

        // Clean document body text
        const bodyClone = document.body.cloneNode(true);
        // Remove non-content elements
        const scriptsAndStyles = bodyClone.querySelectorAll('script, style, nav, footer, noscript, iframe');
        scriptsAndStyles.forEach((el) => el.remove());
        const extractedText = (bodyClone.innerText || '').slice(0, 8000).trim();

        sendResponse({
          success: true,
          data: {
            title,
            url,
            selectedText,
            isYouTube,
            youtubeVideoId,
            extractedText,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message || 'Content extraction failed',
        });
      }
    }
    return true; // Keep message channel open for async response
  });
})();
