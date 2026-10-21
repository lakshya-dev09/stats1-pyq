// Validates every paper in src/data/papers: schema, answer keys, figures and LaTeX.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import katex from 'katex';

const dir = new URL('../src/data/papers/', import.meta.url);
const figs = new URL('../public/figs/', import.meta.url);
const errors = [];
let count = 0;

const checkTex = (where, text) => {
  for (const m of text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g)) {
    try {
      katex.renderToString(m[1] ?? m[2], { throwOnError: true, displayMode: !!m[1] });
    } catch (e) {
      errors.push(`${where}: bad LaTeX "${m[0]}" (${e.message.split('\n')[0]})`);
    }
  }
};

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
  if (`${p.id}.json` !== file) errors.push(`${file}: id "${p.id}" does not match filename`);
  if (!['Jan', 'May', 'Sep'].includes(p.term)) errors.push(`${file}: bad term ${p.term}`);
  if (!['Quiz 1', 'Quiz 2', 'End Term'].includes(p.exam)) errors.push(`${file}: bad exam ${p.exam}`);
  if (p.session !== undefined && !['FN', 'AN'].includes(p.session)) errors.push(`${file}: bad session ${p.session}`);
  const seen = new Set();
  for (const q of p.questions) {
    const where = `${file} Q${q.n}`;
    count++;
    if (seen.has(q.n)) errors.push(`${where}: duplicate question number`);
    seen.add(q.n);
    if (!(q.week >= 1 && q.week <= 12)) errors.push(`${where}: week ${q.week} out of range`);
    if (!(q.marks > 0)) errors.push(`${where}: missing marks`);
    if (q.type === 'NAT') {
      const a = q.answer;
      const ok = typeof a === 'number' || (a && typeof a.min === 'number' && typeof a.max === 'number' && a.min <= a.max);
      if (!ok) errors.push(`${where}: NAT needs numeric answer or {min,max}`);
    } else if (q.type === 'MCQ' || q.type === 'MSQ') {
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${where}: needs options`);
      if (!Array.isArray(q.correct) || q.correct.length === 0) errors.push(`${where}: needs correct[]`);
      else if (q.correct.some((i) => i < 0 || i >= q.options.length)) errors.push(`${where}: correct index out of range`);
      if (q.type === 'MCQ' && q.correct?.length !== 1) errors.push(`${where}: MCQ must have exactly one correct option`);
    } else errors.push(`${where}: unknown type ${q.type}`);
    if (q.figure && !existsSync(new URL(q.figure, figs))) errors.push(`${where}: missing figure ${q.figure}`);
    for (const t of [q.q, q.context, q.note, ...(q.options ?? [])]) if (t) checkTex(where, t);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`OK: ${count} questions validated.`);
