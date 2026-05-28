## Bugs & Warnings (found 2026-05-28 manual exploration)

### BUG-1 — New dashboard post-create route stuck on "Loading dashboard..."
After creating a dashboard the shell navigates to `#/dashboard/new/<slug>` (isNew: true).
That route renders "Loading dashboard..." indefinitely. The dashboard IS saved — navigating
directly to `#/dashboard/<slug>` loads it fine.
Fix: in `_onDashboardCreate()` navigate without isNew after save:
  `this._navigate({ view: 'editor', slug: dashboard.id })` (drop isNew: true)
File: `src/app/shell/app-shell.ts`

### BUG-2 — User-created questions show "Question not found" on detail view
`LocalStorageQuestionRepository.get(id)` does `find(q => q.id === id)` but user-created
questions have a UUID id and a separate slug. Routing passes the slug, so the lookup returns
null. The datasource repository already has the fix pattern: `q.id === id || q.slug === id`.
Fix: apply that same guard to the question repository get() and add UT-001/UT-002 tests.
Files: `src/adapters/client/local-storage/local-storage-question-repository.ts` + `.spec.ts`

### WARN-1 — Lit "change-in-update" scheduling on four components
Four components fire the Lit dev-mode warning "Element X scheduled an update after an update
completed": widget-editor, datasource-editor, question-editor, datasource-picker.
Each sets a reactive property inside updated() (or a method called from it), causing a
redundant second render. Fix with willUpdate() guards or change-only setters.
Note: task 011 already covers question-picker; these four remain open.
Files: widget.ts, datasource-editor.ts, question-editor.ts, question-picker.ts

---

- Replace hardcoded string blacklists with algorithmic/ML-based approaches. The modules have too many brittle heuristics
- Analytics Engineer Agent: Acts as an AI assistant that can create calculated fields, build visualizations, and answer analytical questions.
- Data Storytelling & Summaries: Automatically generates narratives that describe key patterns, outliers, and trends.
- Semantic Modeling Support: AI assists in mapping data and creating consistent definitions (e.g., defining "Profit" vs. "Revenue").
- Context Retention: The Agent remembers previous questions to support follow-up questions, similar to chat interfaces.
- Transforms complex datasets into clear, narrative insights by automatically generating written explanations of your data
- https://arxiv.org/pdf/2212.10915
- Natural language interface to database (NLIDB)
- Natural Language-to-SQL (NL2SQL)
- https://github.com/hkustdial/nl2sql_handbook
- https://promethium.ai/guides/text-to-sql-basics-benefits/

- dev containers

Browser SPA
├─ window error / unhandledrejection
├─ Web Vitals / performance
├─ route changes
├─ custom element lifecycle markers where useful
├─ user interaction events
└─ frontend logs / breadcrumbs
↓
Grafana Faro Web SDK
↓
Grafana Alloy / Faro receiver / collector
↓
Loki + Tempo + Prometheus/Mimir
↓
Grafana dashboards + alerts
