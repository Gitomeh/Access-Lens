import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSeverityCount } from '../services/accessibilityScanner';
import type { ScanResult } from '../types/accessibility';

describe('accessibilityScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSeverityCount', () => {
    it('should count violations by severity', () => {
      const scanResult: ScanResult = {
        violations: [
          { id: '1', ruleId: 'rule1', impact: 'critical', description: '', help: '', helpUrl: '', tags: [], nodes: [] },
          { id: '2', ruleId: 'rule2', impact: 'critical', description: '', help: '', helpUrl: '', tags: [], nodes: [] },
          { id: '3', ruleId: 'rule3', impact: 'serious', description: '', help: '', helpUrl: '', tags: [], nodes: [] },
          { id: '4', ruleId: 'rule4', impact: 'moderate', description: '', help: '', helpUrl: '', tags: [], nodes: [] },
          { id: '5', ruleId: 'rule5', impact: 'minor', description: '', help: '', helpUrl: '', tags: [], nodes: [] },
        ],
        passes: [],
        incomplete: [],
      };

      const counts = getSeverityCount(scanResult);
      
      expect(counts.critical).toBe(2);
      expect(counts.serious).toBe(1);
      expect(counts.moderate).toBe(1);
      expect(counts.minor).toBe(1);
    });

    it('should return zero counts for empty violations', () => {
      const scanResult: ScanResult = {
        violations: [],
        passes: [],
        incomplete: [],
      };

      const counts = getSeverityCount(scanResult);
      
      expect(counts.critical).toBe(0);
      expect(counts.serious).toBe(0);
      expect(counts.moderate).toBe(0);
      expect(counts.minor).toBe(0);
    });
  });
});
