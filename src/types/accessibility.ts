export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AccessibilityFinding {
  id: string;
  ruleId: string;
  impact: Severity;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AccessibilityNode[];
}

export interface AccessibilityNode {
  html: string;
  target: string[] | any;
  failureSummary?: string;
}

export interface ScanResult {
  violations: AccessibilityFinding[];
  passes: AccessibilityFinding[];
  incomplete: AccessibilityFinding[];
}

export interface AIExplanation {
  summary: string;
  whyItMatters: string;
  whoIsAffected: string;
  recommendedFix: string;
  codeExample?: string;
}

export interface AIResponse {
  success: boolean;
  data?: AIExplanation;
  error?: string;
}
