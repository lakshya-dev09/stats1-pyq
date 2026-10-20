export type QType = 'MCQ' | 'MSQ' | 'NAT';
export type Exam = 'Quiz 1' | 'Quiz 2' | 'End Term';
export type Term = 'Jan' | 'May' | 'Sep';

export interface RawQuestion {
  n: number;
  type: QType;
  marks: number;
  week: number;
  q: string;
  context?: string;
  figure?: string;
  options?: string[];
  correct?: number[];
  answer?: number | string | { min: number; max: number };
  /** Shown with the answer, e.g. when the source key looks questionable. */
  note?: string;
}

export interface Paper {
  id: string;
  year: number;
  term: Term;
  exam: Exam;
  source?: string;
  questions: RawQuestion[];
}

export interface Question extends RawQuestion {
  uid: string;
  paper: Paper;
}

const TERM_ORDER: Record<Term, number> = { Jan: 1, May: 2, Sep: 3 };
const EXAM_ORDER: Record<Exam, number> = { 'Quiz 1': 1, 'Quiz 2': 2, 'End Term': 3 };

const modules = import.meta.glob<Paper>('../data/papers/*.json', { eager: true, import: 'default' });

/** Newest term first: Sep > May > Jan within a year. */
export const recency = (p: Paper) => p.year * 10 + TERM_ORDER[p.term];

export const PAPERS: Paper[] = Object.values(modules).sort(
  (a, b) => recency(b) - recency(a) || EXAM_ORDER[a.exam] - EXAM_ORDER[b.exam],
);

export const QUESTIONS: Question[] = PAPERS.flatMap((paper) =>
  paper.questions.map((q) => ({ ...q, uid: `${paper.id}-${q.n}`, paper })),
);

export const paperById = (id: string) => PAPERS.find((p) => p.id === id);

export const questionsForWeek = (week: number) => QUESTIONS.filter((q) => q.week === week);

export const termLabel = (p: Paper) => `${p.term} ${p.year}`;

export const paperLabel = (p: Paper) => `${p.exam} · ${termLabel(p)}`;

export const EXAMS: Exam[] = ['Quiz 1', 'Quiz 2', 'End Term'];

export interface TermGroup {
  key: string;
  year: number;
  term: Term;
  papers: Paper[];
}

export const TERMS: TermGroup[] = PAPERS.reduce<TermGroup[]>((groups, p) => {
  const key = `${p.year}-${p.term}`;
  let g = groups.find((x) => x.key === key);
  if (!g) {
    g = { key, year: p.year, term: p.term, papers: [] };
    groups.push(g);
  }
  g.papers.push(p);
  return groups;
}, []);

export const totalMarks = (p: Paper) => p.questions.reduce((s, q) => s + q.marks, 0);

/** Check a numeric answer against an exact value (with rounding tolerance) or a range. */
export function checkNumeric(input: string, answer: RawQuestion['answer']): boolean {
  const v = Number(input.trim());
  if (input.trim() === '' || Number.isNaN(v) || answer === undefined) return false;
  if (typeof answer === 'object') return v >= answer.min - 1e-9 && v <= answer.max + 1e-9;
  const a = Number(answer);
  const decimals = (String(answer).split('.')[1] ?? '').length;
  const tol = decimals ? 0.5 * 10 ** -decimals + 1e-9 : 1e-9;
  return Math.abs(v - a) <= tol;
}

export function answerText(answer: RawQuestion['answer']): string {
  if (answer === undefined) return '';
  if (typeof answer === 'object') return `${answer.min} to ${answer.max}`;
  return String(answer);
}
