# Sabotage Testing Guide for AccessLens Checkpoint 1

This document explains how to test the failure scenarios for Checkpoint 1 using the built-in sabotage infrastructure.

## Setup

1. Start the development server: `npm run dev`
2. Open the application in your browser: `http://localhost:5173`
3. Open the browser's developer console (F12)

## Sabotage Testing Infrastructure

The sabotage infrastructure is **only active in development mode** and uses a window-level flag to trigger different failure scenarios.

### How to Activate Sabotage

In the browser console, set the sabotage flag before triggering an AI explanation:

```javascript
window.__sabotage = 'error'; // or '429', 'malformed', 'midstream'
```

## Test Scenarios

### Test A — Request Failure (Before Streaming)

**Scenario**: Simulate an error before the AI request begins.

**Steps**:
1. In browser console: `window.__sabotage = 'error'`
2. Open AccessLens and analyze some HTML
3. Click on a finding to view details
4. Click "Get AI Explanation"
5. **Expected**: Error message appears explaining the failure
6. Remove sabotage: `window.__sabotage = undefined`
7. Click "Retry explanation"
8. **Expected**: Success (if API key is configured)

### Test B — Mid-Stream Failure

**Scenario**: Simulate a failure after the request has started processing.

**Steps**:
1. In browser console: `window.__sabotage = 'midstream'`
2. Open AccessLens and analyze some HTML
3. Click on a finding to view details
4. Click "Get AI Explanation"
5. **Expected**: Loading state appears, then error message after delay
6. Verify the error state is designed and user-friendly
7. Click "Retry explanation"
8. **Expected**: Retry attempts the request again
9. Remove sabotage: `window.__sabotage = undefined`

### Test C — HTTP 429 Rate Limit

**Scenario**: Simulate a rate limit response from the API.

**Steps**:
1. In browser console: `window.__sabotage = '429'`
2. Open AccessLens and analyze some HTML
3. Click on a finding to view details
4. Click "Get AI Explanation"
5. **Expected**: Rate limit error message appears
6. Verify the message is friendly and mentions rate limiting
7. Remove sabotage: `window.__sabotage = undefined`
8. Click "Retry explanation"
9. **Expected**: Success (if API key is configured)

### Test D — Malformed Response

**Scenario**: Simulate a malformed/unexpected API response.

**Steps**:
1. In browser console: `window.__sabotage = 'malformed'`
2. Open AccessLens and analyze some HTML
3. Click on a finding to view details
4. Click "Get AI Explanation"
5. **Expected**: Error message explaining the response couldn't be read
6. Verify the UI doesn't crash and shows a graceful error
7. Remove sabotage: `window.__sabotage = undefined`
8. Click "Retry explanation"
9. **Expected**: Success (if API key is configured)

## Additional Manual Tests

### Empty Input Validation
1. Try to click "Analyze Accessibility" with empty textarea
2. **Expected**: Button is disabled, no API call made

### Empty State / First Run
1. Open AccessLens
2. **Expected**: Landing page with example HTML prompts
3. Click an example
4. **Expected**: HTML is populated and you can analyze

### No-Result State
1. Paste perfect HTML (no accessibility issues)
2. Click "Analyze Accessibility"
3. **Expected**: "No accessibility issues found!" message

### Slow Response
1. Use a real AI explanation (no sabotage)
2. Observe the loading skeleton state
3. **Expected**: Skeleton UI appears, no layout jumps

### Mobile Safari Compatibility
1. Open in mobile viewport (DevTools mobile mode)
2. Test keyboard open/close
3. Test scrolling with keyboard open
4. **Expected**: No viewport issues, composer remains usable

## Production Safety

The sabotage infrastructure is **disabled in production**:

- Only active when `process.env.NODE_ENV === 'development'`
- Server-side checks for development mode before processing sabotage flags
- Cannot be accidentally activated in production builds

## Cleanup

Always remember to clear the sabotage flag after testing:

```javascript
window.__sabotage = undefined;
```

Or simply refresh the page to reset all state.
