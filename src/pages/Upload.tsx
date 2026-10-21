import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { extractSubject, openPdf, scanPdf, type Scan, type Subject } from '../lib/pdfSplit';
import { deleteUpload, listUploads, saveUpload, type UploadPaper } from '../lib/uploads';

type Stage =
  | { kind: 'idle' }
  | { kind: 'reading'; page: number; total: number }
  | { kind: 'pick'; scan: Scan }
  | { kind: 'splitting'; subject: Subject; done: number; total: number }
  | { kind: 'error'; message: string };

export default function Upload() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [fileName, setFileName] = useState('');
  const [drag, setDrag] = useState(false);
  const [saved, setSaved] = useState<UploadPaper[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listUploads().then(setSaved);
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setStage({ kind: 'error', message: 'That file is not a PDF.' });
      return;
    }
    setFileName(file.name.replace(/\.pdf$/i, ''));
    setStage({ kind: 'reading', page: 0, total: 0 });
    try {
      const doc = await openPdf(await file.arrayBuffer());
      const scan = await scanPdf(doc, (page, total) => setStage({ kind: 'reading', page, total }));
      if (scan.subjects.length === 0) {
        setStage({
          kind: 'error',
          message:
            'No questions were found in this PDF. Upload works with the official IITM question-paper PDFs, the ones where each question starts with “Question Number : … Question Type : …”.',
        });
        return;
      }
      if (scan.subjects.length === 1) split(scan, scan.subjects[0]);
      else setStage({ kind: 'pick', scan });
    } catch {
      setStage({
        kind: 'error',
        message: 'This PDF could not be read. It may be damaged or password-protected.',
      });
    }
  }

  async function split(scan: Scan, subject: Subject) {
    setStage({ kind: 'splitting', subject, done: 0, total: subject.count });
    try {
      const { contexts, questions } = await extractSubject(scan, subject, (done, total) =>
        setStage({ kind: 'splitting', subject, done, total }),
      );
      if (questions.length === 0) {
        setStage({
          kind: 'error',
          message: `No questions could be cut out of “${subject.label}”.`,
        });
        return;
      }
      const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now());
      await saveUpload({
        id,
        name: fileName || 'Uploaded paper',
        subject: subject.label,
        created: Date.now(),
        contexts,
        questions,
      });
      navigate(`/upload/${id}`);
    } catch {
      setStage({
        kind: 'error',
        message: 'Something went wrong while splitting this paper.',
      });
    }
  }

  async function remove(id: string) {
    await deleteUpload(id);
    setSaved(await listUploads());
  }

  const busy = stage.kind === 'reading' || stage.kind === 'splitting';

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Your own papers</p>
        <h1>Upload a question paper</h1>
        <p className="lede">
          Drop in an IITM question-paper PDF. It is split by subject, then into separate questions you can practise with
          instant checking. Everything happens in your browser; the file is never uploaded anywhere.
        </p>
      </header>

      {stage.kind !== 'pick' && (
        <div
          className={`dropzone ${drag ? 'over' : ''} ${busy ? 'busy' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!busy) handleFile(e.dataTransfer.files[0]);
          }}
        >
          {busy ? (
            <div className="drop-progress">
              <strong>
                {stage.kind === 'reading'
                  ? stage.total
                    ? `Reading page ${stage.page} of ${stage.total}`
                    : 'Opening PDF…'
                  : `Splitting ${stage.subject.label}: question ${stage.done} of ${stage.total}`}
              </strong>
              <div className="progress">
                <span
                  style={{
                    width: `${
                      stage.kind === 'reading'
                        ? stage.total
                          ? (stage.page / stage.total) * 100
                          : 2
                        : stage.total
                          ? (stage.done / stage.total) * 100
                          : 2
                    }%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <span className="drop-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="26" height="26">
                  <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
                </svg>
              </span>
              <strong>Drop a PDF here</strong>
              <span className="muted">or</span>
              <button className="btn btn-primary" onClick={() => input.current?.click()}>
                Choose file
              </button>
              <input
                ref={input}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </>
          )}
        </div>
      )}

      {stage.kind === 'error' && (
        <p className="notice bad" role="alert">
          {stage.message}
        </p>
      )}

      {stage.kind === 'pick' && (
        <section className="section">
          <div className="section-head">
            <h2>Subjects in “{fileName}”</h2>
            <button className="btn btn-ghost" onClick={() => setStage({ kind: 'idle' })}>
              Choose another file
            </button>
          </div>
          <p className="muted">
            This paper has {stage.scan.subjects.length} subjects. Pick one to split into questions.
          </p>
          <div className="subject-grid">
            {[...stage.scan.subjects]
              .sort((a, b) => Number(b.isStats1) - Number(a.isStats1))
              .map((s) => (
                <button
                  key={s.from}
                  className={`subject-card ${s.isStats1 ? 'featured' : ''}`}
                  onClick={() => split(stage.scan, s)}
                >
                  {s.isStats1 && <span className="tag tag-ok">Stats 1</span>}
                  <strong>{s.label}</strong>
                  <span className="muted">
                    {s.level ? `${s.level} · ` : ''}
                    {s.count} questions ·{' '}
                    {s.firstPage === s.lastPage ? `page ${s.firstPage}` : `pages ${s.firstPage}–${s.lastPage}`}
                  </span>
                </button>
              ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Your uploaded papers</h2>
        </div>
        {saved.length === 0 ? (
          <p className="muted">Nothing yet. Papers you split are kept in this browser so you can come back to them.</p>
        ) : (
          <ul className="upload-list">
            {saved.map((p) => (
              <li key={p.id} className="upload-row">
                <Link to={`/upload/${p.id}`} className="upload-main">
                  <strong>{p.subject}</strong>
                  <span className="muted">
                    {p.name} · {p.questions.length} questions · {new Date(p.created).toLocaleDateString()}
                  </span>
                </Link>
                <button className="btn btn-ghost" onClick={() => remove(p.id)} aria-label={`Delete ${p.name}`}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
