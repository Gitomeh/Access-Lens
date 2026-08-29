import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Serves /api/explain during `vite dev` so local development matches the
 * Vercel serverless function. GEMINI_API_KEY stays in the dev server process
 * and is never injected into client code.
 */
function explainApiDevServer(env: Record<string, string>): Plugin {
  return {
    name: 'accesslens-explain-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/explain', async (req, res) => {
        const { default: handler } = await server.ssrLoadModule('/api/explain.ts')

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const raw = Buffer.concat(chunks).toString('utf8')

        const apiRes = {
          status(code: number) {
            res.statusCode = code
            return apiRes
          },
          setHeader(name: string, value: string) {
            res.setHeader(name, value)
            return apiRes
          },
          json(body: unknown) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
            return apiRes
          },
        }

        process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY
        await handler({ method: req.method, body: raw || undefined, headers: req.headers }, apiRes)
      })
    },
  }
}

function fetchApiDevServer(): Plugin {
  return {
    name: 'fetch-api-dev-server',
    configureServer(server: any) {
      server.middlewares.use('/api/fetch', async (req: any, res: any) => {
        const fetchHandler = (await import('./api/fetch.ts')).default;
        await fetchHandler(
          { method: req.method, body: await getRequestBody(req), headers: req.headers },
          {
            status: (code: number) => {
              res.statusCode = code;
              return res;
            },
            json: (body: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            },
            setHeader: (name: string, value: string) => {
              res.setHeader(name, value);
            },
          }
        );
      });
    },
  }
}

async function getRequestBody(req: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loaded without a prefix filter so GEMINI_API_KEY is available to the dev
  // middleware only; Vite still exposes VITE_* variables alone to the client.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), explainApiDevServer(env), fetchApiDevServer()],
  }
})
