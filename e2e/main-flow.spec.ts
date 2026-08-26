import { test, expect } from '@playwright/test';

test.describe('AccessLens main flow', () => {
  test('should analyze HTML and display accessibility results', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads correctly
    await expect(page.getByRole('heading', { name: 'AccessLens' })).toBeVisible();
    await expect(page.getByText('See your website through every user\'s lens')).toBeVisible();

    // Check that the HTML editor is visible
    const textarea = page.getByRole('textbox');
    await expect(textarea).toBeVisible();

    // Check that the analyze button is visible
    const analyzeButton = page.getByRole('button', { name: /analyze accessibility/i });
    await expect(analyzeButton).toBeVisible();

    // Enter HTML with accessibility issues
    const htmlWithIssues = `<button>
  <img src="logo.png">
</button>`;
    
    await textarea.fill(htmlWithIssues);

    // Click analyze button
    await analyzeButton.click();

    // Wait for results to appear
    await expect(page.getByText('Accessibility Results')).toBeVisible({ timeout: 10000 });

    // Check that issues are displayed
    await expect(page.getByText('Issues Found')).toBeVisible();

    // Check that a finding can be selected
    const firstFinding = page.getByText(/image-alt/).first();
    if (await firstFinding.isVisible()) {
      await firstFinding.click();
      
      // Check that detail panel appears
      await expect(page.getByText('Problem')).toBeVisible();
      await expect(page.getByText('Affected HTML')).toBeVisible();
    }
  });

  test('should show error when analyzing empty HTML', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByRole('textbox');
    await textarea.fill('');

    const analyzeButton = page.getByRole('button', { name: /analyze accessibility/i });
    await analyzeButton.click();

    // Check for error message
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/please enter html/i)).toBeVisible();
  });

  test('should clear editor when clear button is clicked', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByRole('textbox');
    await textarea.fill('<div>Custom content</div>');

    const clearButton = page.getByRole('button', { name: /clear/i });
    await clearButton.click();

    // Check that textarea is reset to default
    await expect(textarea).toHaveValue(/<button>/);
  });
});
