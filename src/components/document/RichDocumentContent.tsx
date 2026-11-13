'use client';

import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Info, CheckSquare, Square } from 'lucide-react';

interface RichDocumentContentProps {
  content: string;
  className?: string;
  editable?: boolean;
  onContentChange?: (newContent: string) => void;
}

/**
 * Universal Rich Document Renderer
 * Transforms Markdown and raw formatted text into a publication-grade,
 * professionally styled document. Strips all raw syntax symbols (#, **, -, etc.)
 * and renders semantic HTML components with clean typography and spacing.
 */
export const RichDocumentContent: React.FC<RichDocumentContentProps> = ({
  content,
  className = '',
  editable = false,
  onContentChange,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  if (editable) {
    return (
      <textarea
        value={content}
        onChange={(e) => onContentChange && onContentChange(e.target.value)}
        className={`w-full min-h-[400px] p-4 font-mono text-xs leading-relaxed rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-y ${className}`}
        placeholder="Edit document content in Markdown..."
      />
    );
  }

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Helper to parse inline styles: bold, italic, inline code, and links
  const renderInlineFormatted = (text: string): React.ReactNode => {
    if (!text) return null;

    // Pattern matches:
    // 1. `code`
    // 2. **bold** or __bold__
    // 3. *italic* or _italic_
    // 4. [link text](url)
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+(?!\*)|\[[^\]]+\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(remaining)) !== null) {
      // Plain text before match
      if (match.index > lastIndex) {
        tokens.push(remaining.substring(lastIndex, match.index));
      }

      const matchStr = match[0];

      if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        // Inline code
        const codeText = matchStr.slice(1, -1);
        tokens.push(
          <code
            key={`inline-code-${keyIdx++}`}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-[var(--accent-primary)] border border-[var(--border-subtle)] mx-0.5 font-semibold"
          >
            {codeText}
          </code>
        );
      } else if (
        (matchStr.startsWith('**') && matchStr.endsWith('**')) ||
        (matchStr.startsWith('__') && matchStr.endsWith('__'))
      ) {
        // Bold
        const boldText = matchStr.slice(2, -2);
        tokens.push(
          <strong key={`bold-${keyIdx++}`} className="font-bold text-[var(--text-primary)]">
            {renderInlineFormatted(boldText)}
          </strong>
        );
      } else if (matchStr.startsWith('*') && matchStr.endsWith('*')) {
        // Italic
        const italicText = matchStr.slice(1, -1);
        tokens.push(
          <em key={`italic-${keyIdx++}`} className="italic text-[var(--text-secondary)]">
            {renderInlineFormatted(italicText)}
          </em>
        );
      } else if (matchStr.startsWith('[') && matchStr.includes('](')) {
        // Link
        const linkMatch = matchStr.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const label = linkMatch[1];
          const url = linkMatch[2];
          tokens.push(
            <a
              key={`link-${keyIdx++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[var(--accent-primary)] hover:underline font-medium"
            >
              <span>{label}</span>
              <ExternalLink size={10} className="inline ml-0.5 opacity-70" />
            </a>
          );
        } else {
          tokens.push(matchStr);
        }
      } else {
        tokens.push(matchStr);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < remaining.length) {
      tokens.push(remaining.substring(lastIndex));
    }

    return tokens.length > 0 ? tokens : text;
  };

  // Split lines into structured blocks: headings, lists, tables, blockquotes, codeblocks, paragraphs
  const rawLines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let blockKey = 0;

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Skip completely empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Blocks (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'code';
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```

      const codeString = codeLines.join('\n');
      const codeId = `code-block-${blockKey++}`;

      blocks.push(
        <div
          key={codeId}
          className="my-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] overflow-hidden shadow-xs"
        >
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--bg-panel-header)] border-b border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">{lang}</span>
            <button
              onClick={() => handleCopyCode(codeId, codeString)}
              className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors px-1.5 py-0.5 rounded"
              title="Copy code"
            >
              {copiedCodeId === codeId ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[var(--text-primary)]">
            <code>{codeString}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 3. Markdown Tables (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableRows.push(rawLines[i].trim());
        i++;
      }

      if (tableRows.length >= 2) {
        // Parse header, delimiter, and body rows
        const parseRow = (rowStr: string) =>
          rowStr
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());

        const headers = parseRow(tableRows[0]);
        // Row 1 is usually |---|---|
        const hasDelimiter = tableRows[1].includes('---');
        const dataRows = hasDelimiter ? tableRows.slice(2) : tableRows.slice(1);

        blocks.push(
          <div
            key={`table-${blockKey++}`}
            className="my-4 overflow-x-auto rounded-xl border border-[var(--border-subtle)] shadow-xs"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-panel-header)] border-b border-[var(--border-subtle)]">
                  {headers.map((h, hIdx) => (
                    <th
                      key={`th-${hIdx}`}
                      className="px-3.5 py-2.5 font-bold text-[var(--text-primary)] tracking-wide"
                    >
                      {renderInlineFormatted(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-panel)]">
                {dataRows.map((rowStr, rIdx) => {
                  const cells = parseRow(rowStr);
                  return (
                    <tr
                      key={`tr-${rIdx}`}
                      className="hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      {cells.map((cell, cIdx) => (
                        <td
                          key={`td-${rIdx}-${cIdx}`}
                          className="px-3.5 py-2.5 text-[var(--text-secondary)] leading-relaxed"
                        >
                          {renderInlineFormatted(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 4. Headings (# H1, ## H2, ### H3, #### H4)
    if (trimmed.startsWith('#')) {
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        i++;

        if (level === 1) {
          blocks.push(
            <h1
              key={`h1-${blockKey++}`}
              className="mt-6 mb-3 text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2"
            >
              {renderInlineFormatted(headingText)}
            </h1>
          );
        } else if (level === 2) {
          blocks.push(
            <h2
              key={`h2-${blockKey++}`}
              className="mt-5 mb-2.5 text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2"
            >
              <span className="w-1.5 h-4 rounded-full bg-[var(--accent-primary)] shrink-0" />
              <span>{renderInlineFormatted(headingText)}</span>
            </h2>
          );
        } else if (level === 3) {
          blocks.push(
            <h3
              key={`h3-${blockKey++}`}
              className="mt-4 mb-2 text-sm sm:text-base font-bold text-[var(--text-primary)]"
            >
              {renderInlineFormatted(headingText)}
            </h3>
          );
        } else {
          blocks.push(
            <h4
              key={`h4-${blockKey++}`}
              className="mt-3 mb-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
            >
              {renderInlineFormatted(headingText)}
            </h4>
          );
        }
        continue;
      }
    }

    // 5. Blockquotes / Callout Highlights (> text)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
        i++;
      }

      blocks.push(
        <div
          key={`quote-${blockKey++}`}
          className="my-3.5 p-3.5 rounded-xl border-l-4 border-l-[var(--accent-primary)] bg-[var(--accent-primary-light)]/40 border border-[var(--border-subtle)] flex items-start gap-3"
        >
          <Info size={16} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed text-[var(--text-primary)] font-medium">
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx} className={qIdx > 0 ? 'mt-1.5' : ''}>
                {renderInlineFormatted(ql)}
              </p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // 6. Checklists (- [ ] or - [x])
    if (/^[-*+]\s+\[([ xX])\]\s+/.test(trimmed)) {
      const checklistItems: { checked: boolean; text: string }[] = [];
      while (i < rawLines.length && /^[-*+]\s+\[([ xX])\]\s+/.test(rawLines[i].trim())) {
        const m = rawLines[i].trim().match(/^[-*+]\s+\[([ xX])\]\s+(.+)$/);
        if (m) {
          checklistItems.push({
            checked: m[1].toLowerCase() === 'x',
            text: m[2],
          });
        }
        i++;
      }

      blocks.push(
        <div key={`checklist-${blockKey++}`} className="my-3 space-y-2">
          {checklistItems.map((item, cIdx) => (
            <div
              key={cIdx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
            >
              {item.checked ? (
                <CheckSquare size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Square size={15} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
              )}
              <span className={`leading-relaxed ${item.checked ? 'line-through text-[var(--text-muted)]' : ''}`}>
                {renderInlineFormatted(item.text)}
              </span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 7. Bullet Lists (- item, * item, + item)
    if (/^[-*+]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < rawLines.length && /^[-*+]\s+/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^[-*+]\s+/, ''));
        i++;
      }

      blocks.push(
        <ul key={`ul-${blockKey++}`} className="my-3 space-y-1.5 pl-1">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2 shrink-0" />
              <span className="flex-1">{renderInlineFormatted(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 8. Numbered Lists (1. item, 2. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: { num: string; text: string }[] = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
        const m = rawLines[i].trim().match(/^(\d+)\.\s+(.+)$/);
        if (m) {
          listItems.push({ num: m[1], text: m[2] });
        }
        i++;
      }

      blocks.push(
        <ol key={`ol-${blockKey++}`} className="my-3 space-y-2 pl-1">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <span className="flex-1">{renderInlineFormatted(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 9. Horizontal Rule (---, ***, ___)
    if (/^([-*_]){3,}$/.test(trimmed)) {
      blocks.push(
        <hr
          key={`hr-${blockKey++}`}
          className="my-5 border-t border-[var(--border-subtle)]"
        />
      );
      i++;
      continue;
    }

    // 10. Normal Paragraphs
    const paraLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith('#') &&
      !rawLines[i].trim().startsWith('```') &&
      !rawLines[i].trim().startsWith('|') &&
      !rawLines[i].trim().startsWith('>') &&
      !/^[-*+]\s+/.test(rawLines[i].trim()) &&
      !/^\d+\.\s+/.test(rawLines[i].trim()) &&
      !/^([-*_]){3,}$/.test(rawLines[i].trim())
    ) {
      paraLines.push(rawLines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      const fullPara = paraLines.join(' ');
      blocks.push(
        <p
          key={`p-${blockKey++}`}
          className="my-2.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed"
        >
          {renderInlineFormatted(fullPara)}
        </p>
      );
    }
  }

  return (
    <div className={`prose-document select-text ${className}`}>
      {blocks}
    </div>
  );
};

