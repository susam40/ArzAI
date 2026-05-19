function applyInlineMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");
}

/** Escape HTML, then apply minimal inline markdown used in petition text. */
export function markdownInlineToHtml(text: string): string {
  return applyInlineMarkdown(text).replace(/\n/g, "<br>");
}

/** TipTap-friendly HTML: one paragraph per line, inline markdown preserved. */
export function markdownToEditorHtml(text: string): string {
  const lines = text.split("\n");
  if (lines.length === 0) return "<p></p>";
  return lines
    .map((line) => `<p>${line === "" ? "<br>" : applyInlineMarkdown(line)}</p>`)
    .join("");
}

/** Convert TipTap / simple HTML back to plain text with inline markdown. */
export function htmlToMarkdownInline(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
