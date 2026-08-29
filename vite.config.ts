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
        await handler({ method: req.method, body: raw || undefined }, apiRes)
      })
    },
  }
}

function fetchApiDevServer(): Plugin {
  return {
    name: 'accesslens-fetch-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/fetch', async (req, res) => {
        const { default: handler } = await server.ssrLoadModule('/api/fetch.ts')

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

        await handler({ method: req.method, body: raw || undefined }, apiRes)
      })
    },
  }
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
