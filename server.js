import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { handleApiRequest, loadLocalEnv, sendJson } from './local-api.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, 'dist')
const fileEnv = loadLocalEnv(__dirname)
const env = { ...fileEnv, ...process.env }
const port = Number(env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function sendFile(res, filePath) {
  const ext = extname(filePath)
  res.statusCode = 200
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  if (ext !== '.html') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  }
  createReadStream(filePath).pipe(res)
}

function resolveStaticPath(urlPathname) {
  const safePath = normalize(decodeURIComponent(urlPathname)).replace(/^(\.\.[/\\])+/, '')
  const requested = join(distDir, safePath)

  if (!requested.startsWith(distDir)) return null
  if (existsSync(requested) && statSync(requested).isFile()) return requested

  const indexPath = join(distDir, 'index.html')
  return existsSync(indexPath) ? indexPath : null
}

const server = createServer(async (req, res) => {
  try {
    if (await handleApiRequest(req, res, env)) return

    if (!existsSync(distDir)) {
      sendJson(res, 503, {
        error: 'Production build not found. Run `npm run build` before `npm start`.'
      })
      return
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const filePath = resolveStaticPath(url.pathname)

    if (!filePath) {
      sendJson(res, 404, { error: 'Not Found' })
      return
    }

    sendFile(res, filePath)
  } catch (e) {
    sendJson(res, 500, { error: e.message })
  }
})

server.listen(port, () => {
  console.log(`Creo Builder listening on http://localhost:${port}`)
})
