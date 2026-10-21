import { Link } from 'react-router-dom';
import { TERMS, examName, totalMarks } from '../lib/data';
import { useProgress } from '../lib/progress';

const examIcon: Record<string, string> = { 'Quiz 1': 'Q1', 'Quiz 2': 'Q2', 'End Term': 'ET' };

export default function Papers() {
  const { attempts } = useProgress();
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Practice by paper</p>
        <h1>Question papers</h1>
        <p className="lede">Pick a term and an exam. Papers are listed newest first: September, then May, then January.</p>
      </header>

      <div className="term-list">
        {TERMS.map((t) => (
          <section key={t.key} className="term-block">
            <div className="term-label">
              <span className="term-month">{t.term}</span>
              <span className="term-year">{t.year}</span>
            </div>
            <div className="term-papers">
              {t.papers.map((p) => {
                const done = p.questions.filter((q) => attempts[`${p.id}-${q.n}`]).length;
                return (
                  <Link key={p.id} to={`/paper/${p.id}`} className="paper-card">
                    <span className="paper-badge">{examIcon[p.exam]}</span>
                    <div>
                      <h3>{examName(p)}</h3>
                      <p>
                        {p.questions.length} questions · {totalMarks(p)} marks
                      </p>
                    </div>
                    <span className="paper-done">{done ? `${done}/${p.questions.length}` : 'Start'}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
