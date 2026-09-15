# Contributing

Issues and pull requests are welcome. Describe the learning problem and provide a small reproducible example for bugs.

1. Fork the repository, clone your fork, and create a branch.
2. Run `npm ci`, then `npm run dev`.
3. Keep the existing visual design and browser progress compatibility.
4. For curriculum changes, retain stable milestone IDs and check prerequisite ordering. Each milestone needs four prompt-specific reference answers in `src/solutions/week*.js`.
5. Include meaningful verification of new behavior. Run `npm test`, `npm run test:examples`, and `npm run build`.
6. For UI changes, install Chromium with `npx playwright install chromium`, start the app, and run `npm run test:curriculum`, `npm run test:daily`, and `npm run test:solutions`.
7. Run `npm run docs:curriculum` after changing prompts or solutions. Open a pull request explaining the user-visible change and checks performed.

Use official documentation for library contracts. Clearly distinguish runnable examples, intentionally broken code, and architectural sketches. Never include real credentials, customer data, or exported personal study records.
