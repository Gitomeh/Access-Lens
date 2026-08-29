// Security constants
const MAX_RESPONSE_SIZE = 2_000_000; // 2MB
const REQUEST_TIMEOUT_MS = 15_000;

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

// Blocked IP ranges (CIDR notation - simplified checks)
const BLOCKED_PATTERNS = [
  // Localhost variants
  'localhost',
  '127.',
  '0.0.0.0',
  '::1',
  '[::1]',
  // Link-local
  '169.254.',
  'fe80:',
  'fc00:',
  // Private ranges
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  // Cloud metadata endpoints
  '169.254.169.254',
  'metadata.google.internal',
  'metadata',
];

// Blocked TLDs/internal domains
const BLOCKED_DOMAINS = [
  'localhost',
  'local',
  'internal',
  'intranet',
  'corp',
  'private',
];

/**
 * Validate URL for SSRF protection
 */
function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // Check for blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (hostname.includes(pattern) || hostname.startsWith(pattern)) {
        return { valid: false, error: 'This address cannot be analyzed for security reasons' };
      }
    }
    
    // Check for blocked domains
    const domainParts = hostname.split('.');
    for (const blocked of BLOCKED_DOMAINS) {
      if (domainParts.includes(blocked)) {
        return { valid: false, error: 'This address cannot be analyzed for security reasons' };
      }
    }
    
    // Check for IP address format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      // Check if it's a private IP
      if (
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        parts[0] === 127 ||
        hostname.startsWith('0.') ||
        hostname.startsWith('169.254.')
      ) {
        return { valid: false, error: 'This address cannot be analyzed for security reasons' };
      }
    }
    
    // Check for IPv6 loopback/private
    if (hostname.includes(':') && (hostname.startsWith('::') || hostname.startsWith('fe80:') || hostname.startsWith('fc00:'))) {
      return { valid: false, error: 'This address cannot be analyzed for security reasons' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Fetch HTML from URL with SSRF protections
 */
async function fetchHtml(url: string): Promise<{ html: string; error?: string }> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    return { html: '', error: validation.error };
  }
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'AccessLens/1.0 (+https://github.com/Gitomeh/Access-Lens)',
      },
    });
    
    clearTimeout(timeout);
    
    // Revalidate after redirects
    if (response.url !== url) {
      const redirectValidation = validateUrl(response.url);
      if (!redirectValidation.valid) {
        return { html: '', error: 'Redirected to a blocked address' };
      }
    }
    
    if (!response.ok) {
      if (response.status === 403) {
        return { html: '', error: 'Access denied. The website may block automated requests.' };
      }
      if (response.status === 404) {
        return { html: '', error: 'Page not found.' };
      }
      if (response.status >= 500) {
        return { html: '', error: 'The website returned an error. Please try again later.' };
      }
      return { html: '', error: `Could not retrieve page (HTTP ${response.status})` };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('text/html')) {
      return { html: '', error: 'The URL does not appear to be an HTML page' };
    }
    
    // Check content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      return { html: '', error: 'The page is too large to analyze' };
    }
    
    let html = await response.text();
    
    // Enforce size limit
    if (html.length > MAX_RESPONSE_SIZE) {
      html = html.slice(0, MAX_RESPONSE_SIZE);
    }
    
    return { html };
  } catch (error) {
    clearTimeout(timeout);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { html: '', error: 'The website took too long to respond' };
    }
    
    return { html: '', error: 'Could not retrieve the page. The website may be unavailable or blocking requests.' };
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  let body: unknown;
  try {
    body = req.body ? JSON.parse(req.body as string) : null;
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }
  
  if (!body || typeof body !== 'object' || !('url' in body) || typeof body.url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }
  
  const url = body.url.trim();
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL cannot be empty' });
  }
  
  const result = await fetchHtml(url);
  
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  
  return res.status(200).json({ success: true, html: result.html });
}
