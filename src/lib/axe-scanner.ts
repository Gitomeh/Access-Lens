import { analyzeHtml as analyzeHtmlService, getSeverityCount as getSeverityCountService } from '../services/accessibilityScanner';
import type { ScanResult, Severity } from '../types/accessibility';

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use analyzeHtml from services/accessibilityScanner instead
 */
export async function scanHTML(html: string): Promise<ScanResult> {
  return analyzeHtmlService(html);
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use getSeverityCount from services/accessibilityScanner instead
 */
export function getSeverityCount(scanResult: ScanResult): Record<Severity, number> {
  return getSeverityCountService(scanResult);
}
