/**
 * Splits an official IITM question-paper PDF into subjects and questions, entirely in the browser.
 *
 * Those PDFs have a text layer with headers such as "Question Number : 34 … Question Type : MCQ",
 * "Correct Marks : 2", "Options :" and "Possible Answers :", while formulas and figures are images.
 * So each question is cut out of the rendered page as an image, using the text positions to find
 * where it starts and ends. Correct options are printed in green and wrong ones in red; we read
 * that colour from the render to build the answer key, then show the options in black with their
 * ID and tick/cross icon painted over.
 */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { Crop, UploadPaper, UploadQuestion } from './uploads';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

type Doc = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;

/** Render scale; crops are stored at 2x and displayed at half size. */
const SCALE = 2;
/** Blank margin (points) assumed at the top and bottom of each page. */
const MARGIN = 18;

interface Item {
  str: string;
  x: number;
  right: number;
}

interface Line {
  page: number;
  text: string;
  top: number;
  bottom: number;
  items: Item[];
}

interface Point {
  page: number;
  y: number;
}

export interface Subject {
  /** Full name as printed, e.g. "FOUNDATION LEVEL : SEMESTER I: STATISTICS FOR DATA SCIENCE I". */
  name: string;
  /** Short display name, e.g. "Statistics for Data Science I". */
  label: string;
  level?: string;
  firstPage: number;
  lastPage: number;
  count: number;
  isStats1: boolean;
  /** Line range [from, to) in Scan.lines. */
  from: number;
  to: number;
}

export interface Scan {
  doc: Doc;
  lines: Line[];
  pageHeights: number[];
  subjects: Subject[];
}

const RE_QNUM = /^Question Number\s*:\s*(\d+)/;
const RE_TERMINATOR = /^(Question Number\s*:|Question Id\s*:|Sub-Section Number|Section Id\s*:)/;
const RE_OPTION_ID = /^(\d{9,})\.?/;

export async function openPdf(data: ArrayBuffer): Promise<Doc> {
  return pdfjs.getDocument({ data }).promise;
}

async function readLines(doc: Doc, pageNo: number): Promise<{ lines: Line[]; height: number }> {
  const page = await doc.getPage(pageNo);
  const vp = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const raw: (Item & { base: number; size: number })[] = [];
  for (const it of content.items) {
    if (!('str' in it) || !it.str.trim()) continue;
    const [x, base] = vp.convertToViewportPoint(it.transform[4], it.transform[5]);
    const size = Math.hypot(it.transform[2], it.transform[3]) || it.height || 10;
    raw.push({ str: it.str, x, right: x + it.width, base, size });
  }
  raw.sort((a, b) => a.base - b.base || a.x - b.x);

  const groups: (typeof raw)[] = [];
  for (const it of raw) {
    const g = groups[groups.length - 1];
    if (g && Math.abs(g[0].base - it.base) < 2.5) g.push(it);
    else groups.push([it]);
  }
  const lines = groups.map((g) => {
    g.sort((a, b) => a.x - b.x);
    let text = '';
    g.forEach((it, i) => {
      text += (i > 0 && it.x - g[i - 1].right > 1.5 ? ' ' : '') + it.str;
    });
    return {
      page: pageNo,
      text: text.replace(/\s+/g, ' ').trim(),
      top: Math.min(...g.map((it) => it.base - it.size * 0.85)),
      bottom: Math.max(...g.map((it) => it.base + it.size * 0.22)),
      items: g.map(({ str, x, right }) => ({ str, x, right })),
    };
  });
  return { lines, height: vp.height };
}

function prettySubject(name: string): { label: string; level?: string } {
  const clean = name.replace(/\((COMPUTER|PEN)[^)]*\)?/i, '').trim();
  const parts = clean
    .split(':')
    .map((s) => s.trim())
    .filter(Boolean);
  const level = /LEVEL/i.test(parts[0] ?? '') ? parts[0].replace(/\s*LEVEL/i, '') : undefined;
  const label = (parts[parts.length - 1] ?? clean)
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(For|And|Of|To|In|The)\b/g, (w) => w.toLowerCase())
    .replace(/\b(Ii|Iii|Iv)\b/g, (r) => r.toUpperCase());
  return { label, level: level && level[0] + level.slice(1).toLowerCase() };
}

/** Pass 1: read the text layer of every page and find the subjects in the paper. */
export async function scanPdf(doc: Doc, onProgress: (page: number, total: number) => void): Promise<Scan> {
  const lines: Line[] = [];
  const pageHeights: number[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const r = await readLines(doc, p);
    lines.push(...r.lines);
    pageHeights[p] = r.height;
    onProgress(p, doc.numPages);
  }

  const headers: { at: number; name: string }[] = [];
  lines.forEach((l, i) => {
    if (!/QUESTION PAPER FOR THE SUBJECT/i.test(l.text)) return;
    const joined = lines
      .slice(i, i + 3)
      .map((x) => x.text)
      .join(' ');
    const m = joined.match(/SUBJECT\s*["“”]([^"“”]+)/i);
    headers.push({
      at: i,
      name: (m?.[1] ?? 'Unknown subject').replace(/\s+/g, ' ').trim(),
    });
  });

  const lastQuestionBefore = (i: number) => {
    for (let k = i; k >= 0; k--) if (RE_QNUM.test(lines[k].text)) return k;
    return i;
  };

  const subjects: Subject[] = [];
  if (headers.length === 0) {
    if (lines.some((l) => RE_QNUM.test(l.text))) {
      subjects.push(makeSubject('Whole paper', 0, lines.length));
    }
  } else {
    headers.forEach((h, k) => {
      const to = k + 1 < headers.length ? lastQuestionBefore(headers[k + 1].at) : lines.length;
      subjects.push(makeSubject(h.name, h.at, to));
    });
  }

  function makeSubject(name: string, from: number, to: number): Subject {
    const slice = lines.slice(from, to);
    const { label, level } = prettySubject(name);
    return {
      name,
      label,
      level,
      from,
      to,
      firstPage: slice[0]?.page ?? 1,
      lastPage: slice[slice.length - 1]?.page ?? 1,
      count: slice.filter((l) => RE_QNUM.test(l.text)).length,
      isStats1: /STATISTICS\s+FOR\s+DATA\s+SCIENCE\s+I(?!I)/i.test(name),
    };
  }

  return { doc, lines, pageHeights, subjects };
}

/** Keeps a few rendered pages around; questions are processed in page order. */
function pageRenderer(doc: Doc) {
  const cache = new Map<number, HTMLCanvasElement>();
  return async (pageNo: number) => {
    const hit = cache.get(pageNo);
    if (hit) return hit;
    const page = await doc.getPage(pageNo);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    cache.set(pageNo, canvas);
    if (cache.size > 4) cache.delete(cache.keys().next().value!);
    return canvas;
  };
}

interface Rect {
  page: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const isInk = (d: Uint8ClampedArray, i: number) => d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235;

/** Pass 2: cut the questions of one subject out of the rendered pages. */
export async function extractSubject(
  scan: Scan,
  subject: Subject,
  onProgress: (done: number, total: number) => void,
): Promise<Pick<UploadPaper, 'contexts' | 'questions'>> {
  const { lines, pageHeights } = scan;
  const render = pageRenderer(scan.doc);
  const end = Math.min(subject.to + 1, lines.length);

  const pageEnd = (page: number): Point => ({
    page,
    y: pageHeights[page] - MARGIN,
  });
  const nextTerminator = (from: number) => {
    for (let k = from; k < end; k++) if (RE_TERMINATOR.test(lines[k].text)) return k;
    return -1;
  };
  /** Where a block that runs up to line k stops (a bit above that line). */
  const stopBefore = (k: number, fallbackPage: number): Point => {
    if (k < 0) return pageEnd(fallbackPage);
    let l = lines[k];
    // A section title ("Sem2 Maths2") sits just above "Section Id"; stop above it too.
    const prev = lines[k - 1];
    if (/^Section Id/.test(l.text) && prev && prev.page === l.page && l.top - prev.bottom < 30) l = prev;
    return { page: l.page, y: l.top - 3 };
  };

  /** Crop the area between two points (possibly across pages) into a trimmed image. */
  async function crop(a: Point, b: Point, opts: { masks?: Rect[]; neutral?: boolean } = {}): Promise<Crop | undefined> {
    const parts: HTMLCanvasElement[] = [];
    for (let p = a.page; p <= b.page; p++) {
      const top = p === a.page ? a.y : MARGIN;
      const bottom = p === b.page ? b.y : pageHeights[p] - MARGIN;
      if (bottom - top < 2) continue;
      const src = await render(p);
      const sy = Math.max(0, Math.floor(top * SCALE));
      const sh = Math.min(src.height - sy, Math.ceil((bottom - top) * SCALE));
      if (sh <= 0) continue;
      const c = document.createElement('canvas');
      c.width = src.width;
      c.height = sh;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(src, 0, sy, src.width, sh, 0, 0, src.width, sh);
      ctx.fillStyle = '#fff';
      for (const m of opts.masks ?? []) {
        if (m.page !== p) continue;
        ctx.fillRect(m.x0 * SCALE, m.y0 * SCALE - sy, (m.x1 - m.x0) * SCALE, (m.y1 - m.y0) * SCALE);
      }
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const d = img.data;
      if (opts.neutral) {
        // Turn the green (correct) and red (wrong) option text black so it doesn't give the answer away.
        for (let i = 0; i < d.length; i += 4) {
          const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
          const green = g - Math.max(r, b) > 40 && Math.abs(r - b) < 40;
          const red = r - Math.max(g, b) > 60 && Math.abs(g - b) < 40;
          if (green || red) d[i] = d[i + 1] = d[i + 2] = Math.min(r, g, b);
        }
        ctx.putImageData(img, 0, 0);
      }
      let x0 = c.width,
        x1 = -1,
        y0 = c.height,
        y1 = -1;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          if (isInk(d, (y * c.width + x) * 4)) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            y1 = y;
          }
        }
      }
      if (x1 < 0) continue;
      const pad = 8;
      x0 = Math.max(0, x0 - pad);
      y0 = Math.max(0, y0 - pad);
      x1 = Math.min(c.width - 1, x1 + pad);
      y1 = Math.min(c.height - 1, y1 + pad);
      const t = document.createElement('canvas');
      t.width = x1 - x0 + 1;
      t.height = y1 - y0 + 1;
      t.getContext('2d')!.drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
      parts.push(t);
    }
    if (parts.length === 0) return undefined;
    const gap = 12;
    const out = document.createElement('canvas');
    out.width = Math.max(...parts.map((p) => p.width));
    out.height = parts.reduce((s, p) => s + p.height, 0) + gap * (parts.length - 1);
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out.width, out.height);
    let y = 0;
    for (const p of parts) {
      ctx.drawImage(p, 0, y);
      y += p.height + gap;
    }
    const blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'));
    if (!blob) return undefined;
    return { blob, w: out.width / SCALE, h: out.height / SCALE };
  }

  /** Position along the flow of pages, so blocks on consecutive pages compare naturally. */
  const flow = (pt: Point) => {
    let offset = 0;
    for (let p = subject.firstPage; p < pt.page; p++) offset += pageHeights[p] - 2 * MARGIN;
    return offset + pt.y - MARGIN;
  };

  /** Horizontal bands of ink between two points (top to bottom), ignoring the masked rectangles. */
  async function inkBands(a: Point, b: Point, masks: Rect[]): Promise<{ top: Point; bottom: Point }[]> {
    const bands: { top: Point; bottom: Point }[] = [];
    for (let p = a.page; p <= b.page; p++) {
      const top = p === a.page ? a.y : MARGIN;
      const bottom = p === b.page ? b.y : pageHeights[p] - MARGIN;
      const c = await render(p);
      const y0 = Math.max(0, Math.floor(top * SCALE));
      const y1 = Math.min(c.height, Math.ceil(bottom * SCALE));
      if (y1 - y0 < 2) continue;
      const d = c.getContext('2d', { willReadFrequently: true })!.getImageData(0, y0, c.width, y1 - y0).data;
      const hidden = masks
        .filter((m) => m.page === p)
        .map((m) => ({ x0: m.x0 * SCALE, x1: m.x1 * SCALE, y0: m.y0 * SCALE - y0, y1: m.y1 * SCALE - y0 }));
      const flush = (start: number, end: number) =>
        bands.push({ top: { page: p, y: (y0 + start) / SCALE }, bottom: { page: p, y: (y0 + end + 1) / SCALE } });
      let start = -1;
      let last = -1;
      for (let y = 0; y < y1 - y0; y++) {
        let ink = false;
        for (let x = 0; x < c.width && !ink; x++) {
          if (!isInk(d, (y * c.width + x) * 4)) continue;
          if (hidden.some((m) => x >= m.x0 && x < m.x1 && y >= m.y0 && y < m.y1)) continue;
          ink = true;
        }
        if (!ink) continue;
        // Gaps under ~1.5pt (fraction bars, sub/superscripts) stay inside one band.
        if (start >= 0 && y - last > 1.5 * SCALE) {
          flush(start, last);
          start = -1;
        }
        if (start < 0) start = y;
        last = y;
      }
      if (start >= 0) flush(start, last);
    }
    return bands;
  }

  /**
   * Right edge (points) of the tick/cross icon printed after an option ID: the first block of ink at
   * least 4pt wide to the right of `from`. Narrower marks, like the ID's trailing full stop, are skipped.
   */
  async function iconEnd(page: number, from: number, top: number, bottom: number, limit: number) {
    const c = await render(page);
    const x0 = Math.max(0, Math.floor(from * SCALE));
    const x1 = Math.min(c.width, Math.ceil(limit * SCALE));
    const y0 = Math.max(0, Math.floor((top - 2) * SCALE));
    const h = Math.max(1, Math.ceil((bottom - top + 4) * SCALE));
    if (x1 <= x0) return undefined;
    const d = c.getContext('2d', { willReadFrequently: true })!.getImageData(x0, y0, x1 - x0, h).data;
    const w = x1 - x0;
    const inkCol = (x: number) => {
      for (let y = 0; y < h; y++) if (isInk(d, (y * w + x) * 4)) return true;
      return false;
    };
    let runStart = -1;
    for (let x = 0; x <= w; x++) {
      const ink = x < w && inkCol(x);
      if (ink && runStart < 0) runStart = x;
      if (!ink && runStart >= 0) {
        if ((x - runStart) / SCALE >= 4) return (x0 + x) / SCALE;
        runStart = -1;
      }
    }
    return undefined;
  }

  /** Is the option ID printed green (correct) or red (wrong)? */
  async function optionColour(r: Rect): Promise<'green' | 'red' | undefined> {
    const c = await render(r.page);
    const x = Math.floor(r.x0 * SCALE);
    const y = Math.floor(r.y0 * SCALE);
    const w = Math.max(1, Math.ceil((r.x1 - r.x0) * SCALE));
    const h = Math.max(1, Math.ceil((r.y1 - r.y0) * SCALE));
    const d = c.getContext('2d', { willReadFrequently: true })!.getImageData(x, y, w, h).data;
    let green = 0,
      red = 0;
    for (let i = 0; i < d.length; i += 4) {
      const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
      if (G > 90 && G > R + 50 && G > B + 30) green++;
      else if (R > 150 && R > G + 70 && R > B + 70) red++;
    }
    if (green + red < 4) return undefined;
    return green > red ? 'green' : 'red';
  }

  const contexts: Crop[] = [];
  const questions: UploadQuestion[] = [];
  let ctxRange: { from: number; to: number; index: number } | undefined;

  const starts: number[] = [];
  for (let i = subject.from; i < end; i++) {
    const t = lines[i].text;
    if (RE_QNUM.test(t) || (/^Question Id\s*:/.test(t) && /COMPREHENSION/i.test(t))) starts.push(i);
  }
  const total = starts.filter((i) => RE_QNUM.test(lines[i].text)).length;
  let done = 0;

  for (const i of starts) {
    if (i >= subject.to) break;
    const head = lines
      .slice(i, i + 4)
      .map((l) => l.text)
      .join(' ');

    if (!RE_QNUM.test(lines[i].text)) {
      // Comprehension block: shared text for the next few questions.
      const range = head.match(/Question Numbers\s*:\s*\((\d+)\s*to\s*(\d+)\)/i);
      let label = -1;
      for (let k = i + 1; k < Math.min(end, i + 8); k++) {
        if (/^Question Label\s*:\s*Comprehension/i.test(lines[k].text)) {
          label = k;
          break;
        }
      }
      if (label < 0 || !range) continue;
      let stop = -1;
      for (let k = label + 1; k < end; k++) {
        if (/^Sub questions/i.test(lines[k].text) || RE_QNUM.test(lines[k].text)) {
          stop = k;
          break;
        }
      }
      const img = await crop(
        { page: lines[label].page, y: lines[label].bottom + 1 },
        stopBefore(stop, lines[label].page),
      );
      if (img) {
        contexts.push(img);
        ctxRange = {
          from: +range[1],
          to: +range[2],
          index: contexts.length - 1,
        };
      }
      continue;
    }

    const n = +lines[i].text.match(RE_QNUM)![1];
    const typeRaw = head.match(/Question Type\s*:\s*(MCQ|MSQ|SA)\b/i)?.[1]?.toUpperCase();
    const marks = +(head.match(/Correct Marks\s*:\s*([\d.]+)/i)?.[1] ?? 0);
    let label = -1;
    for (let k = i + 1; k < Math.min(end, i + 10); k++) {
      if (/^Question Label\s*:/i.test(lines[k].text)) {
        label = k;
        break;
      }
    }
    done++;
    onProgress(done, total);
    if (!typeRaw || label < 0) continue;

    const term = nextTerminator(label + 1);
    const stop = stopBefore(term, lines[label].page);
    const body = lines.slice(label + 1, term < 0 ? end : term);
    const bodyText = body.map((l) => l.text).join(' ');
    // Skip the "is this your subject?" confirmation and the zero-mark formula sheet.
    if (/QUESTION PAPER FOR THE SUBJECT/i.test(bodyText) || marks === 0) continue;

    const stemStart: Point = {
      page: lines[label].page,
      y: lines[label].bottom + 1,
    };
    const q: UploadQuestion = {
      n,
      type: typeRaw === 'SA' ? 'NAT' : (typeRaw as 'MCQ' | 'MSQ'),
      marks,
    };
    if (ctxRange && n >= ctxRange.from && n <= ctxRange.to) q.ctx = ctxRange.index;

    if (q.type === 'NAT') {
      const rk = body.findIndex((l) =>
        /^(Response Type|Evaluation Required|Answers Type|Possible Answers)/i.test(l.text),
      );
      const stemEnd = rk >= 0 ? { page: body[rk].page, y: body[rk].top - 2 } : stop;
      q.stem = await crop(stemStart, stemEnd);
      const pa = body.findIndex((l) => /^Possible Answers/i.test(l.text));
      if (pa >= 0) {
        const inline = body[pa].text.split(':').slice(1).join(':').trim();
        const raw = (inline || body[pa + 1]?.text || '').trim();
        const range = raw.match(/^(-?\d*\.?\d+)\s*to\s*(-?\d*\.?\d+)$/i);
        if (range) q.answer = { min: +range[1], max: +range[2] };
        else if (/^-?\d*\.?\d+$/.test(raw)) q.answer = +raw;
        else if (raw && !RE_TERMINATOR.test(raw)) q.answer = raw;
      }
    } else {
      const ok = body.findIndex((l) => /^Options\s*:/i.test(l.text));
      if (ok < 0) continue;
      const optLine = body[ok];
      q.stem = await crop(stemStart, {
        page: optLine.page,
        y: optLine.top - 2,
      });

      const ids = body
        .map((l, k) => ({ l, k }))
        .filter(({ l, k }) => k > ok && RE_OPTION_ID.test(l.items[0]?.str ?? ''));
      const idBoxes: { id: Rect; mask: Rect }[] = [];
      for (const { l } of ids) {
        const id = l.items[0];
        const idText = id.str.match(RE_OPTION_ID)![0];
        const idRight = id.x + (id.right - id.x) * (idText.length / id.str.length);
        const next = l.items[1];
        const textStart = next && next.x > idRight && next.x < idRight + 30 ? next.x - 1 : undefined;
        // Cover the ID and the tick/cross icon that follows it, but not the option itself.
        const icon = await iconEnd(l.page, idRight - 1, l.top, l.bottom, textStart ?? idRight + 30);
        const x1 = Math.min(icon !== undefined ? icon + 1 : idRight + 15, textStart ?? Infinity);
        idBoxes.push({
          id: { page: l.page, x0: id.x, y0: l.top, x1: idRight, y1: l.bottom },
          mask: { page: l.page, x0: id.x - 2, y0: l.top - 3, x1, y1: l.bottom + 3 },
        });
      }

      // Each option spans its ID line plus the ink that belongs to it. Option images can sit above, beside
      // or below the ID, so give every band of ink to the nearer of: the option above (as grown so far)
      // or the next option's ID line.
      const extents = ids.map(({ l }) => {
        const top: Point = { page: l.page, y: l.top };
        const bottom: Point = { page: l.page, y: l.bottom };
        return { idTop: flow(top), top, bottom };
      });
      const bands = await inkBands(
        { page: optLine.page, y: optLine.bottom + 1 },
        stop,
        idBoxes.map((b) => b.mask),
      );
      for (const band of bands) {
        const t = flow(band.top);
        const bt = flow(band.bottom);
        let k = 0;
        extents.forEach((e, m) => {
          if (e.idTop <= bt) k = m;
        });
        const next = extents[k + 1];
        if (next && extents[k].idTop <= bt) {
          const toPrev = Math.max(0, t - flow(extents[k].bottom));
          const toNext = Math.max(0, next.idTop - bt);
          if (toNext < toPrev) k++;
        }
        const e = extents[k];
        if (t < flow(e.top)) e.top = band.top;
        if (bt > flow(e.bottom)) e.bottom = band.bottom;
      }

      const options: Crop[] = [];
      const correct: number[] = [];
      let coloured = false;
      for (let m = 0; m < ids.length; m++) {
        const colour = await optionColour(idBoxes[m].id);
        if (colour) coloured = true;
        if (colour === 'green') correct.push(m);
        const { top, bottom } = extents[m];
        const img = await crop(
          { page: top.page, y: top.y - 2 },
          { page: bottom.page, y: bottom.y + 2 },
          { masks: idBoxes.map((b) => b.mask), neutral: true },
        );
        options.push(img ?? { blob: new Blob(), w: 0, h: 0 });
      }
      if (options.length < 2) continue;
      q.options = options;
      if (coloured && correct.length > 0) q.correct = correct;
    }
    questions.push(q);
  }
  onProgress(total, total);

  return { contexts, questions };
}
