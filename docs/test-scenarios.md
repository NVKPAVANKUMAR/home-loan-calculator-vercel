# Home Loan EMI Calculator Scenarios

### TC-001: Default planner loads with realistic loan values
**Category**: Happy Path
**Priority**: P0
**Preconditions**: The app is loaded in the browser with no prior state saved in local storage or memory.
**Steps**:
1. Open the Home Loan Calculator page.
2. Observe the form fields and summary cards.
**Expected Results**:
- The page renders the calculator with the default values: loan amount ₹2,580,000, rate 7.6%, original tenure 20 years, EMI already paid 20 months, outstanding principal ₹1,954,000, and rate change 0.25%.
- The default mode is "Keep EMI Fixed".
- The calculated current EMI and results cards are visible and populated with numbers formatted as Indian Rupees.
**Business Rule**: The default state is defined in the `App` component in `src/main.tsx`, where `setS(...)` initializes the calculator values and mode to `'emi'`.
**Suggested Layer**: E2E

### TC-002: User computes a standard EMI for a loan without a custom current EMI override
**Category**: Happy Path
**Priority**: P0
**Preconditions**: The page is loaded and all default values are in place.
**Steps**:
1. Leave the current EMI input blank or at its default value `0`.
2. Observe the Current EMI card and the result summary.
**Expected Results**:
- The calculator computes the EMI from the loan amount, annual rate, and original tenure using the amortization formula.
- The displayed Current EMI is a valid INR amount and reflects the standard EMI calculation rather than a blank value.
**Business Rule**: In `src/main.tsx`, `emi()` calculates the EMI as `p * r * (1+r)^n / ((1+r)^n - 1)` where `r = annualRate / 1200` and `p` is principal, `n` is the total number of months.
**Suggested Layer**: Unit

### TC-100: EMI formula uses the monthly-rate mortgage logic for a standard loan
**Category**: Business Rule
**Priority**: P0
**Preconditions**: A loan amount, annual rate, and tenure are entered into the calculator.
**Steps**:
1. Enter a known loan value such as ₹50,00,000.
2. Enter a standard annual interest rate such as 7.5%.
3. Enter a tenure such as 20 years.
4. Compare the displayed EMI with the expected formula-based monthly payment.
**Expected Results**:
- The EMI matches the monthly amortized loan formula using the app’s monthly rate logic.
- The result is not estimated as a fixed flat-rate monthly payment.
**Business Rule**: `src/main.tsx` defines the monthly amortized EMI behavior and the app uses `r = a / 1200`, then `p*r*(1+r)^n / ((1+r)^n - 1)`. This is the current implementation and should be treated as the source of truth for this app.
**Suggested Layer**: Unit

### TC-101: Keep EMI fixed scenario recalculates remaining tenure after a rate increase
**Category**: Business Rule
**Priority**: P0
**Preconditions**: The app is loaded with the default data and the mode is set to "Keep EMI Fixed".
**Steps**:
1. Keep the current EMI value visible and unchanged.
2. Increase the rate change value to a realistic positive amount such as 0.50%.
3. Review the result card that describes the remaining tenure.
**Expected Results**:
- The new interest rate updates to the original rate plus the change value.
- The remaining tenure card changes from the original repayment period to a longer period, because the monthly affordability remains fixed while the rate increases.
- The UI shows either a computed month count or "Not repayable" if repayment is impossible.
**Business Rule**: In `src/main.tsx`, when `s.mode === 'emi'`, the app computes `newTen = months(s.out, nr, cur)`, where `nr` is the revised rate and `cur` is the current EMI. This logic directly determines the new remaining tenure.
**Suggested Layer**: E2E

### TC-102: Keep tenure fixed scenario recalculates the new EMI after a rate change
**Category**: Business Rule
**Priority**: P0
**Preconditions**: The app is loaded and the mode is switched from "Keep EMI Fixed" to "Keep Tenure Fixed".
**Steps**:
1. Click the "Keep Tenure Fixed" strategy button.
2. Increase the rate change to a positive percentage such as 0.25% or 1.0%.
3. Read the result that updates the new EMI.
**Expected Results**:
- The app recalculates the EMI required to repay the remaining balance within the original remaining tenure.
- The displayed EMI increases as the interest rate rises.
- The result card reflects the new EMI in INR with the expected rounding behavior.
**Business Rule**: In `src/main.tsx`, when `s.mode === 'tenure'`, the app computes `newEmi = emi(s.out, nr, rem)` and displays it using `money(newEmi)`, where `rem` is the remaining months left under the current tenure.
**Suggested Layer**: E2E

### TC-300: User enters an impossible repayment condition and sees a clear fallback message
**Category**: Negative
**Priority**: P1
**Preconditions**: The calculator is open with a realistic loan balance and rate-change scenario applied.
**Steps**:
1. Enter a very high interest rate increase that makes the repayment impossible under the fixed-EMI strategy.
2. Keep the mode set to "Keep EMI Fixed" with a fixed EMI that is too low to service the loan at the revised rate.
3. Observe the remaining-tenure result.
**Expected Results**:
- The app reports a repayment condition as "Not repayable" rather than showing a nonsensical number.
- No invalid negative currency values appear in the output.
**Business Rule**: In `src/main.tsx`, `months()` checks `if (e <= p * r) return Infinity;` and the UI renders `Not repayable` when `isFinite(newTen)` is false.
**Suggested Layer**: E2E

### TC-301: User enters a zero-interest scenario and the calculator avoids division-by-zero behavior
**Category**: Negative
**Priority**: P1
**Preconditions**: The calculator page is loaded.
**Steps**:
1. Set the interest rate to `0`.
2. Keep the remaining inputs at valid values.
3. Observe the EMI and remaining-tenure calculations.
**Expected Results**:
- The app does not crash or produce `Infinity`/`NaN` values in the major result cards.
- The EMI is computed as a simple principal-per-month result for zero-rate loans.
**Business Rule**: In `src/main.tsx`, `emi()` checks `if (!r) return p / n`, and `months()` similarly checks `if (!r) return p / e` to avoid divide-by-zero failures.
**Suggested Layer**: Unit

### TC-400: Boundary check for very low outstanding principal and a small rate change
**Category**: Edge Case
**Priority**: P1
**Preconditions**: The app is loaded with valid default values.
**Steps**:
1. Reduce the outstanding principal to a very small balance, such as ₹10,000.
2. Keep the rate change at a moderate value like 0.25%.
3. Observe the recalculated tenure or EMI output.
**Expected Results**:
- The app still produces a valid result and formats it as INR.
- The repayment scenario shows a realistic short payoff period when the loan balance is near zero.
**Business Rule**: The `money()` helper clamps non-positive values to zero before formatting with `Intl.NumberFormat`, so negative or blank values render as ₹0 rather than negative numbers.
**Suggested Layer**: Unit

### TC-500: Reset action restores the default home-loan planner state
**Category**: UI State
**Priority**: P0
**Preconditions**: The user has changed multiple values and switched strategy modes.
**Steps**:
1. Change the loan amount, rate, years, outstanding principal, or rate-change fields.
2. Switch from "Keep EMI Fixed" to "Keep Tenure Fixed".
3. Click the reset button.
**Expected Results**:
- The form fields return to the original default loan configuration.
- The strategy switches back to the default "Keep EMI Fixed" mode.
- The summary cards refresh to the original planner values.
**Business Rule**: The reset handler in `src/main.tsx` calls `setS(...)` with the original initial state object for loan, rate, years, EMI, paid months, outstanding principal, change, and mode.
**Suggested Layer**: E2E

### TC-501: Calculator footer and result messaging communicate the planning-estimate nature of the tool
**Category**: UI State
**Priority**: P2
**Preconditions**: The app is loaded and the user is viewing the results section.
**Steps**:
1. Scroll to the bottom of the page and confirm the footer text.
2. Observe the callout text under the result cards.
**Expected Results**:
- The footer states: "Planning estimate only. Verify final figures with your lender."
- The callout explains whether the user is keeping EMI fixed or keeping tenure fixed.
**Business Rule**: The application includes a footer and dynamic callout text in `src/main.tsx` to communicate that the outputs are estimates and to explain the selected strategy.
**Suggested Layer**: Component
