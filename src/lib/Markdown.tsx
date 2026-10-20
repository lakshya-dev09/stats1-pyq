import katex from 'katex';
import { useMemo } from 'react';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tex = (src: string, display: boolean) =>
  katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore' });

/** Inline formatting: $$display$$, $inline$, **bold**, *italic*. Math is pulled out before escaping. */
function inline(text: string): string {
  const parts: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    parts.push(formatText(text.slice(last, m.index)));
    parts.push(m[1] !== undefined ? tex(m[1], true) : tex(m[2], false));
    last = re.lastIndex;
  }
  parts.push(formatText(text.slice(last)));
  return parts.join('');
}

const formatText = (s: string) =>
  escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

/** Tiny block-level markdown: paragraphs, "- " lists and pipe tables. */
export function renderMarkdown(src: string): string {
  const blocks = src.replace(/\r/g, '').split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      if (lines.length >= 2 && lines[0].trim().startsWith('|') && /^\s*\|?\s*:?-{2,}/.test(lines[1])) {
        const head = splitRow(lines[0]);
        const rows = lines.slice(2).filter((l) => l.trim()).map(splitRow);
        return `<div class="md-table"><table><thead><tr>${head
          .map((h) => `<th>${inline(h)}</th>`)
          .join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`;
      }
      const out: string[] = [];
      let list: string[] = [];
      let para: string[] = [];
      const flushList = () => {
        if (list.length) out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`);
        list = [];
      };
      const flushPara = () => {
        if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
        para = [];
      };
      for (const line of lines) {
        const li = line.match(/^\s*(?:-|\(\w+\))\s+(.*)$/);
        if (li && line.trim().startsWith('-')) {
          flushPara();
          list.push(li[1]);
        } else {
          flushList();
          para.push(line);
        }
      }
      flushList();
      flushPara();
      return out.join('');
    })
    .join('');
}

export function Markdown({ text, className, inlineOnly }: { text: string; className?: string; inlineOnly?: boolean }) {
  const html = useMemo(() => (inlineOnly ? inline(text) : renderMarkdown(text)), [text, inlineOnly]);
  const Tag = inlineOnly ? 'span' : 'div';
  return <Tag className={`md ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function TeX({ src, display = true }: { src: string; display?: boolean }) {
  const html = useMemo(() => tex(src, display), [src, display]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
