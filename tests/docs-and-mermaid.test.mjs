import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MARKDOWN_FILES = [
  'README.md',
  'docs/index.md',
  'docs/01-ssh-basics.md',
  'docs/02-client-configuration.md',
  'docs/03-windows-clients.md',
  'docs/04-advanced-ssh.md',
  'docs/05-troubleshooting-and-cheatsheet.md',
];

const EXPECTED_CLASSDEFS = [
  'classDef edge fill:#FFFFFF,stroke:#475569,stroke-width:1.5px,color:#1E293B',
  'classDef identity fill:#FAF6F0,stroke:#D2BFA9,stroke-width:1.5px,color:#2D3A4F',
  'classDef service fill:#F0F4F8,stroke:#3B4C68,stroke-width:1.5px,color:#1E293B',
  'classDef data fill:#E1EFEA,stroke:#438B71,stroke-width:1.5px,color:#1E293B',
  'classDef obs fill:#FFFBEB,stroke:#B45309,stroke-width:1.5px,color:#1E293B',
  'classDef alertCrit fill:#FEF2F2,stroke:#B91C1C,stroke-width:1.5px,color:#B91C1C',
];

function extractMermaidBlocks(markdown) {
  const blocks = [];
  const regex = /```mermaid\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

test('every Markdown guide contains compliant Mermaid diagrams per mermaid-diagrams skill', () => {
  let totalBlocks = 0;

  for (const relPath of MARKDOWN_FILES) {
    const fullPath = path.join(ROOT, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const blocks = extractMermaidBlocks(content);
    assert.ok(blocks.length >= 1, `${relPath} should contain at least one Mermaid diagram`);
    totalBlocks += blocks.length;

    blocks.forEach((block, index) => {
      const label = `${relPath} [mermaid #${index + 1}]`;

      // 1. Must start with JSON %%{init: ...}%%, never YAML frontmatter or ELK
      assert.doesNotMatch(block, /^---\s*$/m, `${label}: must not use YAML frontmatter`);
      assert.doesNotMatch(block, /defaultRenderer\s*:\s*["']?elk/i, `${label}: must not use ELK renderer`);

      const initMatch = block.match(/^\s*%%\{init:\s*([\s\S]*?)\}%%/);
      assert.ok(initMatch, `${label}: must start with universal %%{init: ...}%% JSON directive`);

      const initConfig = JSON.parse(initMatch[1]);
      assert.equal(initConfig.theme, 'base', `${label}: theme must be "base"`);
      assert.ok(
        initConfig.themeVariables.fontFamily.includes('JetBrains Mono'),
        `${label}: must use JetBrains Mono font stack`
      );
      assert.equal(initConfig.themeVariables.fontSize, '12px', `${label}: fontSize must be 12px`);

      const body = block.slice(initMatch[0].length).trim();
      const isFlowchart = /^flowchart\s+(TB|LR|TD|RL|BT)\b/.test(body);
      const isSequence = /^sequenceDiagram\b/.test(body);
      assert.ok(isFlowchart || isSequence, `${label}: must be flowchart or sequenceDiagram`);

      if (isFlowchart) {
        assert.deepEqual(
          initConfig.flowchart,
          { curve: 'basis', nodeSpacing: 35, rankSpacing: 55, padding: 12 },
          `${label}: flowchart layout config must match standard template`
        );

        // 2. All 6 Muted Shibui classDef definitions must be present
        for (const def of EXPECTED_CLASSDEFS) {
          assert.ok(body.includes(def), `${label}: missing "${def}"`);
        }

        // 3. Every subgraph must declare an explicit direction and never be an edge endpoint
        const lines = body.split(/\r?\n/);
        const subgraphIds = new Set();
        for (let i = 0; i < lines.length; i += 1) {
          const sgMatch = lines[i].match(/^\s*subgraph\s+([A-Za-z0-9_]+)/);
          if (sgMatch) {
            subgraphIds.add(sgMatch[1]);
            const nextLine = (lines[i + 1] || '').trim();
            assert.match(
              nextLine,
              /^direction\s+(TB|LR)$/,
              `${label}: subgraph "${sgMatch[1]}" must declare explicit direction TB or LR`
            );
          }
        }

        // Verify every node declaration applies a class via :::className
        for (const line of lines) {
          const trimmed = line.trim();
          if (
            !trimmed ||
            trimmed.startsWith('flowchart ') ||
            trimmed.startsWith('classDef ') ||
            trimmed.startsWith('subgraph ') ||
            trimmed.startsWith('direction ') ||
            trimmed === 'end'
          ) {
            continue;
          }
          // Check node definitions like ID["..."] or ID{"..."}
          const nodeDefMatch = trimmed.match(/^([A-Za-z0-9_]+)(\["|\{"|\(")/);
          if (nodeDefMatch) {
            assert.match(
              trimmed,
              /:::(edge|identity|service|data|obs|alertCrit)\s*$/,
              `${label}: node "${nodeDefMatch[1]}" must apply an explicit Muted Shibui classDef`
            );
          }
          // Check edge endpoints do not reference any subgraph ID
          if (/(-->|\.-+>|---)/.test(trimmed)) {
            const tokens = trimmed
              .replace(/\|[^|]*\|/g, ' ')
              .split(/\s*(?:-->|\.-+>|---)\s*/)
              .map((t) => t.trim());
            for (const tok of tokens) {
              assert.ok(
                !subgraphIds.has(tok),
                `${label}: edge references subgraph "${tok}" instead of a node ID`
              );
            }
          }
        }
      }

      if (isSequence) {
        assert.equal(initConfig.themeVariables.actorBkg, '#F0F4F8', `${label}: actorBkg mismatch`);
        assert.equal(initConfig.themeVariables.noteBkgColor, '#FAF6F0', `${label}: noteBkgColor mismatch`);
      }
    });
  }

  assert.ok(totalBlocks >= 8, `Expected at least 8 Mermaid diagrams across repo, found ${totalBlocks}`);
});

test('all relative Markdown links resolve to existing files', () => {
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const relPath of MARKDOWN_FILES) {
    const fullPath = path.join(ROOT, relPath);
    const dir = path.dirname(fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    let match;
    while ((match = linkRe.exec(content)) !== null) {
      const target = match[1].split('#')[0].trim();
      if (!target || /^(https?:|mailto:|#)/.test(target)) {
        continue;
      }
      const resolved = path.resolve(dir, target);
      assert.ok(
        fs.existsSync(resolved),
        `${relPath}: broken relative link "${match[1]}" (resolved to ${resolved})`
      );
    }
  }
});

test('GitHub Pages layout and CSS uphold modern-web-guidance dark-mode and CSS invariants', () => {
  const layout = fs.readFileSync(path.join(ROOT, 'docs/_layouts/default.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'docs/assets/css/style.css'), 'utf8');

  // dark-mode guide invariants
  assert.match(layout, /<meta\s+name="color-scheme"\s+content="light dark">/);
  assert.match(css, /:root\s*\{[\s\S]*color-scheme:\s*light dark;/);
  assert.match(css, /@media\s*\(prefers-color-scheme:\s*dark\)/);
  assert.match(css, /@supports\s*\(color:\s*light-dark\(white,\s*black\)\)/);
  assert.match(css, /scrollbar-color:\s*var\(--color-scrollbar-thumb\)\s+var\(--color-scrollbar-track\);/);
  assert.match(css, /@supports\s+not\s*\(scrollbar-color:\s*auto\)/);

  // css architecture guide invariants
  assert.match(css, /@layer\s+base,\s*theme,\s*layout,\s*components;/);
  assert.doesNotMatch(css, /^\s*\*\s*\{/m, 'CSS must not include a global * reset');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
