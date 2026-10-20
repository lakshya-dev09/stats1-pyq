# Stats 1 PYQ Practice

Practice IIT Madras BS **Statistics for Data Science I (BSMA1002)** previous-year questions:

- **By week:** each of the 12 weeks opens with a short intro, key ideas, a formula sheet and exam tips, then lists every PYQ on that topic, newest term first (Sep → May → Jan, by year).
- **By paper:** attempt a full Quiz 1, Quiz 2 or End Term paper from a specific term.
- Instant checking for MCQ, MSQ and numerical answers (ranges supported), bookmarks, a "got wrong" list, per-week progress, and light/dark themes. Progress is stored in the browser only.

Built with Vite, React, TypeScript and KaTeX. It's a static site, so it deploys anywhere.

## Run locally

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # validates data, type-checks, builds to dist/
```

## Deploy

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(one-time setup: repo **Settings → Pages → Source: GitHub Actions**).
The build uses a relative base path, so `dist/` also works on Netlify, Vercel or any static host.

## Adding a paper

1. Create `src/data/papers/<year>-<mm>-<q1|q2|et>.json` (e.g. `2025-05-q1.json`). It's picked up automatically.
2. Put any figures in `public/figs/` and reference them by filename.
3. Run `npm run validate`. It checks structure, answer keys, figure files and every LaTeX formula.

```jsonc
{
  "id": "2025-05-q1", "year": 2025, "term": "May", "exam": "Quiz 1",   // term: Jan | May | Sep
  "source": "https://drive.google.com/...",                              // optional link to the original PDF
  "questions": [
    {
      "n": 3, "type": "MCQ", "marks": 2, "week": 4,                       // type: MCQ | MSQ | NAT
      "context": "Shared text for comprehension questions (optional)",
      "figure": "2025-05-q1-scatter.png",                                 // optional
      "q": "Markdown text with $inline$ / $$display$$ LaTeX, - lists and | tables |",
      "options": ["A", "B", "C", "D"], "correct": [1],                    // MCQ/MSQ, 0-based
      "answer": 0.42,                                                     // NAT: number or { "min": 0.4, "max": 0.44 }
      "note": "Optional remark shown with the answer"
    }
  ]
}
```

## Coverage

| Term | Quiz 1 | Quiz 2 | End Term |
|---|---|---|---|
| May 2026 | ✓ | ✓ | ✓ |
| Jan 2026 | ✓ | ✓ | ✓ |
| Sep 2025 | | ✓ | ✓ |

Older terms are being added from the combined question-paper PDFs.

*Not an official IIT Madras resource. Answer keys are taken from the source papers; a few that look questionable carry a note.*
