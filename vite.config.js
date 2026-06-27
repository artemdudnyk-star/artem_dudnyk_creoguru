import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleApiRequest, loadLocalEnv } from './local-api.js'

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd(), '')
  const fileEnv = loadLocalEnv(process.cwd())
  const env = { ...fileEnv, ...process.env, ...viteEnv }

  return {
    plugins: [
      react(),
      {
        name: 'local-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!(req.url || '').startsWith('/api/')) {
              next()
              return
            }

            try {
              const handled = await handleApiRequest(req, res, env)
              if (!handled) next()
            } catch (e) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        },
      },
    ],
  }
})
