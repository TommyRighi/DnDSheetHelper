# Repository Guidelines

## Project structure and module organization

Fable is an Italian-language D&D companion built with React 19 and Vite. It runs in the browser without a backend.

- `src/main.jsx` contains the application entry point and main UI. Other `.jsx` files provide character sheets, campaign sessions, and DM tools.
- `src/` also holds domain logic such as `dice.js`, `storage.js`, `session.js`, and `dm.js`, alongside CSS and unit tests.
- `src/rules/` contains edition catalogs, character creation, validation, and rule calculations.
- `assets/` stores static assets; `docs/` contains design studies and scope decisions.
- `index.html` and `vite.config.js` configure startup and builds. Generated output goes to ignored `dist/`.

## Build, test, and development commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start Vite, normally at `http://localhost:5173`, listening on all interfaces.
- `npm test`: run the Node.js tests matched by `src/*.test.js`.
- `npm run build`: produce the static application in `dist/`.
- `npm run preview`: serve the production build locally.

Vite uses relative asset paths. Preserve this behavior for potential desktop packaging.

## Coding style and naming conventions

Use JavaScript ES modules and React function components. Name components in PascalCase, helpers and variables in camelCase, and domain modules with lowercase filenames. Keep user-facing copy in Italian.

Follow the surrounding file's formatting; the repository has mixed styles. Prefer two-space indentation in new modules. No formatter or lint script is configured. Keep calculations and validation separate from rendering where practical.

## Testing guidelines

Tests use `node:test` and `node:assert/strict`. Name files `src/<domain>.test.js` and describe behavior in test names. The current test command does not discover nested tests. No coverage threshold is configured.

Add regression tests for changed calculations, persistence validation, URL handling, and encounter transitions. For UI changes, check mobile layouts, relevant interactions, and print output when affected. Run tests and a production build before submitting code changes.

## Commit and pull request guidelines

Git history currently contains only `Initial commit`, so no established message convention exists. Use concise, imperative summaries. In pull requests, explain the behavior change, link relevant issues or design documents, and report validation results. Include screenshots for visual changes.

## Configuration and local environment

Treat imported JSON and stored browser data as untrusted input. Preserve save compatibility and avoid committing private campaign links or character exports. If containers are needed, use the Docker-compatible CLI with OrbStack, the local container runtime.
