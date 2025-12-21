/**
 * Simple markdown renderer for note content
 * Supports: **bold**, *italic*, - bullet lists, newlines
 */

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Render simple markdown to HTML
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';

  // First escape HTML
  let html = escapeHtml(text);

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Process lines for bullet lists
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line is a list item
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        processedLines.push('<ul class="list-disc pl-4 space-y-0.5">');
        inList = true;
      }
      processedLines.push(`<li>${trimmed.slice(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      // Regular line - add as is (will be wrapped with br later)
      processedLines.push(line);
    }
  }

  // Close list if still open
  if (inList) {
    processedLines.push('</ul>');
  }

  // Join and convert remaining newlines to <br>
  html = processedLines.join('\n');

  // Replace newlines with <br> (but not after block elements)
  html = html.replace(/\n(?!<\/ul>|<ul)/g, '<br />');

  // Clean up any double <br>
  html = html.replace(/(<br \/>)+/g, '<br />');

  return html;
}

/**
 * Strip markdown for plain text preview
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';

  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/^- /gm, '') // Remove list markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  const plain = stripMarkdown(text);
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trim() + '...';
}
