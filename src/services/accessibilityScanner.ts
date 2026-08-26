import type { AccessibilityFinding, ScanResult, Severity } from '../types/accessibility';

// Lazy load axe-core to reduce initial bundle size
let axeCore: any = null;

async function getAxeCore() {
  if (!axeCore) {
    try {
      axeCore = await import('axe-core');
    } catch (error) {
      console.error('Failed to load axe-core:', error);
      throw error;
    }
  }
  return axeCore;
}

const impactToSeverity: Record<string, Severity> = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
};

/**
 * Sanitize HTML to prevent script execution and event handlers
 * This ensures security when analyzing untrusted user HTML
 */
function sanitizeHTML(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]*/gi, '');
  
  // Remove javascript: protocol in href/src
  sanitized = sanitized.replace(/href\s*=\s*["']?javascript:[^"']*/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']?javascript:[^"']*/gi, 'src=""');
  
  return sanitized;
}

/**
 * Create a proper DOM document from HTML string
 * This ensures axe-core has a valid document context to analyze
 */
function createDocumentFromHTML(html: string): Document {
  // Check if DOMParser is available (browser environment)
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // If parsing failed (common with fragment-only HTML), create a basic document structure
    if (doc.querySelector('parsererror')) {
      const fallbackDoc = document.implementation.createHTMLDocument('Accessibility Scan');
      const body = fallbackDoc.body;
      body.innerHTML = html;
      return fallbackDoc;
    }
    
    return doc;
  }
  
  // Fallback for Node.js environment (testing)
  if (typeof document !== 'undefined' && document.implementation) {
    const fallbackDoc = document.implementation.createHTMLDocument('Accessibility Scan');
    const body = fallbackDoc.body;
    body.innerHTML = html;
    return fallbackDoc;
  }
  
  // Ultimate fallback - create a minimal mock document
  throw new Error('No DOM implementation available');
}

/**
 * Analyze HTML for accessibility issues
 * @param html - The HTML string to analyze
 * @returns ScanResult with violations, passes, and incomplete findings
 */
export async function analyzeHtml(html: string): Promise<ScanResult> {
  if (!html || typeof html !== 'string') {
    return {
      violations: [],
      passes: [],
      incomplete: [],
    };
  }

  const axe = await getAxeCore();
  
  // Sanitize HTML to prevent script execution
  const sanitizedHTML = sanitizeHTML(html);
  
  // Create a proper document structure
  const doc = createDocumentFromHTML(sanitizedHTML);
  
  // Run axe-core on the document body
  const results = await axe.run(doc.body || doc.documentElement, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  });

  // Convert axe results to our format
  const violations = results.violations.map(convertAxeResult);
  const passes = results.passes.map(convertAxeResult);
  const incomplete = results.incomplete.map(convertAxeResult);

  return {
    violations,
    passes,
    incomplete,
  };
}

function convertAxeResult(result: any): AccessibilityFinding {
  return {
    id: result.id,
    ruleId: result.id,
    impact: (result.impact ? impactToSeverity[result.impact] : 'moderate') as Severity,
    description: result.description,
    help: result.help,
    helpUrl: result.helpUrl,
    tags: result.tags || [],
    nodes: result.nodes.map((node: any) => ({
      html: node.html,
      target: node.target || [],
      failureSummary: node.failureSummary,
    })),
  };
}

export function getSeverityCount(scanResult: ScanResult): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  scanResult.violations.forEach(finding => {
    counts[finding.impact]++;
  });

  return counts;
}
