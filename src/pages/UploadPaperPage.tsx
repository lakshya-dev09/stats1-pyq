import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { answerText, checkNumeric } from '../lib/data';
import { getUpload, type Crop, type UploadPaper, type UploadQuestion } from '../lib/uploads';

const LETTERS = 'ABCDEFGH';
/** Crops are cut at the PDF's own size; show them a little larger so the text matches the site. */
const ZOOM = 1.2;

function CropImg({ crop, alt }: { crop: Crop; alt: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(crop.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [crop.blob]);
  if (!url) return null;
  return <img src={url} alt={alt} width={crop.w * ZOOM} height={crop.h * ZOOM} className="crop" />;
}

function UploadQuestionCard({
  q,
  index,
  context,
  onResult,
}: {
  q: UploadQuestion;
  index: number;
  context?: Crop;
  onResult: (correct: boolean | null) => void;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const hasKey = q.type === 'NAT' ? q.answer !== undefined : !!q.correct?.length;
  const correctSet = q.correct ?? [];
  const isCorrect =
    q.type === 'NAT'
      ? typeof q.answer === 'string'
        ? value.trim().toLowerCase() === q.answer.trim().toLowerCase()
        : checkNumeric(value, q.answer)
      : picked.length === correctSet.length && picked.every((p) => correctSet.includes(p));
  const canCheck = hasKey && (q.type === 'NAT' ? value.trim() !== '' : picked.length > 0);
  const show = checked || revealed;

  const toggle = (i: number) => {
    if (checked) return;
    if (q.type === 'MCQ') setPicked([i]);
    else setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };

  const check = () => {
    if (!canCheck) return;
    setChecked(true);
    onResult(isCorrect);
  };

  const retry = () => {
    setChecked(false);
    setRevealed(false);
    setPicked([]);
    setValue('');
    onResult(null);
  };

  return (
    <article className={`qcard ${checked ? (isCorrect ? 'is-right' : 'is-wrong') : ''}`}>
      <header className="qcard-head">
        <div className="qcard-tags">
          <span className="qnum">Q{index}</span>
          <span className="tag">{q.type === 'NAT' ? 'Numerical' : q.type}</span>
          <span className="tag">
            {q.marks} mark{q.marks === 1 ? '' : 's'}
          </span>
          {!hasKey && <span className="tag">No key found</span>}
        </div>
      </header>

      {context && (
        <div className="qcontext crop-box">
          <CropImg crop={context} alt="Shared information for this question" />
        </div>
      )}
      {q.stem && (
        <div className="crop-box">
          <CropImg crop={q.stem} alt={`Question ${index}`} />
        </div>
      )}

      {q.type !== 'NAT' && q.options && (
        <>
          {q.type === 'MSQ' && <p className="hint">Select all that apply.</p>}
          <ul className="options" role={q.type === 'MCQ' ? 'radiogroup' : 'group'}>
            {q.options.map((opt, i) => {
              const sel = picked.includes(i);
              const right = correctSet.includes(i);
              const state = show && hasKey ? (right ? 'right' : sel ? 'wrong' : '') : sel ? 'sel' : '';
              return (
                <li key={i}>
                  <button
                    className={`option ${state}`}
                    onClick={() => toggle(i)}
                    role={q.type === 'MCQ' ? 'radio' : 'checkbox'}
                    aria-checked={sel}
                    aria-label={`Option ${LETTERS[i]}`}
                    disabled={checked}
                  >
                    <span className={`opt-key ${q.type === 'MSQ' ? 'square' : ''}`}>{LETTERS[i]}</span>
                    <span className="opt-crop">{opt.w > 0 && <CropImg crop={opt} alt={`Option ${LETTERS[i]}`} />}</span>
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
            {hasKey && (
              <button className="btn btn-ghost" onClick={() => setRevealed((r) => !r)}>
                {revealed ? 'Hide answer' : 'Show answer'}
              </button>
            )}
          </>
        ) : (
          <>
            <span className={`verdict ${isCorrect ? 'ok' : 'bad'}`}>{isCorrect ? 'Correct!' : 'Not quite'}</span>
            <button className="btn btn-ghost" onClick={retry}>
              Try again
            </button>
          </>
        )}
        {show && hasKey && q.type === 'NAT' && (
          <span className="answer">
            Accepted answer: <strong>{typeof q.answer === 'string' ? q.answer : answerText(q.answer)}</strong>
          </span>
        )}
        {show && hasKey && q.type !== 'NAT' && (
          <span className="answer">
            Answer: <strong>{correctSet.map((i) => LETTERS[i]).join(', ')}</strong>
          </span>
        )}
      </footer>
    </article>
  );
}

export default function UploadPaperPage() {
  const { id = '' } = useParams();
  const [paper, setPaper] = useState<UploadPaper | null | undefined>(undefined);
  const [results, setResults] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getUpload(id).then((p) => setPaper(p ?? null));
  }, [id]);

  if (paper === undefined) return <div className="page" />;
  if (paper === null)
    return (
      <div className="page">
        <div className="empty">
          <p>This paper isn’t saved in this browser.</p>
          <Link to="/upload" className="btn btn-primary">
            Upload a paper
          </Link>
        </div>
      </div>
    );

  const total = paper.questions.reduce((s, q) => s + q.marks, 0);
  const score = paper.questions.reduce((s, q, i) => s + (results[i] ? q.marks : 0), 0);
  const answered = Object.keys(results).length;

  return (
    <div className="page">
      <nav className="crumbs">
        <Link to="/upload">Uploads</Link> <span>/</span> {paper.name}
      </nav>
      <header className="page-head paper-head">
        <div>
          <p className="eyebrow">Uploaded paper</p>
          <h1>{paper.subject}</h1>
          <p className="lede">
            {paper.name} · {paper.questions.length} questions · {total} marks
          </p>
        </div>
        <div className="scorebox">
          <strong>
            {score}
            <small>/{total}</small>
          </strong>
          <span>
            {answered}/{paper.questions.length} checked
          </span>
        </div>
      </header>
      <div className="qlist">
        {paper.questions.map((q, i) => (
          <UploadQuestionCard
            key={i}
            q={q}
            index={i + 1}
            context={q.ctx !== undefined ? paper.contexts[q.ctx] : undefined}
            onResult={(r) =>
              setResults((prev) => {
                const next = { ...prev };
                if (r === null) delete next[i];
                else next[i] = r;
                return next;
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
