import { request as httpsRequest } from 'node:https'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DATA_FILE = join(DATA_DIR, 'tests.json')
const SETTINGS_FILE = join(DATA_DIR, 'settings.json')

export const STUB_RESPONSE = {
  adaptation: "Ідея «Shoebox / double prints» адаптована під бабусь і дідусів: фізичний хаос коробки з подвійними відбитками прямо відображає цифровий безлад у галереї — і KeepClean прибирає саме копії, залишаючи оригінальні спогади.",
  brief: {
    oneLine: "Ностальгічна then/now реклама: коробка з подвійними фото переходить у телефонну галерею з дублікатами.",
    audience: "Fear of Delete — старші американці, які бояться втратити справжні сімейні фото.",
    emotionalJob: "Зняти страх видалення через просту аналогію: копія не є спогадом.",
    productionGoal: "Дати продакшну чіткий 30-секундний сценарій із кадрами, UI-плейсхолдерами, копі й CTA."
  },
  strengths: [
    "Самовпізнавання: кожна людина 58–70 бачила таку коробку",
    "Оффер «Прибираємо дублікати, не фото» вписується природньо"
  ],
  weakSpots: [
    "Аналогія може не спрацювати для тих, хто ніколи не друкував фото",
    "Без чіткого CTA ризикує залишитися просто ностальгійним кліпом"
  ],
  asset: "Сцена 1: стара взуттєва коробка з пожовклими фото — рука перебирає подвоєні відбитки.\nСцена 2: смартфон, галерея — те саме фото 9 разів підряд.\nСцена 3: один тап у KeepClean → дублікати зникають, оригінали залишаються.\nVO: «You'd never keep nine copies of the same print. Why keep them on your phone?»",
  compose: "Монтаж: cut між плівковими фото та скріншотами галереї. Субтитри у стилі машинки. Звук: шелест паперу → кліп тапа → ding звільненого місця. Лого KeepClean на фіналі. Дисклеймер «AI Generated» знизу. Пакшот: «Free up your phone today».",
  productionBrief: {
    hook3s: "0–3s: крупний план коробки, рука знаходить 9 однакових відбитків. Copy: 'You would never keep 9 copies of one print.'",
    shotList: [
      {
        time: "0–3s",
        visual: "Крупний план коробки з фото, рука відкладає однакові відбитки в окрему стопку.",
        screen: "Екрана телефона немає.",
        copy: "You would never keep 9 copies of one print.",
        audio: "Шелест паперу, теплий домашній room tone.",
        purpose: "Миттєво пояснити метафору дубліката."
      },
      {
        time: "3–12s",
        visual: "Та сама рука бере телефон; у галереї видно 9 однакових фото.",
        screen: "Green-screen або реальний screen recording галереї з повтором одного фото.",
        copy: "So why keep them on your phone?",
        audio: "Папір переходить у легкий digital tick.",
        purpose: "З'єднати аналогову коробку з цифровою проблемою."
      },
      {
        time: "12–24s",
        visual: "KeepClean групує дублікати, оригінал залишається видимим.",
        screen: "UI: duplicates found, original kept, one-tap cleanup.",
        copy: "KeepClean removes duplicates, not memories.",
        audio: "М'який ding після підтвердження.",
        purpose: "Закрити головний страх: оригінальні спогади в безпеці."
      },
      {
        time: "24–30s",
        visual: "Героїня спокійно дивиться сімейне фото, телефон показує більше вільного місця.",
        screen: "Packshot KeepClean + App Store / Google Play CTA.",
        copy: "Free up space in one tap.",
        audio: "Теплий фінальний підйом.",
        purpose: "Завершити дією, не тільки ностальгією."
      }
    ],
    requiredAssets: [
      "Коробка зі старими фото",
      "Набір подвоєних відбитків",
      "Телефон із green-screen або screen recording галереї",
      "Screen recording KeepClean cleanup flow"
    ],
    qaChecklist: [
      "У перші 3 секунди видно саме дублікати, а не просто старі фото",
      "Оригінал явно залишається після cleanup",
      "CTA є в останні 3 секунди",
      "Немає обіцянок, які не показані в UI"
    ]
  },
  hypothesisTag: "shoebox_dupl_boomers_stub"
}

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath, data) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(filePath, JSON.stringify(data, null, 2))
}

export function readTests() {
  return readJson(DATA_FILE, [])
}

export function writeTests(tests) {
  writeJson(DATA_FILE, tests)
}

export function readSettings() {
  return readJson(SETTINGS_FILE, {})
}

export function writeSettings(data) {
  writeJson(SETTINGS_FILE, data)
}

export function loadLocalEnv(baseDir = __dirname) {
  const envPath = join(baseDir, '.env')
  if (!existsSync(envPath)) return {}

  return readFileSync(envPath, 'utf-8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return acc
      const eq = trimmed.indexOf('=')
      if (eq === -1) return acc
      const key = trimmed.slice(0, eq).trim()
      const rawValue = trimmed.slice(eq + 1).trim()
      acc[key] = rawValue.replace(/^["']|["']$/g, '')
      return acc
    }, {})
}

export function readRequestBody(req, limit = 2_000_000) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > limit) {
        reject(new Error('Request body is too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function sendMethodNotAllowed(res) {
  sendJson(res, 405, { error: 'Method Not Allowed' })
}

function callAnthropic(body, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-length': Buffer.byteLength(body),
      },
    }

    const proxyReq = httpsRequest(options, proxyRes => {
      let responseBody = ''
      proxyRes.on('data', chunk => { responseBody += chunk })
      proxyRes.on('end', () => {
        resolve({
          statusCode: proxyRes.statusCode || 502,
          body: responseBody,
        })
      })
    })

    proxyReq.on('error', reject)
    proxyReq.write(body)
    proxyReq.end()
  })
}

export async function handleApiRequest(req, res, env = process.env) {
  const url = new URL(req.url || '/', 'http://localhost')
  const pathname = url.pathname

  if (pathname === '/api/settings') {
    if (req.method === 'GET') {
      sendJson(res, 200, readSettings())
      return true
    }

    if (req.method === 'PUT') {
      try {
        writeSettings(JSON.parse(await readRequestBody(req)))
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 400, { error: e.message })
      }
      return true
    }

    sendMethodNotAllowed(res)
    return true
  }

  if (pathname === '/api/tests') {
    if (req.method === 'GET') {
      sendJson(res, 200, readTests())
      return true
    }

    if (req.method === 'POST') {
      try {
        const record = JSON.parse(await readRequestBody(req))
        const tests = readTests()
        tests.push(record)
        writeTests(tests)
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 400, { error: e.message })
      }
      return true
    }

    sendMethodNotAllowed(res)
    return true
  }

  if (pathname === '/api/adapt') {
    if (req.method !== 'POST') {
      sendMethodNotAllowed(res)
      return true
    }

    const apiKey = env.ANTHROPIC_API_KEY

    if (!apiKey) {
      setTimeout(() => {
        sendJson(res, 200, {
          content: [{ type: 'text', text: JSON.stringify(STUB_RESPONSE) }]
        })
      }, 500)
      return true
    }

    try {
      const body = await readRequestBody(req)
      let upstreamBody = body
      try {
        const payload = JSON.parse(body)
        payload.model = env.ANTHROPIC_MODEL || payload.model || 'claude-sonnet-4-6'
        upstreamBody = JSON.stringify(payload)
      } catch {
        upstreamBody = body
      }

      const upstream = await callAnthropic(upstreamBody, apiKey)
      res.statusCode = upstream.statusCode
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(upstream.body)
    } catch (e) {
      sendJson(res, 502, { error: e.message })
    }
    return true
  }

  return false
}
