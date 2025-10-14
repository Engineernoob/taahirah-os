# Repository Guidelines

## Project Structure & Module Organization
- `index.html` powers the desktop shell, while `about-me.html`, `projects.html`, `case-ai-lab.html`, `skills-radar.html`, `contact.html`, `resume.html`, `boot.html`, and `shutdown.html` render individual windows.
- `script.js` houses window manager interactions; keep feature-specific logic grouped under clear section comments.
- `style.css` defines the global Windows 98 look; extend color tokens under `:root` before adding new palettes.
- Static assets live in `icons/`, `fonts/`, and `sounds/`; the standalone `pinball/` directory contains the arcade mini-app (`pinball.html`, CSS, JS, test harness).

## Build, Test & Development Commands
- `npm install` — fetches the pinned UI dependencies (`98.css`, `os-gui`) for local reference.
- `npm run build` — emits a deploy-ready `dist/` folder with minified CSS/JS and bundled static assets.
- `npx http-server .` (or `python3 -m http.server 8080`) — serves the site with proper audio/media loading; open `http://localhost:8080/index.html`.
- `open index.html` — quick smoke test when a server is unnecessary, e.g., verifying copy updates.

## Coding Style & Naming Conventions
- Use 2-space indentation, double quotes in JS, and kebab-case filenames (`resume.html`, `pinball-test.html`) to match existing assets.
- Prefer semantic HTML elements inside app windows and keep class names descriptive (`taskbar-item`, `window-body`).
- Document any intricate CSS or JS blocks with concise top-level comments, mirroring the structured headers already in `script.js`.

## Testing Guidelines
- Run a manual UI pass on `index.html`: boot sequence, window drag/resizing, Start menu, case study, skills radar, and audio cues.
- Visit `pinball/pinball-test.html` to validate the standalone game before embedding changes in the desktop.
- Check Chrome and Firefox at 1280px and 1920px widths; flag layout regressions or scrollbars in PRs.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat(ui): add new project card`) as seen in `git log`; group unrelated fixes separately.
- Reference the touched window or asset in the body, and list manual verification steps (browser + server command) to aid reviewers.
- PRs should include: concise summary, linked issue (if any), screenshot/GIF for UI updates, and mention of any asset additions (fonts/sounds).

## Static Hosting & Asset Tips
- Keep relative paths intact for GitHub Pages; test `index.html` from the project root after moving assets.
- Optimize new icons/audio before committing; place webfonts in `fonts/` and update `@font-face` blocks accordingly.
- When introducing new windows, add matching `.html`, Start menu entry, and icons to ensure desktop parity.
