import DOMPurify from "dompurify";
import { marked } from "marked";

export interface FormatMarkdownStats {
  processed: number;
  converted: number;
  skipped: number;
}

function normalizeDescriptionHtml(inputHtml: string): string {
  const withLineBreaks = inputHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n");

  const tmp = document.createElement("textarea");
  tmp.innerHTML = withLineBreaks;
  return tmp.value.replace(/\r\n?/g, "\n").trim();
}

function extractFencedMarkdown(input: string): string | null {
  const normalized = input.trim();

  const tick = /^```md\s*\n([\s\S]*?)\n```\s*$/i.exec(normalized);
  if (tick) {
    return tick[1].trim();
  }

  const tilde = /^~~~md\s*\n([\s\S]*?)\n~~~\s*$/i.exec(normalized);
  if (tilde) {
    return tilde[1].trim();
  }

  return null;
}

function mdToSafeHtml(markdown: string): string {
  const rendered = marked.parse(markdown, { async: false });
  return DOMPurify.sanitize(rendered);
}

export function formatMarkdown(): FormatMarkdownStats {
  const descriptions = document.querySelectorAll<HTMLDivElement>(
    ".bookmark > .display > .description",
  );

  const stats: FormatMarkdownStats = {
    processed: descriptions.length,
    converted: 0,
    skipped: 0,
  };

  descriptions.forEach((el) => {
    const normalized = normalizeDescriptionHtml(el.innerHTML);
    const markdown = extractFencedMarkdown(normalized);

    if (!markdown) {
      stats.skipped += 1;
      return;
    }

    const safeHtml = mdToSafeHtml(markdown);
    el.innerHTML = `<div class="md-block">${safeHtml}</div>`;
    stats.converted += 1;
  });

  return stats;
}
