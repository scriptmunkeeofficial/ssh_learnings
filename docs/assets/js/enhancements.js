const ALERT_MARKER_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

const ALERT_LABELS = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

/**
 * Parse a GitHub-style alert marker (e.g. `[!TIP] ...`) from the start of text.
 * Returns null if the text does not begin with a supported alert marker.
 */
export function parseAlertMarker(text) {
  if (typeof text !== 'string') {
    return null;
  }
  const match = text.trimStart().match(ALERT_MARKER_RE);
  if (!match) {
    return null;
  }
  const type = match[1].toLowerCase();
  const remainder = text.trimStart().slice(match[0].length);
  return {
    type,
    label: ALERT_LABELS[type],
    remainder,
  };
}

/**
 * Convert GitHub-style alert blockquotes (`> [!TIP]`) into styled callout boxes.
 */
export function enhanceAlerts(root) {
  const blockquotes = root.querySelectorAll('blockquote');
  let count = 0;

  for (const blockquote of blockquotes) {
    const firstParagraph = blockquote.querySelector('p');
    if (!firstParagraph) {
      continue;
    }
    const parsed = parseAlertMarker(firstParagraph.textContent || '');
    if (!parsed) {
      continue;
    }

    blockquote.classList.add('callout', `callout-${parsed.type}`);

    // Strip the `[!TYPE]` prefix from the first text node without destroying inline HTML.
    const firstChild = firstParagraph.firstChild;
    if (firstChild && firstChild.nodeType === 3) {
      firstChild.nodeValue = (firstChild.nodeValue || '').replace(ALERT_MARKER_RE, '');
    } else {
      firstParagraph.textContent = parsed.remainder;
    }

    // Remove a leading <br> left behind when the marker was on its own line.
    if (
      firstParagraph.firstChild &&
      firstParagraph.firstChild.nodeType === 3 &&
      !(firstParagraph.firstChild.nodeValue || '').trim() &&
      firstParagraph.firstChild.nextSibling &&
      firstParagraph.firstChild.nextSibling.nodeName === 'BR'
    ) {
      firstParagraph.removeChild(firstParagraph.firstChild.nextSibling);
    }

    // Remove the first paragraph if it only contained the marker.
    const hasRemainingContent =
      (firstParagraph.textContent || '').trim().length > 0 ||
      Boolean(firstParagraph.querySelector && firstParagraph.querySelector('*'));
    if (!hasRemainingContent && firstParagraph.parentElement === blockquote) {
      blockquote.removeChild(firstParagraph);
    }

    const titleEl = root.ownerDocument
      ? root.ownerDocument.createElement('span')
      : document.createElement('span');
    titleEl.className = 'callout-title';
    titleEl.textContent = parsed.label;
    blockquote.insertBefore(titleEl, blockquote.firstChild);
    count += 1;
  }

  return count;
}

/**
 * Upgrade fenced `mermaid` code blocks produced by Kramdown/Rouge into
 * `<div class="mermaid-frame"><div class="mermaid">...</div></div>` containers.
 */
export function upgradeMermaidBlocks(root) {
  const doc = root.ownerDocument || document;
  const selectors = 'pre > code.language-mermaid, div.language-mermaid pre > code';
  const codeNodes = root.querySelectorAll(selectors);
  const upgraded = [];

  for (const code of codeNodes) {
    const pre = code.parentElement;
    if (!pre || !pre.parentElement) {
      continue;
    }
    const host =
      pre.parentElement.classList &&
      pre.parentElement.classList.contains('language-mermaid')
        ? pre.parentElement
        : pre;

    const frame = doc.createElement('div');
    frame.className = 'mermaid-frame';

    const diagram = doc.createElement('div');
    diagram.className = 'mermaid';
    diagram.textContent = (code.textContent || '').trim();

    frame.appendChild(diagram);
    host.parentElement.replaceChild(frame, host);
    upgraded.push(diagram);
  }

  return upgraded;
}

/**
 * Add accessible Copy buttons to non-Mermaid code blocks.
 */
export function enhanceCodeBlocks(root, clipboardWriter) {
  const doc = root.ownerDocument || document;
  const writeText =
    clipboardWriter ||
    ((value) => navigator.clipboard && navigator.clipboard.writeText(value));
  const preBlocks = root.querySelectorAll('pre');
  let added = 0;

  for (const pre of preBlocks) {
    const code = pre.querySelector('code');
    if (!code || (code.classList && code.classList.contains('language-mermaid'))) {
      continue;
    }
    if (!pre.parentElement || pre.parentElement.classList.contains('code-block-wrap')) {
      continue;
    }

    const wrapper = doc.createElement('div');
    wrapper.className = 'code-block-wrap';
    pre.parentElement.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'copy-code-btn';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code snippet');

    button.addEventListener('click', async () => {
      try {
        await writeText(code.textContent || '');
        button.textContent = 'Copied';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 1600);
      } catch {
        button.textContent = 'Failed';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 1600);
      }
    });

    wrapper.appendChild(button);
    added += 1;
  }

  return added;
}

/**
 * Wire up the responsive mobile navigation toggle button.
 */
export function wireMobileNav(doc) {
  const toggle = doc.querySelector('.nav-toggle');
  const sidebar = doc.getElementById('site-sidebar');
  if (!toggle || !sidebar) {
    return false;
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    sidebar.classList.toggle('is-open', !expanded);
  });

  return true;
}

/**
 * Initialize all page enhancements and lazily load Mermaid when diagrams exist.
 */
export async function initEnhancements(doc, mermaidLoader) {
  wireMobileNav(doc);
  const article = doc.querySelector('.doc-content') || doc.body;
  if (!article) {
    return { alerts: 0, diagrams: 0, codeBlocks: 0 };
  }

  const alerts = enhanceAlerts(article);
  const diagrams = upgradeMermaidBlocks(article);
  const codeBlocks = enhanceCodeBlocks(article);

  if (diagrams.length > 0) {
    const loadMermaid =
      mermaidLoader ||
      (() => import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'));
    try {
      const mod = await loadMermaid();
      const mermaid = mod.default || mod;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
      await mermaid.run({ nodes: diagrams });
    } catch (err) {
      console.error('Failed to render Mermaid diagrams:', err);
    }
  }

  return { alerts, diagrams: diagrams.length, codeBlocks };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initEnhancements(document);
    });
  } else {
    initEnhancements(document);
  }
}
