export function toInlineHtml(raw: string): string {
  if (!raw) return '';

  // 1) HTML Escape
  let html = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2) Inline Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="px-1 rounded bg-gray-200 text-sm font-mono text-red-500">$1</code>');

  // 3) Bold: **bold**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 4) Italic: *italic*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 5) Newlines
  html = html.replace(/\n/g, '<br />');

  return html;
}
