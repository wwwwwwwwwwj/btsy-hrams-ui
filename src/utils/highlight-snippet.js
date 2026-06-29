const ALLOWED = new Set(['EM', 'MARK', 'STRONG', 'B', 'I']);

/**
 * 将检索片段中的高亮标签白名单渲染为 HTML（防 XSS）
 */
export function sanitizeHighlightHtml(raw) {
  if (!raw || typeof raw !== 'string') {
    return '';
  }
  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const tag = node.tagName;
    if (!ALLOWED.has(tag)) {
      return Array.from(node.childNodes).map(walk).join('');
    }
    const inner = Array.from(node.childNodes).map(walk).join('');
    const lower = tag.toLowerCase();
    return `<${lower}>${inner}</${lower}>`;
  };
  const root = doc.body.firstChild;
  if (!root) {
    return escapeHtml(raw);
  }
  return Array.from(root.childNodes).map(walk).join('');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
