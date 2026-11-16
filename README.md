# security-compliance

Enterprise cybersecurity vulnerability and compliance management platform.

## Component 1: Asset Management

Asset inventory with overview metrics, search/filter/sort, create/view/edit/delete, derived risk score, and CSV export.

- **Stack:** dependency-free static web app (ES modules, no build step) and Node's built-in test runner. Requires Node ≥ 20.
- **Persistence (demo mode):** there is no backend yet. Assets are fictional seed data kept in the browser's `localStorage` (`sc.assets.v1`); the UI states this. `src/assets/store.js` is the only persistence seam, so a real API can replace it.
- **Risk score (0–100):** criticality weight × environment exposure (Production 1.0 … Development 0.4); Decommissioned = 0.

```
npm start    # http://localhost:5173 (PORT to override)
npm test     # unit tests for model + store
```

Layout: `src/assets/model.js` (validation, risk, query, metrics, CSV), `store.js`, `seed.js`; `src/main.js` (UI); `test/`.
