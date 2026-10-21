import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, NavLink, Link, Route, Routes, useLocation } from 'react-router-dom';
import { useTheme } from './lib/progress';
import Home from './pages/Home';
import Papers from './pages/Papers';
import PaperPage from './pages/PaperPage';
import Weeks from './pages/Weeks';
import WeekPage from './pages/WeekPage';
import Saved from './pages/Saved';

// The upload pages pull in pdf.js, so they load only when visited.
const Upload = lazy(() => import('./pages/Upload'));
const UploadPaperPage = lazy(() => import('./pages/UploadPaperPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollTo, which React would treat as a cleanup.
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  const [theme, setTheme] = useTheme();
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">σ</span>
            <span>
              Stats&nbsp;1 <em>PYQ</em>
            </span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/weeks">Weeks</NavLink>
            <NavLink to="/papers">Papers</NavLink>
            <NavLink to="/saved">Saved</NavLink>
            <NavLink to="/upload">Upload</NavLink>
          </nav>
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
              </svg>
            )}
          </button>
        </div>
      </header>
      <main className="main">
        <Suspense fallback={<div className="page" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/weeks" element={<Weeks />} />
            <Route path="/week/:n" element={<WeekPage />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/paper/:id" element={<PaperPage />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/upload/:id" element={<UploadPaperPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-foot">
        <p>
          Previous-year questions from the IIT Madras BS Statistics for Data Science I (BSMA1002) exams, organised for
          practice. Not an official IITM resource.
        </p>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Shell />
    </HashRouter>
  );
}
