import { expect, test, type Page } from '@playwright/test';

const defaults = {
  loan: 25_800_000,
  rate: 7.6,
  years: 20,
  paid: 20,
  outstanding: 1_954_000,
  rateChange: 0.25,
};

function calculateEmi(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 1200;
  return monthlyRate
    ? (principal * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1)
    : principal / months;
}

function calculateMonths(principal: number, annualRate: number, payment: number) {
  const monthlyRate = annualRate / 1200;
  if (!monthlyRate) return principal / payment;
  if (payment <= principal * monthlyRate) return Infinity;
  return Math.log(payment / (payment - principal * monthlyRate)) / Math.log(1 + monthlyRate);
}

function formatInr(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, amount || 0));
}

function input(page: Page, label: string) {
  return page.getByText(label, { exact: true }).locator('..').locator('input');
}

function resultCard(page: Page, title: string) {
  return page.locator('.card').filter({ has: page.getByText(title, { exact: true }) });
}

test.describe('Home Loan Calculator scenarios', () => {
  test('TC-001: loads the default planner values and populated results', async ({ page }) => {
    await page.goto('/');

    await expect(input(page, 'Loan Amount')).toHaveValue(String(defaults.loan));
    await expect(input(page, 'Current Interest Rate')).toHaveValue(String(defaults.rate));
    await expect(input(page, 'Original Tenure')).toHaveValue(String(defaults.years));
    await expect(input(page, 'EMIs Already Paid')).toHaveValue(String(defaults.paid));
    await expect(input(page, 'Outstanding Principal')).toHaveValue(String(defaults.outstanding));
    await expect(input(page, 'Interest Rate Change')).toHaveValue(String(defaults.rateChange));
    await expect(page.getByRole('button', { name: /keep emi fixed/i })).toHaveClass(/active/);
    await expect(resultCard(page, 'Current EMI').locator('strong')).toHaveText(
      formatInr(calculateEmi(defaults.loan, defaults.rate, defaults.years * 12)),
    );
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  });

  test('TC-002: calculates the standard EMI when no custom EMI is set', async ({ page }) => {
    await page.goto('/');

    await expect(input(page, 'Current EMI (optional)')).toHaveValue('');
    await expect(resultCard(page, 'Current EMI').locator('strong')).toHaveText(
      formatInr(calculateEmi(defaults.loan, defaults.rate, defaults.years * 12)),
    );
  });

  test('TC-100: uses the amortized monthly-rate formula for a standard loan', async ({ page }) => {
    await page.goto('/');
    await input(page, 'Loan Amount').fill('5000000');
    await input(page, 'Current Interest Rate').fill('7.5');
    await input(page, 'Original Tenure').fill('20');

    await expect(resultCard(page, 'Current EMI').locator('strong')).toHaveText(
      formatInr(calculateEmi(5_000_000, 7.5, 240)),
    );
  });

  test('TC-101: keeps EMI fixed and increases the payoff period after a rate rise', async ({ page }) => {
    await page.goto('/');
    const currentEmi = calculateEmi(defaults.loan, defaults.rate, defaults.years * 12);
    const initialMonths = calculateMonths(defaults.outstanding, defaults.rate + defaults.rateChange, currentEmi);

    await input(page, 'Interest Rate Change').fill('0.50');

    const updatedMonths = calculateMonths(defaults.outstanding, defaults.rate + 0.5, currentEmi);
    const expectedTenure = `${(updatedMonths / 12).toFixed(1)} years (${Math.ceil(updatedMonths)} months)`;
    await expect(resultCard(page, 'New Interest Rate').locator('strong')).toHaveText('8.10%');
    await expect(resultCard(page, 'New Remaining Tenure').locator('strong')).toHaveText(expectedTenure);
    expect(updatedMonths).toBeGreaterThan(initialMonths);
  });

  test('TC-102: keeps tenure fixed and recalculates EMI after a rate rise', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /keep tenure fixed/i }).click();
    await input(page, 'Interest Rate Change').fill('0.25');

    const remainingMonths = defaults.years * 12 - defaults.paid;
    const expectedEmi = calculateEmi(defaults.outstanding, defaults.rate + 0.25, remainingMonths);
    await expect(resultCard(page, 'New EMI').locator('strong')).toHaveText(formatInr(expectedEmi));
  });

  test('TC-300: reports a loan as not repayable when EMI cannot cover revised interest', async ({ page }) => {
    await page.goto('/');
    await input(page, 'Interest Rate Change').fill('1000');

    await expect(resultCard(page, 'New Remaining Tenure').locator('strong')).toHaveText('Not repayable');
    await expect(page.locator('.results')).not.toContainText(/NaN|-₹/);
  });

  test('TC-301: handles a zero-interest current loan without invalid values', async ({ page }) => {
    await page.goto('/');
    await input(page, 'Current Interest Rate').fill('0');

    await expect(resultCard(page, 'Current EMI').locator('strong')).toHaveText(
      formatInr(defaults.loan / (defaults.years * 12)),
    );
    await expect(page.locator('.results')).not.toContainText(/NaN|Infinity/);
  });

  test('TC-400: calculates a short payoff period for a small outstanding balance', async ({ page }) => {
    await page.goto('/');
    await input(page, 'Outstanding Principal').fill('10000');

    const currentEmi = calculateEmi(defaults.loan, defaults.rate, defaults.years * 12);
    const remainingMonths = calculateMonths(10_000, defaults.rate + defaults.rateChange, currentEmi);
    const expectedTenure = `${(remainingMonths / 12).toFixed(1)} years (${Math.ceil(remainingMonths)} months)`;
    await expect(resultCard(page, 'New Remaining Tenure').locator('strong')).toHaveText(expectedTenure);
    await expect(resultCard(page, 'New Remaining Tenure').locator('strong')).not.toContainText(/NaN|Infinity/);
  });

  test('TC-500: reset restores all default values and the default strategy', async ({ page }) => {
    await page.goto('/');
    await input(page, 'Loan Amount').fill('5000000');
    await input(page, 'Current Interest Rate').fill('9');
    await input(page, 'Original Tenure').fill('15');
    await input(page, 'Current EMI (optional)').fill('50000');
    await input(page, 'EMIs Already Paid').fill('30');
    await input(page, 'Outstanding Principal').fill('1000000');
    await input(page, 'Interest Rate Change').fill('1');
    await page.getByRole('button', { name: /keep tenure fixed/i }).click();
    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(input(page, 'Loan Amount')).toHaveValue(String(defaults.loan));
    await expect(input(page, 'Current Interest Rate')).toHaveValue(String(defaults.rate));
    await expect(input(page, 'Original Tenure')).toHaveValue(String(defaults.years));
    await expect(input(page, 'Current EMI (optional)')).toHaveValue('');
    await expect(input(page, 'EMIs Already Paid')).toHaveValue(String(defaults.paid));
    await expect(input(page, 'Outstanding Principal')).toHaveValue(String(defaults.outstanding));
    await expect(input(page, 'Interest Rate Change')).toHaveValue(String(defaults.rateChange));
    await expect(page.getByRole('button', { name: /keep emi fixed/i })).toHaveClass(/active/);
    await expect(resultCard(page, 'Current EMI').locator('strong')).toHaveText(
      formatInr(calculateEmi(defaults.loan, defaults.rate, defaults.years * 12)),
    );
  });

  test('TC-501: explains the selected strategy and planning-estimate limitation', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.callout')).toContainText('Keeping EMI at');
    await expect(page.locator('footer')).toHaveText(
      'Planning estimate only. Verify final figures with your lender.',
    );

    await page.getByRole('button', { name: /keep tenure fixed/i }).click();
    await expect(page.locator('.callout')).toContainText('Keeping the remaining tenure at');
  });
});
