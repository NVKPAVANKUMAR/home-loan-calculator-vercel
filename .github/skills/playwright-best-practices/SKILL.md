---
name: playwright-best-practices
description: Playwright E2E standards for the Home Loan Calculator, including reliable locators, assertions, and interaction patterns
---

# Playwright Test Automation Best Practices for Home Loan Calculator

## Overview
This document defines the testing standards, patterns, and best practices for writing Playwright E2E tests in this calculator project. All test automation agents and reviewers should follow these guidelines.

---

## 1. Project Test Setup

### Config Reference
- **Test directory**: `./tests` or root-level spec files
- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Timeout**: 30s per test, 5s per assertion
- **Browser**: Chromium only (Desktop Chrome)
- **Parallel execution**: Disabled unless intentionally configured
- **Reporter**: Line or HTML
- **Screenshots**: Only on failure
- **Video**: Retain on failure when useful

### File Naming Convention
- Test files: `tests/<feature-name>.spec.ts`
- Use descriptive names such as `home-loan-calculator.spec.ts`, `rate-change-scenario.spec.ts`
- Group related tests in the same file using `test.describe()`

---

## 2. Locator Strategy (Priority Order)

Always choose locators in this priority order for reliability and readability:

### Priority 1: Accessibility roles and labels
```javascript
page.getByRole('button', { name: /reset/i })
page.getByLabel('Loan Amount')
page.getByLabel('Current Interest Rate')
```
Use for: Inputs and buttons with visible labels.

### Priority 2: Placeholder or visible text
```javascript
page.getByText('Keep EMI Fixed')
page.getByText('Results')
```
Use for: Buttons and summary blocks with visible text.

### Priority 3: CSS classes (last resort)
```javascript
page.locator('.primary')
page.locator('.card')
```
Use for: generic wrapper elements when no clear semantic locator exists.

### NEVER Use
- XPath selectors unless there is no workable alternative
- Overly brittle CSS chains
- Index-based selectors without filtering

---

## 3. Filtering and Scoping Patterns

### Filter by label or visible text
```javascript
const loanField = page.getByLabel('Loan Amount');
const modeButton = page.getByRole('button', { name: /keep tenure fixed/i });
```

### Scope actions to a section
```javascript
const results = page.locator('.results');
await expect(results).toContainText('Current EMI');
```

---

## 4. Assertion Patterns

### Visibility Checks
```javascript
await expect(page.getByText('Results')).toBeVisible();
await expect(page.getByText('Not repayable')).toBeVisible();
```

### Value Checks
```javascript
await expect(page.getByLabel('Loan Amount')).toHaveValue('25800000');
await expect(page.getByText('₹2,580,000')).toBeVisible();
```

### Formula / Result Checks
```javascript
await expect(page.getByText(/₹/)).toBeVisible();
await expect(page.getByText(/not repayable/i)).toBeVisible();
```

### Numeric Assertions
```javascript
const currentEmiText = await page.locator('.card').first().textContent();
expect(currentEmiText).toContain('₹');
```

---

## 5. Test Structure Patterns

### Standard Test Structure
```javascript
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test('shows the default calculator setup', async ({ page }) => {
  await page.goto(BASE_URL);

  await expect(page.getByLabel('Loan Amount')).toHaveValue('25800000');
  await expect(page.getByLabel('Current Interest Rate')).toHaveValue('7.6');
  await expect(page.getByText('Results')).toBeVisible();
});
```

### Multi-Step Test with Comments
```javascript
test('switch strategy and verify the updated tenure or EMI', async ({ page }) => {
  // -- Step 1: Load calculator --
  await page.goto(BASE_URL);

  // -- Step 2: Switch to fixed tenure --
  await page.getByRole('button', { name: /keep tenure fixed/i }).click();

  // -- Step 3: Validate the result --
  await expect(page.getByText(/new emi/i)).toBeVisible();
});
```

### Page Object Model (POM)
For larger suites, create page objects for sections such as a loan form and the results section, but keep the business assertions in the test file.

---

## 6. Calculator-Specific Rules
- Always validate the visible result after changing rate or strategy
- Verify both user-visible output and underlying formula behavior where relevant
- Cover zero-interest and impossible-repayment states explicitly
- Prefer assertions against labels and text instead of implementation details like internal state
- Keep tests deterministic by using explicit numeric values rather than hidden app state

---

## 7. Debugging Tips

### Console Logging in Tests
```javascript
console.log('Loan amount before:', await page.getByLabel('Loan Amount').inputValue());
```

### Run Single Test
```bash
npx playwright test tests/home-loan-calculator.spec.ts --reporter=line
```

### Run with UI Mode
```bash
npx playwright test --ui
```

### View HTML Report
```bash
npx playwright show-report
```

---

## 8. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do Instead |
|-------------|-------------|-----------|
| `page.waitForTimeout(N)` | Flaky, wastes time | Use `expect().toBeVisible()` |
| Fragile CSS selectors | Breaks on styling or refactors | Use labels and visible text |
| Hardcoded states without validation | Makes the test meaningless | Assert actual UI output |
| `test.only()` left in code | Skips other tests in CI | Remove before commit |
| No assertions after action | Test passes but proves nothing | Always assert outcomes |
| Shared state between tests | Order-dependent failures | Each test self-contained |
| Testing implementation details | Breaks on refactor | Test user-visible behavior |
