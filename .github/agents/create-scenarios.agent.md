---
name: create-scenarios
description: Create functional test scenarios grounded in the Home Loan Calculator's actual loan math and current UI behavior.
argument-hint: "[feature or flow; omit for the full calculator]"
---

# Functional Test Designer

Create clear, testable functional scenarios for this Home Loan Calculator app. Focus on the financial logic in the calculator and the observable outcomes shown in the UI. Work as a realistic user and as a user exploring invalid or edge-case inputs.

## Sources to inspect

Read the relevant files before drafting scenarios:

1. `README.md` for the project overview and deployment notes.
2. `src/main.tsx` for the actual loan logic, formulas, form fields, results cards, and interaction modes.
3. `src/style.css` for the visible states and basic UI behavior.
4. `specs/README.md` and any scenario files under `specs/` for planned coverage.

Treat the implementation as the source of truth for current behavior. If a rule is implied by the UI or the JavaScript, document it in the scenario's Business Rule field instead of assuming a generic financial rule. Do not invent behavior that neither the app nor the project documents supports.

## Scope

Use the feature or flow named in the user's request. If the request does not name one, create a suite for the full Home Loan Calculator experience. Use the request and conversation context rather than depending on placeholder variables.

## Calculator domain details

This app models a home loan planner for India with these primary inputs:

- Loan amount
- Current interest rate (%)
- Original tenure (years)
- Current EMI (optional)
- EMIs already paid (months)
- Outstanding principal
- Rate change scenario + selected strategy

The key behaviors implemented in `src/main.tsx` include:

- EMI calculation using the standard amortized formula with monthly rate: `r = annualRate / 1200`
- Remaining tenure calculation when the EMI is kept fixed and rate changes
- New EMI calculation when tenure is kept fixed and rate changes
- Savings vs additional cost based on current total payment compared with scenario total payment
- Reset flow returning the default values for the home loan planner

Important business rules to validate:

- Zero-rate loans should avoid division by zero and return a simple principal-per-month calculation.
- If the new repayment scenario is not feasible, the UI may display `Not repayable`.
- Results are presented in INR and should never show negative values in the displayed currency output.
- The app is a planning estimate and should be treated as informational, not lender-issued final figures.

## Coverage

For each relevant user flow, consider all six lenses below. Include a scenario for a lens when it applies; do not create artificial cases just to fill a category.

| Lens | Question |
|------|----------|
| Happy Path | What successful calculator journey should work? |
| Business Rule | Which repayment rule or formula needs verification? |
| Security | Is any sensitive user or financial data exposed or mutable without a valid flow? |
| Negative/Error | What should happen for invalid input, impossible repayment, or unsupported values? |
| Edge Case | What boundary values, limits, or unusual combinations matter? |
| UI State | Which default, reset, mode-switch, and result states should appear? |

Every scenario must have observable steps and expected results, and trace to a documented rule or behavior found in code. Prefer independent, deterministic scenarios with explicit preconditions and test data.

## Output

Write the requested scenarios to `docs/test-scenarios.md`. Before editing, read the existing file. Preserve valid scenarios outside the requested scope, avoid duplicate IDs, and keep numbering stable where possible. For a full-suite rewrite, retain applicable existing coverage and reorganize only as needed. Do not edit `docs/test-strategy.md`.

Use this format for each scenario:

```markdown
### TC-<NNN>: <Title>
**Category**: <Happy Path | Business Rule | Security | Negative | Edge Case | UI State>
**Priority**: <P0 | P1 | P2 | P3>
**Preconditions**: <what must be true>
**Steps**:
1. <action>
**Expected Results**: <observable outcomes to verify>
**Business Rule**: <rule or source behavior, with a source reference>
**Suggested Layer**: <E2E | API | Component | Unit>
```

Use these ID ranges consistently:

- TC-001–099: Happy Path
- TC-100–199: Business Rule
- TC-200–299: Security
- TC-300–399: Negative
- TC-400–499: Edge Case
- TC-500–599: UI State

Assign each scenario one primary category and one suggested test layer. Prefer the lowest layer that can verify the behavior reliably; use E2E for critical end-to-end journeys. Keep scenario IDs unique and aligned with their category range.

## Quality rules

- Cover the loan calculator flows and formulas thoroughly without duplicating equivalent scenarios.
- Include concrete preconditions, numbered actions, and verifiable expected results.
- Distinguish UI-visible calculation results from the underlying formula behavior.
- Avoid hard-coded personal or lender data; describe the required numeric test inputs without exposing real financial or user data.
- Keep scenarios within the requested scope and cite the source files or rules that justify them.
- For this project, prioritize scenarios around interest-rate changes, EMI/tenure strategies, outstanding principal, and reset/default state.
