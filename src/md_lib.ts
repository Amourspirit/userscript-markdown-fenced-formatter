import DOMPurify from "dompurify";
import { marked } from "marked";
import type { UserConfig } from "./script_config";

const COLLAPSIBLE_CLASS = "md-collapsible";
const SUMMARY_CLASS = "md-summary";
const EXPAND_TOGGLE_CLASS = "exp-toggle";

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
  const withLineBreaks = normalizeDescriptionHtml(inputHtml);

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

function extractSummary(
  text: string,
  maxSentences = 3,
  maxChars = 280,
): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "View markdown details.";
  }

  const chunks = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned];
  const selected: string[] = [];

  for (const chunk of chunks) {
    const sentence = chunk.trim();
    if (!sentence) {
      continue;
    }

    const candidate =
      selected.length > 0 ? `${selected.join(" ")} ${sentence}` : sentence;
    if (candidate.length > maxChars) {
      break;
    }

    selected.push(sentence);
    if (selected.length >= maxSentences) {
      break;
    }
  }

  let summary = selected.join(" ");

  if (!summary) {
    summary = cleaned.slice(0, maxChars).trimEnd();
    const lastSpace = summary.lastIndexOf(" ");
    if (lastSpace > 0 && cleaned.length > maxChars) {
      summary = summary.slice(0, lastSpace);
    }
  }

  if (summary.length < cleaned.length) {
    const terminal = summary.slice(-1);
    if (terminal !== "." && terminal !== "!" && terminal !== "?") {
      summary = `${summary}...`;
    }
  }

  return summary;
}

function extractSummarySource(container: HTMLElement): string {
  const firstParagraph = container.querySelector<HTMLElement>(
    "p, blockquote p, li, h1, h2, h3, h4, h5, h6",
  );

  const preferredText = firstParagraph?.textContent?.trim();
  if (preferredText) {
    return preferredText;
  }

  return container.textContent || "";
}

function buildCollapsibleBlock(
  safeHtml: string,
  cfg: UserConfig,
): HTMLDetailsElement {
  const textExtractor = document.createElement("div");
  textExtractor.innerHTML = safeHtml;
  const summaryText = extractSummary(extractSummarySource(textExtractor));

  const details = document.createElement("details");
  details.className = COLLAPSIBLE_CLASS;
  details.open = cfg.initialMdBlockView === "expanded";

  const summary = document.createElement("summary");
  summary.className = SUMMARY_CLASS;
  summary.textContent = summaryText;

  const content = document.createElement("div");
  content.className = cfg.wrapperClass;
  content.innerHTML = safeHtml;

  details.append(summary, content);
  return details;
}

function getCollapsibleBlocks(): HTMLDetailsElement[] {
  return Array.from(
    document.querySelectorAll<HTMLDetailsElement>(
      `details.${COLLAPSIBLE_CLASS}`,
    ),
  );
}

function findOrganizeAnchor(): HTMLAnchorElement | null {
  const container = document.querySelector("table.edit_organize_widget td");
  if (!container) {
    return null;
  }

  const links = Array.from(
    container.querySelectorAll<HTMLAnchorElement>("a.edit"),
  );
  return (
    links.find(
      (link) =>
        link.id !== "bulk_edit" &&
        (link.textContent || "").trim().toLowerCase() === "organize",
    ) ??
    links.find((link) => link.id !== "bulk_edit") ??
    null
  );
}

function injectExpandToggle(): void {
  const organizeAnchor = findOrganizeAnchor();
  if (!organizeAnchor) {
    return;
  }

  let toggle = organizeAnchor.parentElement?.querySelector<HTMLAnchorElement>(
    `a.${EXPAND_TOGGLE_CLASS}`,
  );

  if (!toggle) {
    const separator = document.createTextNode(" ‧ ");
    toggle = document.createElement("a");
    toggle.className = EXPAND_TOGGLE_CLASS;
    toggle.href = "";
    organizeAnchor.after(separator, toggle);
  } else {
    // Replace existing element to reset any previous event handlers.
    const freshToggle = toggle.cloneNode(true) as HTMLAnchorElement;
    toggle.replaceWith(freshToggle);
    toggle = freshToggle;
  }

  const updateToggleLabel = () => {
    const sections = getCollapsibleBlocks();
    const allOpen =
      sections.length > 0 && sections.every((details) => details.open);
    toggle.textContent = allOpen ? "Collapse All" : "Expand All";
  };

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    const sections = getCollapsibleBlocks();
    if (sections.length === 0) {
      return;
    }

    const allOpen = sections.every((details) => details.open);
    sections.forEach((details) => {
      details.open = !allOpen;
    });

    updateToggleLabel();
  });

  updateToggleLabel();
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
      el.querySelector(
        `:scope > details.${COLLAPSIBLE_CLASS}, :scope > div.${cfg.wrapperClass}`,
      )
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
    const collapsible = buildCollapsibleBlock(safeHtml, cfg);
    el.replaceChildren(collapsible);
    stats.converted += 1;
  });

  injectExpandToggle();

  return stats;
}
