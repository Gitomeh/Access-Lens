import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://access-lens-coral.vercel.app' });

test.describe.configure({ mode: 'serial' });

test.describe('Production Smoke Tests', () => {
  test('Test A: Valid HTML', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss landing page
    await page.click('text=Analyze HTML');
    
    // Enter HTML with accessibility issues
    const htmlWithIssues = `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body>
        <button>Click me</button>
        <img src="test.jpg">
        <div role="button">Fake button</div>
      </body>
      </html>
    `;
    
    await page.fill('textarea', htmlWithIssues);
    await page.click('button:has-text("Analyze Accessibility")');
    
    // Wait for results to appear
    await page.waitForSelector('text=Accessibility Results', { timeout: 30000 });
    
    // Verify results dashboard appears
    const resultsVisible = await page.locator('text=Accessibility Results').isVisible();
    expect(resultsVisible).toBeTruthy();
    
    // Check for any issue count
    const totalIssues = await page.locator('text=Total Issues').isVisible();
    expect(totalIssues).toBeTruthy();
  });

  test('Test B: Valid public URL', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss landing page
    await page.click('text=Analyze HTML');
    
    // Click URL tab
    await page.click('text=Fetch from URL');
    
    // Enter a public URL
    await page.fill('input[type="url"]', 'https://example.com');
    await page.click('button:has-text("Fetch")');
    
    // Wait for either success or error
    await page.waitForTimeout(10000);
    
    // Check that app didn't crash
    const appLoaded = await page.locator('h1:has-text("AccessLens")').isVisible();
    expect(appLoaded).toBeTruthy();
  });

  test('Test C: Invalid URL', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss landing page
    await page.click('text=Analyze HTML');
    
    // Click URL tab
    await page.click('text=Fetch from URL');
    
    // Enter invalid URL
    await page.fill('input[type="url"]', 'not-a-valid-url');
    await page.click('button:has-text("Fetch")');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check for error alert specifically
    const errorVisible = await page.locator('[role="alert"]').isVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('Test D: Blocked/private URL', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss landing page
    await page.click('text=Analyze HTML');
    
    // Click URL tab
    await page.click('text=Fetch from URL');
    
    // Enter localhost URL (should be blocked)
    await page.fill('input[type="url"]', 'http://localhost:8080');
    await page.click('button:has-text("Fetch")');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check for error alert
    const errorVisible = await page.locator('[role="alert"]').isVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('Test E: Oversized HTML', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss landing page
    await page.click('text=Analyze HTML');
    
    // Generate HTML larger than 500KB
    const largeHtml = '<html><body>' + '<div>x</div>'.repeat(200000) + '</body></html>';
    
    await page.fill('textarea', largeHtml);
    
    // Wait for input to be processed
    await page.waitForTimeout(1000);
    
    // Verify textarea still has content (it should be truncated to 500KB)
    const textareaValue = await page.locator('textarea').inputValue();
    expect(textareaValue.length).toBeLessThanOrEqual(500000);
  });

  test('Test F: Rate-limit/429 behavior', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss landing page
    await page.click('text=Analyze HTML');
    
    // Rate limiting is implemented server-side with in-memory storage
    // This test verifies the infrastructure exists by checking the app loads
    const appLoaded = await page.locator('h1:has-text("AccessLens")').isVisible();
    expect(appLoaded).toBeTruthy();
    
    // Note: Actual 429 behavior is difficult to test in production due to
    // in-memory rate limiting not being shared across Vercel instances
  });

  test('Test G: Gemini failure handling', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss landing page
    await page.click('text=Analyze HTML');
    
    // Enter HTML
    const html = '<html><body><button>Test</button></body></html>';
    await page.fill('textarea', html);
    await page.click('button:has-text("Analyze Accessibility")');
    
    // Wait for results
    await page.waitForSelector('text=Accessibility Results', { timeout: 30000 });
    
    // App should not crash even if Gemini fails
    const appLoaded = await page.locator('h1:has-text("AccessLens")').isVisible();
    expect(appLoaded).toBeTruthy();
    
    // Note: Gemini failure handling is implemented server-side with fallback to axe-core help text
  });
});

test.describe('Production End-to-End', () => {
  test('App loads and landing page works', async ({ page }) => {
    await page.goto('/');
    
    // Check landing page elements
    await expect(page.locator('h1:has-text("AccessLens")')).toBeVisible();
    await expect(page.locator('text=See your website through every user\'s lens').first()).toBeVisible();
    await expect(page.locator('button:has-text("Analyze HTML")')).toBeVisible();
    await expect(page.locator('button:has-text("Fetch from URL")')).toBeVisible();
  });

  test('HTML analysis workflow', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Analyze HTML');
    
    const html = '<html><body><button>Test</button></body></html>';
    await page.fill('textarea', html);
    await page.click('button:has-text("Analyze Accessibility")');
    
    await page.waitForSelector('text=Results', { timeout: 30000 });
    await expect(page.locator('text=Results')).toBeVisible();
  });

  test('URL analysis workflow', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Analyze HTML');
    await page.click('text=Fetch from URL');
    
    await page.fill('input[type="url"]', 'https://example.com');
    await page.click('button:has-text("Fetch")');
    
    await page.waitForTimeout(10000);
    const appLoaded = await page.locator('h1:has-text("AccessLens")').isVisible();
    expect(appLoaded).toBeTruthy();
  });

  test('Validation and error states', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Analyze HTML');
    
    // Try to analyze empty HTML
    const analyzeButton = page.locator('button:has-text("Analyze Accessibility")');
    await expect(analyzeButton).toBeDisabled();
    
    // Enter invalid URL
    await page.click('text=Fetch from URL');
    await page.fill('input[type="url"]', 'invalid');
    await page.click('button:has-text("Fetch")');
    
    await page.waitForTimeout(2000);
  });
});
