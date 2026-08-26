export type ExplainErrorCode =
  | 'method_not_allowed'
  | 'invalid_request'
  | 'missing_api_key'
  | 'upstream_error'
  | 'rate_limited'
  | 'invalid_ai_response'
  | 'timeout'
  | 'network_error';

export interface ExplainRequestPayload {
  ruleId: string;
  impact: string;
  description: string;
  help: string;
  html: string;
  tags: string[];
}

export interface AIExplanationPayload {
  summary: string;
  whyItMatters: string;
  whoIsAffected: string;
  recommendedFix: string;
  codeExample?: string;
}

export interface ExplainSuccess {
  ok: true;
  status: 200;
  data: AIExplanationPayload;
}

export interface ExplainFailure {
  ok: false;
  status: number;
  code: ExplainErrorCode;
  message: string;
}

export type ExplainResult = ExplainSuccess | ExplainFailure;
