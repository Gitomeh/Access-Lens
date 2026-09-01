import { explainFinding, failure } from './_lib/gemini.js';
import type { ExplainResult } from './_lib/types.js';
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js';

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | undefined>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

// Input size limits
const MAX_REQUEST_BODY_SIZE = 100_000; // 100KB

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

  // Development-only sabotage testing via query parameter
  // ONLY active in development mode with ?sabotage=X
  const isDev = process.env.NODE_ENV === 'development';
  const sabotage = isDev && req.headers?.['x-sabotage'];
  
  if (sabotage) {
    console.warn('[explain] Sabotage mode active:', sabotage);
    
    if (sabotage === 'error') {
      // Test A: request failure before streaming
      return res.status(500).json({ 
        success: false, 
        code: 'sabotage_error',
        message: 'Simulated error before request' 
      });
    }
    
    if (sabotage === '429') {
      // Test C: rate limit
      const retryAfter = 60;
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({ 
        success: false, 
        code: 'rate_limited',
        message: `Too many requests. Please try again in ${retryAfter} seconds.` 
      });
    }
    
    if (sabotage === 'malformed') {
      // Test D: malformed response
      return res.status(200).json({ 
        success: true, 
        data: { invalid: 'response', missing: 'fields' } 
      });
    }
    
    if (sabotage === 'midstream') {
      // Test B: mid-stream failure (simulated with timeout)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(res.status(500).json({ 
            success: false, 
            code: 'sabotage_midstream',
            message: 'Simulated mid-stream failure' 
          }));
        }, 1000);
      });
    }
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    const retryAfter = rateLimit.retryAfter || 60;
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({ 
      success: false, 
      code: 'rate_limited',
      message: `Too many requests. Please try again in ${retryAfter} seconds.` 
    });
  }

  // Check request body size
  if (typeof req.body === 'string' && req.body.length > MAX_REQUEST_BODY_SIZE) {
    return res.status(413).json({ 
      success: false, 
      code: 'payload_too_large',
      message: 'Request body is too large' 
    });
  }

  const result = await explainFinding(readBody(req.body), {
    apiKey: process.env.GEMINI_API_KEY,
  });

  return res.status(result.status).json(toResponseBody(result));
}
