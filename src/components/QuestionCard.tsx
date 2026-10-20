import { useState } from 'react';
import { Link } from 'react-router-dom';
import { answerText, checkNumeric, type Question } from '../lib/data';
import { Markdown } from '../lib/Markdown';
import { useProgress } from '../lib/progress';
import { weekByNumber } from '../data/weeks';

const LETTERS = 'ABCDEFGH';
const base = import.meta.env.BASE_URL;

interface Props {
  q: Question;
  index?: number;
  /** "week" shows the paper tag; "paper" shows the week tag. */
  context: 'week' | 'paper';
  showContext?: boolean;
}

export function QuestionCard({ q, index, context, showContext = true }: Props) {
  const { attempts, bookmarks, record, toggleBookmark } = useProgress();
  const [picked, setPicked] = useState<number[]>([]);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const correctSet = q.correct ?? [];
  const isCorrect =
    q.type === 'NAT'
      ? checkNumeric(value, q.answer)
      : picked.length === correctSet.length && picked.every((p) => correctSet.includes(p));

  const canCheck = q.type === 'NAT' ? value.trim() !== '' : picked.length > 0;
  const prev = attempts[q.uid];
  const bookmarked = bookmarks.includes(q.uid);
  const show = checked || revealed;

  const toggle = (i: number) => {
    if (checked) return;
    if (q.type === 'MCQ') setPicked([i]);
    else setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };

  const check = () => {
    if (!canCheck) return;
    setChecked(true);
    record(q.uid, isCorrect);
  };

  const retry = () => {
    setChecked(false);
    setRevealed(false);
    setPicked([]);
    setValue('');
  };

  const week = weekByNumber(q.week);

  return (
    <article className={`qcard ${checked ? (isCorrect ? 'is-right' : 'is-wrong') : ''}`} id={q.uid}>
      <header className="qcard-head">
        <div className="qcard-tags">
          {index !== undefined && <span className="qnum">Q{index}</span>}
          {context === 'week' ? (
            <Link to={`/paper/${q.paper.id}`} className="tag tag-term" title="Open the full paper">
              {q.paper.term} {q.paper.year} · {q.paper.exam}
            </Link>
          ) : (
            <Link to={`/week/${q.week}`} className="tag tag-week" title={week?.title}>
              Week {q.week} · {week?.title}
            </Link>
          )}
          <span className="tag">{q.type === 'NAT' ? 'Numerical' : q.type}</span>
          <span className="tag">
            {q.marks} mark{q.marks === 1 ? '' : 's'}
          </span>
          {prev && !checked && (
            <span className={`tag ${prev.correct ? 'tag-ok' : 'tag-bad'}`}>
              {prev.correct ? 'Solved' : 'Tried'}
            </span>
          )}
        </div>
        <button
          className={`icon-btn ${bookmarked ? 'on' : ''}`}
          onClick={() => toggleBookmark(q.uid)}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </header>

      {showContext && q.context && (
        <div className="qcontext">
          <Markdown text={q.context} />
        </div>
      )}
      <Markdown text={q.q} className="qtext" />
      {q.figure && (
        <figure className="qfig">
          <img src={`${base}figs/${q.figure}`} alt="Figure for this question" loading="lazy" />
        </figure>
      )}

      {q.type !== 'NAT' && q.options && (
        <>
          {q.type === 'MSQ' && <p className="hint">Select all that apply.</p>}
          <ul className="options" role={q.type === 'MCQ' ? 'radiogroup' : 'group'}>
            {q.options.map((opt, i) => {
              const sel = picked.includes(i);
              const right = correctSet.includes(i);
              const state = show ? (right ? 'right' : sel ? 'wrong' : '') : sel ? 'sel' : '';
              return (
                <li key={i}>
                  <button
                    className={`option ${state}`}
                    onClick={() => toggle(i)}
                    role={q.type === 'MCQ' ? 'radio' : 'checkbox'}
                    aria-checked={sel}
                    disabled={checked}
                  >
                    <span className={`opt-key ${q.type === 'MSQ' ? 'square' : ''}`}>{LETTERS[i]}</span>
                    <Markdown text={opt} inlineOnly className="opt-text" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {q.type === 'NAT' && (
        <div className="nat">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Your answer"
            value={value}
            disabled={checked}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            aria-label="Numerical answer"
          />
        </div>
      )}

      <footer className="qcard-foot">
        {!checked ? (
          <>
            <button className="btn btn-primary" onClick={check} disabled={!canCheck}>
              Check answer
            </button>
            <button className="btn btn-ghost" onClick={() => setRevealed((r) => !r)}>
              {revealed ? 'Hide answer' : 'Show answer'}
            </button>
          </>
        ) : (
          <>
            <span className={`verdict ${isCorrect ? 'ok' : 'bad'}`}>{isCorrect ? 'Correct!' : 'Not quite'}</span>
            <button className="btn btn-ghost" onClick={retry}>
              Try again
            </button>
          </>
        )}
        {show && q.type === 'NAT' && (
          <span className="answer">
            Accepted answer: <strong>{answerText(q.answer)}</strong>
          </span>
        )}
        {show && q.type !== 'NAT' && (
          <span className="answer">
            Answer: <strong>{correctSet.map((i) => LETTERS[i]).join(', ')}</strong>
          </span>
        )}
      </footer>
      {show && q.note && <Markdown text={q.note} className="qnote" />}
    </article>
  );
}
