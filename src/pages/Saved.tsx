import { Link } from 'react-router-dom';
import { QUESTIONS } from '../lib/data';
import { QuestionCard } from '../components/QuestionCard';
import { useProgress } from '../lib/progress';

export default function Saved() {
  const { bookmarks, attempts, reset } = useProgress();
  const saved = QUESTIONS.filter((q) => bookmarks.includes(q.uid));
  const wrong = QUESTIONS.filter((q) => attempts[q.uid] && !attempts[q.uid].correct && !bookmarks.includes(q.uid));

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Your list</p>
        <h1>Saved &amp; to revise</h1>
        <p className="lede">Bookmarked questions and the ones you got wrong. Progress is stored only in this browser.</p>
      </header>

      {saved.length === 0 && wrong.length === 0 && (
        <div className="empty">
          Nothing here yet. Bookmark questions or attempt a few from a <Link to="/weeks">week</Link> or{' '}
          <Link to="/papers">paper</Link>.
        </div>
      )}

      {saved.length > 0 && (
        <section className="section">
          <h2>Bookmarked ({saved.length})</h2>
          <div className="qlist">
            {saved.map((q) => (
              <QuestionCard key={q.uid} q={q} context="week" />
            ))}
          </div>
        </section>
      )}

      {wrong.length > 0 && (
        <section className="section">
          <h2>Got wrong ({wrong.length})</h2>
          <div className="qlist">
            {wrong.map((q) => (
              <QuestionCard key={q.uid} q={q} context="week" />
            ))}
          </div>
        </section>
      )}

      {Object.keys(attempts).length > 0 && (
        <button
          className="btn btn-ghost danger"
          onClick={() => window.confirm('Clear all progress and bookmarks in this browser?') && reset()}
        >
          Reset my progress
        </button>
      )}
    </div>
  );
}
