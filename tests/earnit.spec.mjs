import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

async function child(page, name='Mia') {
  await page.getByRole('button', { name: 'Child demo' }).click();
  if (name !== 'Mia') await page.locator('header select').selectOption({ label: name+' · Teens' });
  await expect(page.getByText('Welcome, '+name)).toBeVisible();
}
async function parent(page) { await page.getByRole('button', { name: 'Parent demo' }).click(); }
async function approveFirst(page) {
  await page.getByRole('button', { name: /approvals/i }).last().click();
  await page.getByRole('button', { name: 'Approve' }).first().click();
}
test('role switching and mobile navigation', async ({ page }) => {
  await child(page); await expect(page.getByText('Welcome, Mia')).toBeVisible();
  await parent(page); await expect(page.getByText('Family overview')).toBeVisible();
  await child(page, 'Alex'); await expect(page.getByText('Welcome, Alex')).toBeVisible();
});
test('submit, approve, points, persistence and duplicate protection', async ({ page }) => {
  await child(page);
  await page.getByRole('button', { name: 'Submit for approval' }).first().click();
  await expect(page.getByText('pending').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit for approval' })).toHaveCount(1);
  await parent(page); await approveFirst(page);
  await child(page); await expect(page.getByText('10 points').first()).toBeVisible();
  await page.reload(); await child(page); await expect(page.getByText('10 points').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit for approval' })).toHaveCount(1);
});
test('rejected task can be resubmitted', async ({ page }) => {
  await child(page); await page.getByRole('button', { name: 'Submit for approval' }).first().click();
  await parent(page); await page.getByRole('button', { name: /approvals/i }).last().click();
  await page.getByRole('button', { name: 'Return' }).first().click();
  await child(page); await expect(page.getByRole('button', { name: 'Submit for approval' })).toHaveCount(2);
});
test('reward stays locked without enough points', async ({ page }) => {
  await child(page); await page.getByRole('button', { name: 'rewards' }).last().click();
  await expect(page.getByRole('button', { name: 'Locked' })).toBeDisabled();
});
test('family setup and local persistence', async ({ page }) => {
  await page.getByRole('button', { name: 'family' }).last().click();
  await page.locator('form').last().locator('[name=name]').fill('Sam');
  await page.locator('form').last().locator('[name=age]').fill('10');
  await page.locator('form').last().getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'family' }).last().click();
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();
});
test('teen submission requires parent approval', async ({ page }) => {
  await child(page,'Alex');
  await page.getByRole('button', { name: 'Submit for approval' }).first().click();
  await parent(page); await approveFirst(page);
  await child(page,'Alex'); await expect(page.getByText('approved').first()).toBeVisible();
});
