import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseAlertMarker,
  enhanceAlerts,
  upgradeMermaidBlocks,
  enhanceCodeBlocks,
  wireMobileNav,
  initEnhancements,
} from '../docs/assets/js/enhancements.js';

/**
 * Lightweight DOM mock sufficient to unit-test pure DOM enhancement routines
 * without requiring jsdom or external dependencies.
 */
function createMockDocument() {
  class MockClassList {
    constructor(initial = []) {
      this.set = new Set(initial);
    }
    add(...names) {
      names.forEach((n) => this.set.add(n));
    }
    contains(name) {
      return this.set.has(name);
    }
    toggle(name, force) {
      if (force === undefined) {
        if (this.set.has(name)) {
          this.set.delete(name);
          return false;
        }
        this.set.add(name);
        return true;
      }
      if (force) {
        this.set.add(name);
        return true;
      }
      this.set.delete(name);
      return false;
    }
  }

  class MockNode {
    constructor(nodeType, nodeName, ownerDocument) {
      this.nodeType = nodeType;
      this.nodeName = nodeName;
      this.ownerDocument = ownerDocument;
      this.parentElement = null;
      this.children = [];
      this.attributes = new Map();
      this.listeners = new Map();
      this.classList = new MockClassList();
      this._text = '';
    }

    get firstChild() {
      return this.children[0] || null;
    }

    get nextSibling() {
      if (!this.parentElement) return null;
      const idx = this.parentElement.children.indexOf(this);
      return this.parentElement.children[idx + 1] || null;
    }

    get className() {
      return [...this.classList.set].join(' ');
    }

    set className(val) {
      this.classList = new MockClassList(val.split(/\s+/).filter(Boolean));
    }

    get nodeValue() {
      return this.nodeType === 3 ? this._text : null;
    }

    set nodeValue(val) {
      if (this.nodeType === 3) {
        this._text = String(val);
      }
    }

    get textContent() {
      if (this.nodeType === 3) return this._text;
      return this.children.map((c) => c.textContent).join('');
    }

    set textContent(val) {
      if (this.nodeType === 3) {
        this._text = String(val);
        return;
      }
      this.children = [];
      if (val !== '') {
        this.appendChild(createText(String(val)));
      }
    }

    appendChild(child) {
      if (child.parentElement) {
        child.parentElement.removeChild(child);
      }
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    insertBefore(newNode, refNode) {
      if (newNode.parentElement) {
        newNode.parentElement.removeChild(newNode);
      }
      const idx = refNode ? this.children.indexOf(refNode) : -1;
      newNode.parentElement = this;
      if (idx === -1) {
        this.children.push(newNode);
      } else {
        this.children.splice(idx, 0, newNode);
      }
      return newNode;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentElement = null;
      }
      return child;
    }

    replaceChild(newChild, oldChild) {
      const idx = this.children.indexOf(oldChild);
      if (idx !== -1) {
        oldChild.parentElement = null;
        newChild.parentElement = this;
        this.children[idx] = newChild;
      }
      return oldChild;
    }

    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    }

    getAttribute(name) {
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    addEventListener(event, handler) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(handler);
    }

    async click() {
      const handlers = this.listeners.get('click') || [];
      for (const h of handlers) {
        await h();
      }
    }

    matchesSimple(selector) {
      if (this.nodeType !== 1) return false;
      const parts = selector.split('.');
      const tag = parts[0];
      const classes = parts.slice(1);
      if (tag && tag !== '*' && this.nodeName !== tag.toUpperCase()) return false;
      return classes.every((c) => this.classList.contains(c));
    }

    matches(selector) {
      return selector.split(',').some((sel) => {
        const trimmed = sel.trim();
        if (trimmed.includes(' > ')) {
          const [parentSel, childSel] = trimmed.split(' > ').map((s) => s.trim());
          if (!this.matchesSimple(childSel)) return false;
          if (!this.parentElement) return false;
          if (parentSel.includes(' ')) {
            const [ancestorSel, directParentSel] = parentSel.split(/\s+/);
            return (
              this.parentElement.matchesSimple(directParentSel) &&
              Boolean(this.parentElement.parentElement?.matchesSimple(ancestorSel))
            );
          }
          return this.parentElement.matchesSimple(parentSel);
        }
        return this.matchesSimple(trimmed);
      });
    }

    querySelectorAll(selector) {
      const results = [];
      const walk = (node) => {
        for (const child of node.children) {
          if (child.nodeType === 1) {
            if (child.matches(selector)) {
              results.push(child);
            }
            walk(child);
          }
        }
      };
      walk(this);
      return results;
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }
  }

  const doc = {
    createElement(tag) {
      return new MockNode(1, tag.toUpperCase(), doc);
    },
    createTextNode(text) {
      return createText(text);
    },
    getElementById(id) {
      const walk = (node) => {
        for (const child of node.children) {
          if (child.nodeType === 1) {
            if (child.getAttribute('id') === id) return child;
            const found = walk(child);
            if (found) return found;
          }
        }
        return null;
      };
      return walk(doc.body);
    },
    querySelector(selector) {
      return doc.body.querySelector(selector);
    },
    querySelectorAll(selector) {
      return doc.body.querySelectorAll(selector);
    },
  };

  function createText(text) {
    const node = new MockNode(3, '#text', doc);
    node._text = text;
    return node;
  }

  doc.body = new MockNode(1, 'BODY', doc);
  return doc;
}

test('parseAlertMarker parses all supported GitHub alert markers', () => {
  assert.deepEqual(parseAlertMarker('[!NOTE] Helpful note'), {
    type: 'note',
    label: 'Note',
    remainder: 'Helpful note',
  });
  assert.deepEqual(parseAlertMarker('  [!tip]\nUse ProxyJump'), {
    type: 'tip',
    label: 'Tip',
    remainder: 'Use ProxyJump',
  });
  assert.deepEqual(parseAlertMarker('[!CAUTION] Never share private keys'), {
    type: 'caution',
    label: 'Caution',
    remainder: 'Never share private keys',
  });
  assert.equal(parseAlertMarker('Regular blockquote text'), null);
  assert.equal(parseAlertMarker('[!UNKNOWN] Unsupported'), null);
  assert.equal(parseAlertMarker(null), null);
});

test('enhanceAlerts converts alert blockquotes and leaves standard quotes untouched', () => {
  const doc = createMockDocument();
  const article = doc.createElement('article');
  doc.body.appendChild(article);

  const alertQuote = doc.createElement('blockquote');
  const p1 = doc.createElement('p');
  p1.appendChild(doc.createTextNode('[!WARNING] Never use global ForwardAgent'));
  alertQuote.appendChild(p1);

  const normalQuote = doc.createElement('blockquote');
  const p2 = doc.createElement('p');
  p2.appendChild(doc.createTextNode('A regular quotation.'));
  normalQuote.appendChild(p2);

  article.appendChild(alertQuote);
  article.appendChild(normalQuote);

  const count = enhanceAlerts(article);
  assert.equal(count, 1);
  assert.equal(alertQuote.classList.contains('callout'), true);
  assert.equal(alertQuote.classList.contains('callout-warning'), true);
  assert.equal(alertQuote.firstChild.className, 'callout-title');
  assert.equal(alertQuote.firstChild.textContent, 'Warning');
  assert.equal(p1.textContent, 'Never use global ForwardAgent');
  assert.equal(normalQuote.classList.contains('callout'), false);
});

test('enhanceAlerts preserves inline formatting and removes marker-only paragraphs', () => {
  const doc = createMockDocument();
  const article = doc.createElement('article');
  doc.body.appendChild(article);

  const inlineQuote = doc.createElement('blockquote');
  const pInline = doc.createElement('p');
  pInline.appendChild(doc.createTextNode('[!TIP]\n'));
  pInline.appendChild(doc.createElement('br'));
  const strong = doc.createElement('strong');
  strong.textContent = 'Useful Tunnel Flags:';
  pInline.appendChild(strong);
  inlineQuote.appendChild(pInline);

  const splitQuote = doc.createElement('blockquote');
  const pMarkerOnly = doc.createElement('p');
  pMarkerOnly.appendChild(doc.createTextNode('[!NOTE]'));
  const pBody = doc.createElement('p');
  pBody.textContent = 'Body paragraph.';
  splitQuote.appendChild(pMarkerOnly);
  splitQuote.appendChild(pBody);

  article.appendChild(inlineQuote);
  article.appendChild(splitQuote);

  const count = enhanceAlerts(article);
  assert.equal(count, 2);
  assert.equal(inlineQuote.querySelectorAll('br').length, 0);
  assert.equal(inlineQuote.querySelector('strong').textContent, 'Useful Tunnel Flags:');
  assert.equal(splitQuote.querySelectorAll('p').length, 1);
  assert.equal(splitQuote.querySelector('p').textContent, 'Body paragraph.');
});

test('upgradeMermaidBlocks converts mermaid code blocks and ignores other languages', () => {
  const doc = createMockDocument();
  const article = doc.createElement('article');
  doc.body.appendChild(article);

  const preMermaid = doc.createElement('pre');
  const codeMermaid = doc.createElement('code');
  codeMermaid.className = 'language-mermaid';
  codeMermaid.textContent = 'flowchart LR\n  A --> B';
  preMermaid.appendChild(codeMermaid);

  const preBash = doc.createElement('pre');
  const codeBash = doc.createElement('code');
  codeBash.className = 'language-bash';
  codeBash.textContent = 'ssh dev-app';
  preBash.appendChild(codeBash);

  article.appendChild(preMermaid);
  article.appendChild(preBash);

  const upgraded = upgradeMermaidBlocks(article);
  assert.equal(upgraded.length, 1);
  assert.equal(upgraded[0].className, 'mermaid');
  assert.equal(upgraded[0].textContent, 'flowchart LR\n  A --> B');
  assert.equal(article.querySelectorAll('.mermaid-frame').length, 1);
  assert.equal(article.querySelectorAll('pre').length, 1);
});

test('enhanceCodeBlocks wraps non-mermaid code blocks and copies snippet text', async () => {
  const doc = createMockDocument();
  const article = doc.createElement('article');
  doc.body.appendChild(article);

  const pre = doc.createElement('pre');
  const code = doc.createElement('code');
  code.className = 'language-bash';
  code.textContent = 'ssh-keygen -t ed25519';
  pre.appendChild(code);
  article.appendChild(pre);

  let copied = '';
  const added = enhanceCodeBlocks(article, async (text) => {
    copied = text;
  });

  assert.equal(added, 1);
  const btn = article.querySelector('.copy-code-btn');
  assert.ok(btn);
  assert.equal(btn.textContent, 'Copy');
  await btn.click();
  assert.equal(copied, 'ssh-keygen -t ed25519');
  assert.equal(btn.textContent, 'Copied');
});

test('wireMobileNav toggles aria-expanded and sidebar visibility class', async () => {
  const doc = createMockDocument();
  const btn = doc.createElement('button');
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-expanded', 'false');

  const sidebar = doc.createElement('aside');
  sidebar.setAttribute('id', 'site-sidebar');

  doc.body.appendChild(btn);
  doc.body.appendChild(sidebar);

  assert.equal(wireMobileNav(doc), true);
  await btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(sidebar.classList.contains('is-open'), true);
  await btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.equal(sidebar.classList.contains('is-open'), false);
});

test('initEnhancements runs full pipeline and invokes mermaid loader when diagrams exist', async () => {
  const doc = createMockDocument();
  const article = doc.createElement('article');
  article.className = 'doc-content';
  doc.body.appendChild(article);

  const bq = doc.createElement('blockquote');
  const p = doc.createElement('p');
  p.appendChild(doc.createTextNode('[!TIP] Try ssh -G'));
  bq.appendChild(p);
  article.appendChild(bq);

  const preM = doc.createElement('pre');
  const codeM = doc.createElement('code');
  codeM.className = 'language-mermaid';
  codeM.textContent = 'sequenceDiagram\n  A->>B: hi';
  preM.appendChild(codeM);
  article.appendChild(preM);

  const preSh = doc.createElement('pre');
  const codeSh = doc.createElement('code');
  codeSh.className = 'language-bash';
  codeSh.textContent = 'ssh -G dev-app';
  preSh.appendChild(codeSh);
  article.appendChild(preSh);

  let initialized = false;
  let ranNodes = 0;
  const fakeMermaid = {
    initialize(opts) {
      initialized = opts.startOnLoad === false && opts.securityLevel === 'strict';
    },
    async run({ nodes }) {
      ranNodes = nodes.length;
    },
  };

  const result = await initEnhancements(doc, async () => ({ default: fakeMermaid }));
  assert.deepEqual(result, { alerts: 1, diagrams: 1, codeBlocks: 1 });
  assert.equal(initialized, true);
  assert.equal(ranNodes, 1);
});
