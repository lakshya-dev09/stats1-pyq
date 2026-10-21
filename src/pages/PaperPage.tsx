import { Link, useParams } from 'react-router-dom';
import { QUESTIONS, examName, paperById, totalMarks } from '../lib/data';
import { QuestionCard } from '../components/QuestionCard';
import { useProgress } from '../lib/progress';

export default function PaperPage() {
  const { id = '' } = useParams();
  const paper = paperById(id);
  const { attempts } = useProgress();

  if (!paper) {
    return (
      <div className="page">
        <p>
          Paper not found. <Link to="/papers">Back to papers</Link>
        </p>
      </div>
    );
  }

  const qs = QUESTIONS.filter((q) => q.paper.id === paper.id);
  const tried = qs.filter((q) => attempts[q.uid]);
  const scored = tried.filter((q) => attempts[q.uid].correct).reduce((s, q) => s + q.marks, 0);
  let lastContext: string | undefined;

  return (
    <div className="page">
      <nav className="crumbs">
        <Link to="/papers">Papers</Link> <span>/</span> {paper.term} {paper.year}
      </nav>
      <header className="page-head paper-head">
        <div>
          <p className="eyebrow">
            {paper.term} {paper.year} term
          </p>
          <h1>{examName(paper)}</h1>
          <p className="lede">
            {qs.length} questions · {totalMarks(paper)} marks
            {paper.source && (
              <>
                {' · '}
                <a href={paper.source} target="_blank" rel="noreferrer">
                  Original PDF
                </a>
              </>
            )}
          </p>
        </div>
        <div className="scorebox">
          <strong>
            {scored}
            <small>/{totalMarks(paper)}</small>
          </strong>
          <span>
            {tried.length}/{qs.length} attempted
          </span>
        </div>
      </header>

      <div className="qlist">
        {qs.map((q, i) => {
          const showContext = q.context !== lastContext;
          lastContext = q.context;
          return <QuestionCard key={q.uid} q={q} index={i + 1} context="paper" showContext={showContext} />;
        })}
      </div>
    </div>
  );
}
