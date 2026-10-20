import { Link } from 'react-router-dom';
import { WEEKS } from '../data/weeks';
import { questionsForWeek } from '../lib/data';
import { useProgress } from '../lib/progress';

const GROUPS = [
  { label: 'Descriptive statistics', weeks: [1, 2, 3, 4] },
  { label: 'Counting', weeks: [5, 6] },
  { label: 'Probability', weeks: [7, 8] },
  { label: 'Random variables', weeks: [9, 10, 11, 12] },
];

export default function Weeks() {
  const { attempts } = useProgress();
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Practice by week</p>
        <h1>12 weeks of Statistics 1</h1>
        <p className="lede">
          Each week opens with a short introduction and the formulas you need, followed by every previous-year question
          on that topic, latest term first.
        </p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.label} className="section">
          <h2 className="group-label">{g.label}</h2>
          <div className="week-grid">
            {g.weeks.map((n) => {
              const w = WEEKS.find((x) => x.n === n)!;
              const qs = questionsForWeek(n);
              const done = qs.filter((q) => attempts[q.uid]?.correct).length;
              const pct = qs.length ? Math.round((done / qs.length) * 100) : 0;
              return (
                <Link key={n} to={`/week/${n}`} className="week-card">
                  <div className="week-card-top">
                    <span className="week-num">Week {n}</span>
                    <span className="week-count">{qs.length} Qs</span>
                  </div>
                  <h3>{w.title}</h3>
                  <p>{w.tagline}</p>
                  <div className="progress" aria-label={`${done} of ${qs.length} solved`}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="progress-label">
                    {done}/{qs.length} solved
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
