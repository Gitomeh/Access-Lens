import { explainFinding, failure } from './_lib/gemini';
import type { ExplainResult } from './_lib/types';

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

function toResponseBody(result: ExplainResult) {
  return result.ok
    ? { success: true as const, data: result.data }
    : { success: false as const, code: result.code, message: result.message };
}

function readBody(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    const result = failure('method_not_allowed', 405);
    return res.status(result.status).json(toResponseBody(result));
  }

  const result = await explainFinding(readBody(req.body), {
    apiKey: process.env.GEMINI_API_KEY,
  });

  return res.status(result.status).json(toResponseBody(result));
}
