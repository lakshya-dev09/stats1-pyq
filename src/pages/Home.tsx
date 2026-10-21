import { Link } from 'react-router-dom';
import { PAPERS, QUESTIONS, TERMS, examName, questionsForWeek } from '../lib/data';
import { WEEKS } from '../data/weeks';
import { useProgress } from '../lib/progress';

export default function Home() {
  const { attempts } = useProgress();
  const solved = QUESTIONS.filter((q) => attempts[q.uid]?.correct).length;
  const latest = TERMS[0];

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">IIT Madras BS · Statistics for Data Science I</p>
        <h1>
          Practice every Stats&nbsp;1 PYQ, <span className="hero-accent">week by week.</span>
        </h1>
        <p className="lede">
          Learn the idea behind each week, then work through real quiz and end-term questions, newest first, with
          instant answer checking.
        </p>
        <div className="hero-stats">
          <div>
            <strong>{QUESTIONS.length}</strong>
            <span>questions</span>
          </div>
          <div>
            <strong>{PAPERS.length}</strong>
            <span>papers</span>
          </div>
          <div>
            <strong>{solved}</strong>
            <span>solved by you</span>
          </div>
        </div>
      </section>

      <section className="mode-grid">
        <Link to="/weeks" className="mode-card">
          <span className="mode-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </span>
          <h2>Practice by week</h2>
          <p>Short concept intro and key formulas for each of the 12 weeks, followed by every PYQ on that topic.</p>
          <span className="mode-cta">Choose a week →</span>
        </Link>
        <Link to="/papers" className="mode-card">
          <span className="mode-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M9 8h6M9 12h6M9 16h4" />
            </svg>
          </span>
          <h2>Practice by paper</h2>
          <p>Attempt a full Quiz 1, Quiz 2 or End Term paper from a specific term, exactly as it was set.</p>
          <span className="mode-cta">Browse papers →</span>
        </Link>
      </section>

      {latest && (
        <section className="section">
          <div className="section-head">
            <h2>Latest term · {latest.term} {latest.year}</h2>
            <Link to="/papers" className="link">
              All papers
            </Link>
          </div>
          <div className="paper-row">
            {latest.papers.map((p) => (
              <Link key={p.id} to={`/paper/${p.id}`} className="paper-chip">
                <strong>{examName(p)}</strong>
                <span>{p.questions.length} questions</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Weeks at a glance</h2>
          <Link to="/weeks" className="link">
            Open all
          </Link>
        </div>
        <div className="week-mini-grid">
          {WEEKS.map((w) => (
            <Link key={w.n} to={`/week/${w.n}`} className="week-mini">
              <span className="week-num">W{w.n}</span>
              <span className="week-mini-title">{w.title}</span>
              <span className="week-mini-count">{questionsForWeek(w.n).length}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
