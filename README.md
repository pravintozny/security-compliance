# security-compliance

Enterprise vulnerability & compliance management platform.

## Scan Management (demo)

Dependency-free browser component for managing security scans: create/edit/delete, filter/search/sort, lifecycle
(start, cancel, record results, re-queue), summary metrics and CSV export.

- `npm start` then open <http://localhost:5173/src/scans/index.html>
- `npm test` (Node >= 20, built-in test runner)

Demo mode: no backend or scanner is connected. Data is fictional and kept in browser localStorage; starting a scan only
records state and results are entered manually. `src/scans/store.js` is the seam for a real API client.
