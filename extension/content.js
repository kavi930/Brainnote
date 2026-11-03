// ==============================================================================
// Brainnote AI Extension — On-Demand Content Extraction Script
// Executed only with activeTab permission without global script injection
// ==============================================================================

(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PAGE_CONTENT') {
      try {
        // Extract Page Metadata
        let title = document.querySelector('meta[property="og:title"]')?.content ||
                    document.querySelector('meta[name="twitter:title"]')?.content ||
                    document.title || '';
        title = title.replace(/- MachineLearningMastery\.com/i, '').replace(/\|\s*.*$/i, '').trim();

        const url = window.location.href || '';
        const author = document.querySelector('meta[name="author"]')?.content ||
                       document.querySelector('.author, [rel="author"], .byline')?.innerText?.trim() || '';
        const description = document.querySelector('meta[property="og:description"]')?.content ||
                            document.querySelector('meta[name="description"]')?.content || '';

        const selectedText = window.getSelection()?.toString().trim() || '';

        // Check if YouTube
        const isYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/');
        let youtubeVideoId = null;
        if (isYouTube) {
          const urlObj = new URL(url);
          youtubeVideoId = urlObj.searchParams.get('v') || url.split('/').pop();
        }

        // Targeted article extraction (avoiding nav, ads, headers, footers)
        const mainEl = document.querySelector('article, [role="main"], main, .post-content, .entry-content, .article-body') || document.body;
        const clone = mainEl.cloneNode(true);
        const unwanted = clone.querySelectorAll('script, style, nav, footer, header, noscript, iframe, .ad, .sidebar, .comments');
        unwanted.forEach((el) => el.remove());

        // Extract headings, code blocks and paragraphs into structured markdown
        const parts = [];
        const contentNodes = clone.querySelectorAll('h1, h2, h3, h4, p, pre, code');
        contentNodes.forEach((node) => {
          const tag = node.tagName.toLowerCase();
          const text = (node.innerText || '').trim();
          if (!text || text.length < 10) return;

          if (tag === 'h1') parts.push(`\n# ${text}\n`);
          else if (tag === 'h2') parts.push(`\n## ${text}\n`);
          else if (tag === 'h3') parts.push(`\n### ${text}\n`);
          else if (tag === 'h4') parts.push(`\n#### ${text}\n`);
          else if (tag === 'pre') parts.push(`\n\`\`\`python\n${text}\n\`\`\`\n`);
          else if (tag === 'p') parts.push(text);
        });

        const structuredMarkdown = parts.length > 0 ? parts.join('\n\n').slice(0, 16000) : (clone.innerText || '').slice(0, 8000).trim();
        const extractedText = (clone.innerText || '').slice(0, 10000).trim();

        sendResponse({
          success: true,
          data: {
            title,
            url,
            author,
            description,
            selectedText,
            isYouTube,
            youtubeVideoId,
            extractedText,
            structuredMarkdown,
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
