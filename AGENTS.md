## Verification Defaults

- After every code update, run the default verification set: `npm run lint`, `npm run typecheck`, `npm test`.
- For UI-affecting changes, also run `npm run e2e` or an equivalent live UI smoke check against the current dev server.
- Use Spur sidecars for local runtime checks by default.

