import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WEEKS, weekByNumber } from '../data/weeks';
import { EXAMS, questionsForWeek, type Exam } from '../lib/data';
import { Markdown, TeX } from '../lib/Markdown';
import { QuestionCard } from '../components/QuestionCard';
import { useProgress } from '../lib/progress';

export default function WeekPage() {
  const n = Number(useParams().n);
  const week = weekByNumber(n);
  const [exam, setExam] = useState<Exam | 'All'>('All');
  const [hideSolved, setHideSolved] = useState(false);
  const { attempts } = useProgress();

  const all = useMemo(() => questionsForWeek(n), [n]);
  const shown = all.filter(
    (q) => (exam === 'All' || q.paper.exam === exam) && !(hideSolved && attempts[q.uid]?.correct),
  );

  if (!week) {
    return (
      <div className="page">
        <p>
          Week not found. <Link to="/weeks">Back to weeks</Link>
        </p>
      </div>
    );
  }

  const prev = WEEKS.find((w) => w.n === n - 1);
  const next = WEEKS.find((w) => w.n === n + 1);
  let lastTerm = '';

  return (
    <div className="page">
      <nav className="crumbs">
        <Link to="/weeks">Weeks</Link> <span>/</span> Week {n}
      </nav>
      <header className="page-head">
        <p className="eyebrow">Week {n}</p>
        <h1>{week.title}</h1>
        <p className="lede">{week.tagline}</p>
      </header>

      <section className="intro">
        <div className="intro-main">
          <h2>Introduction</h2>
          <Markdown text={week.intro} />
          <h3>Key ideas</h3>
          <ul className="concepts">
            {week.concepts.map((c, i) => (
              <li key={i}>
                <Markdown text={c} inlineOnly />
              </li>
            ))}
          </ul>
        </div>
        <aside className="intro-side">
          {week.formulas.length > 0 && (
            <div className="formula-box">
              <h3>Formula sheet</h3>
              {week.formulas.map((f) => (
                <div key={f.label} className="formula">
                  <span>{f.label}</span>
                  <TeX src={f.tex} />
                </div>
              ))}
            </div>
          )}
          <div className="tips-box">
            <h3>Exam tips</h3>
            <ul>
              {week.tips.map((t, i) => (
                <li key={i}>
                  <Markdown text={t} inlineOnly />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-head sticky-filters">
          <h2>
            Previous-year questions <span className="muted">({shown.length})</span>
          </h2>
          <div className="filters">
            <div className="seg" role="tablist" aria-label="Filter by exam">
              {(['All', ...EXAMS] as const).map((e) => (
                <button key={e} className={exam === e ? 'on' : ''} onClick={() => setExam(e)} role="tab" aria-selected={exam === e}>
                  {e}
                </button>
              ))}
            </div>
            <label className="toggle">
              <input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} />
              Hide solved
            </label>
          </div>
        </div>

        {shown.length === 0 && (
          <div className="empty">
            {all.length === 0
              ? 'No questions for this week yet: it usually appears in the end-term exam. More papers are being added.'
              : 'Nothing matches these filters.'}
          </div>
        )}

        <div className="qlist">
          {shown.map((q, i) => {
            const term = `${q.paper.term} ${q.paper.year}`;
            const header = term !== lastTerm;
            lastTerm = term;
            return (
              <div key={q.uid}>
                {header && <h3 className="term-divider">{term}</h3>}
                <QuestionCard q={q} index={i + 1} context="week" />
              </div>
            );
          })}
        </div>
      </section>

      <nav className="pager">
        {prev ? (
          <Link to={`/week/${prev.n}`} className="pager-link">
            ← Week {prev.n}: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/week/${next.n}`} className="pager-link right">
            Week {next.n}: {next.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}
