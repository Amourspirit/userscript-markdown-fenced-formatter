import DOMPurify from "dompurify";
import { marked } from "marked";
import type { UserConfig } from "./script_config";

export interface FormatMarkdownStats {
  processed: number;
  converted: number;
  skipped: number;
}

function normalizeDescriptionHtml(inputHtml: string): string {
  return inputHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n");
}

function decodeHtmlEntities(input: string): string {
  const tmp = document.createElement("textarea");
  tmp.innerHTML = input;
  return tmp.value;
}

function normalizeInput(inputHtml: string, cfg: UserConfig): string {
  const withLineBreaks = cfg.convertBrToNewline
    ? normalizeDescriptionHtml(inputHtml)
    : inputHtml;

  const decoded = decodeHtmlEntities(withLineBreaks).replace(/\r\n?/g, "\n");
  return cfg.trimInput ? decoded.trim() : decoded;
}

function getFenceMatch(
  input: string,
  style: "backtick" | "tilde",
  mode: "md-only" | "any-fence",
): RegExpExecArray | null {
  if (style === "backtick") {
    const regex =
      mode === "md-only"
        ? /^```md\s*\n([\s\S]*?)\n```\s*$/i
        : /^```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n```\s*$/;
    return regex.exec(input);
  }

  const regex =
    mode === "md-only"
      ? /^~~~md\s*\n([\s\S]*?)\n~~~\s*$/i
      : /^~~~(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n~~~\s*$/;
  return regex.exec(input);
}

function extractFencedMarkdown(input: string, cfg: UserConfig): string | null {
  for (const style of cfg.allowedFenceStyles) {
    const match = getFenceMatch(input, style, cfg.fenceMode);
    if (match) {
      return cfg.trimInput ? match[1].trim() : match[1];
    }
  }

  return null;
}

function mdToHtml(markdown: string, cfg: UserConfig): string {
  const rendered = marked.parse(markdown, { async: false });
  if (!cfg.sanitizeHtml) {
    return rendered;
  }
  return DOMPurify.sanitize(rendered);
}

export function formatMarkdown(cfg: UserConfig): FormatMarkdownStats {
  const descriptions = document.querySelectorAll<HTMLDivElement>(cfg.selector);

  const stats: FormatMarkdownStats = {
    processed: descriptions.length,
    converted: 0,
    skipped: 0,
  };

  descriptions.forEach((el) => {
    if (
      cfg.skipIfAlreadyWrapped &&
      el.querySelector(`:scope > div.${cfg.wrapperClass}`)
    ) {
      stats.skipped += 1;
      return;
    }

    const normalized = normalizeInput(el.innerHTML, cfg);
    const markdown = extractFencedMarkdown(normalized, cfg);

    if (!markdown) {
      stats.skipped += 1;
      return;
    }

    const safeHtml = mdToHtml(markdown, cfg);
    el.innerHTML = `<div class="${cfg.wrapperClass}">${safeHtml}</div>`;
    stats.converted += 1;
  });

  return stats;
}
