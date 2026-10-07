# Home Loan Calculator
React + TypeScript + Vite calculator based on the supplied Excel model.

## Local
npm install
npm run dev

## Tests
npx playwright test

The Playwright suite starts the Vite development server automatically and runs the calculator scenarios in Chromium. Install the browser once with `npx playwright install chromium` if it is not already available.

The run prints line progress and writes an HTML report to `playwright-report`. Open it with `npx playwright show-report`.

## Production
npm run build
npm run preview

## Vercel
Push to GitHub, import the repo into Vercel, and use `npm run build` with output `dist`.
