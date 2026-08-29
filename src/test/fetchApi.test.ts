import { describe, it, expect, vi } from 'vitest';
import handler from '../../api/fetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Fetch API - SSRF Protection', () => {
  it('should reject localhost URLs', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'http://localhost:8080' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('security reasons'),
      })
    );
  });

  it('should reject 127.0.0.1', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'http://127.0.0.1:3000' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should reject private IP ranges (10.x.x.x)', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'http://10.0.0.1' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject private IP ranges (192.168.x.x)', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'http://192.168.1.1' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject private IP ranges (172.16-31.x.x)', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'http://172.16.0.1' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject link-local addresses (169.254.x.x)', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'http://169.254.169.254' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject non-HTTP/HTTPS protocols', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'ftp://example.com' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('HTTP and HTTPS'),
      })
    );
  });

  it('should accept valid public HTTP URLs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<html><body>Test</body></html>'),
      url: 'http://example.com',
    });

    const req = { method: 'POST', body: JSON.stringify({ url: 'http://example.com' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        html: expect.any(String),
      })
    );
  });

  it('should accept valid public HTTPS URLs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<html><body>Test</body></html>'),
      url: 'https://example.com',
    });

    const req = { method: 'POST', body: JSON.stringify({ url: 'https://example.com' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reject blocked internal domains', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'http://internal.corp' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle timeout errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('AbortError'));

    const req = { method: 'POST', body: JSON.stringify({ url: 'http://example.com' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should reject non-POST methods', async () => {
    const req = { method: 'GET', body: null };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'POST');
  });

  it('should reject empty URL', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: '' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject malformed URL', async () => {
    const req = { method: 'POST', body: JSON.stringify({ url: 'not-a-url' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should revalidate after redirects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<html><body>Test</body></html>'),
      url: 'http://example.com', // Same URL, should pass
    });

    const req = { method: 'POST', body: JSON.stringify({ url: 'http://example.com' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should block redirects to private IPs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<html><body>Test</body></html>'),
      url: 'http://192.168.1.1', // Redirected to private IP
    });

    const req = { method: 'POST', body: JSON.stringify({ url: 'http://example.com' }) };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('blocked address'),
      })
    );
  });
});
