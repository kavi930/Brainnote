// ==============================================================================
// Brainnote AI — Content Sanitizer & Prompt-Injection Neutralizer
// Treats all external inputs (web, PDFs, transcripts) as untrusted data
// ==============================================================================

/**
 * Sanitizes raw text extracted from external sources.
 * 1. Strips dangerous script tags and raw HTML.
 * 2. Neutralizes prompt injection directives that attempt to hijack LLM behavior.
 * 3. Enforces length caps.
 */
export function sanitizeSourceContent(rawContent: string, maxChars = 250_000): string {
  if (!rawContent || typeof rawContent !== 'string') {
    return '';
  }

  let text = rawContent;

  // Truncate to maximum permitted characters to prevent DOS
  if (text.length > maxChars) {
    text = text.slice(0, maxChars) + '\n\n[Content truncated due to maximum source length limit]';
  }

  // Remove potential script and iframe tags
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Neutralize common prompt-injection override attempts
  const injectionPatterns = [
    /ignore (all )?(previous|above) instructions/gi,
    /system:\s*you are now/gi,
    /disregard system prompt/gi,
    /bypass safety filters/gi,
    /developer mode enabled/gi,
  ];

  for (const pattern of injectionPatterns) {
    text = text.replace(pattern, '[PROMPT_INJECTION_REDACTED]');
  }

  return text.trim();
}

/**
 * Wraps extracted source content safely for downstream LLM prompts
 * so the model treats it strictly as unprivileged ground-truth reference data.
 */
export function wrapUntrustedSourceForLLM(sourceTitle: string, sourceText: string): string {
  const sanitized = sanitizeSourceContent(sourceText);
  return `
=== BEGIN UNTRUSTED GROUNDING DATA: "${sourceTitle.replace(/"/g, '')}" ===
${sanitized}
=== END UNTRUSTED GROUNDING DATA ===
`;
}
