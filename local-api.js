import { request as httpsRequest } from 'node:https'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DATA_FILE = join(DATA_DIR, 'tests.json')
const SETTINGS_FILE = join(DATA_DIR, 'settings.json')

export const STUB_RESPONSE = {
  header: {
    tracking_id: "KC_US_GRCH_LOSS_SHOEBOX_AIUGC_28S_HOOK_v01_STORAGE",
    one_liner: "Ностальгічна then/now реклама: коробка з подвійними фото переходить у телефонну галерею з дублікатами.",
    audience: "Fear of Delete — старші американці, які бояться втратити справжні сімейні фото.",
    angle: "Loss aversion",
    emotional_job: "Зняти страх видалення через просту аналогію: копія не є спогадом.",
    format: "AIUGC",
    duration_s: 28,
    hook_0_3s: "Рука знаходить 9 однакових відбитків у старій коробці."
  },
  quality: {
    score: "5/5",
    checklist: [
      { label: "Є 0–3s hook", passed: true },
      { label: "ASSET і COMPOSE синхронні", passed: true },
      { label: "VO має таймінги", passed: true },
      { label: "CTA має brand/store", passed: true },
      { label: "AI Generated policy виконано", passed: true }
    ]
  },
  asset: [
    {
      tc: "0–4с",
      label: "Хук",
      in_frame: "Стара взуттєва коробка з пожовклими фото; рука знаходить 9 однакових відбитків. Тепле кухонне світло, ностальгічний домашній кадр.",
      camera: "UGC, handheld, легкий шейк, максимально реалістично.",
      screen: "нема UI",
      vo: "нема VO, тільки шелест фото",
      audio: "тихий room tone + шелест паперу"
    },
    {
      tc: "4–13с",
      label: "Перехід у телефон",
      in_frame: "Та сама рука бере телефон; екран у кадрі як грін-скрін, великий палець свайпає галерею.",
      camera: "Крупний план з рук, природний motion blur.",
      screen: "green-screen / placeholder",
      vo: "'You would never keep nine copies of one print.' (4с) → 'So why keep them on your phone?' (8с)",
      audio: "паперовий шелест переходить у digital tick"
    },
    {
      tc: "13–22с",
      label: "Рішення",
      in_frame: "AI-людей немає; тільки телефон у руці з грін-скріном.",
      camera: "Статичніше, щоб UI було легко зібрати.",
      screen: "green-screen / placeholder",
      vo: "'KeepClean removes duplicates, not memories.' (14с)",
      audio: "м'який whoosh на очищенні"
    },
    {
      tc: "22–28с",
      label: "CTA",
      in_frame: "Героїня 60+ спокійно дивиться сімейне фото на телефоні; теплий домашній інтер'єр.",
      camera: "UGC talking-head, м'яке світло, реалістичний аматорський вигляд.",
      screen: "green-screen / placeholder",
      vo: "'Free up space for what matters.' (24с)",
      audio: "теплий фінальний підйом"
    }
  ],
  compose: [
    {
      tc: "0–4с",
      real_ui: "UI немає; поверх кадру можна додати дрібний текст '9 copies of one memory'.",
      trigger: "—",
      music: "тихий ностальгічний bed",
      subs: "Крупні саби, читаються без звуку.",
      vo: "—",
      brand: "—"
    },
    {
      tc: "4–13с",
      real_ui: "Реальний screen recording галереї з 9 однаковими фото; підсвітити дублікати рамками.",
      trigger: "digital tick на кожному свайпі",
      music: "музика тиха під VO",
      subs: "Синхронні саби для кожної VO-репліки.",
      vo: "VO з asset beat",
      brand: "—"
    },
    {
      tc: "13–22с",
      real_ui: "Реальний KeepClean UI: scan → duplicates found → original kept → one tap cleanup.",
      trigger: "whoosh + ding після cleanup",
      music: "легкий uplift",
      subs: "Саби синхронні, ключова фраза 'not memories' виділена.",
      vo: "VO з asset beat",
      brand: "Лого KeepClean на згадці бренду; дисклеймер 'AI Generated' у кутку."
    },
    {
      tc: "22–28с",
      real_ui: "Packshot KeepClean + результат очищення.",
      trigger: "фінальний ding",
      music: "теплий фінальний підйом",
      subs: "CTA великим шрифтом.",
      vo: "VO з asset beat",
      brand: "Лого + пекшот + CTA-плашка + App Store / Google Play; дисклеймер 'AI Generated'."
    }
  ],
  vo: [
    { tc: "4с", line: "You would never keep nine copies of one print." },
    { tc: "8с", line: "So why keep them on your phone?" },
    { tc: "14с", line: "KeepClean removes duplicates, not memories." },
    { tc: "24с", line: "Free up space for what matters." }
  ],
  strengths: [
    "Самовпізнавання: кожна людина 58–70 бачила таку коробку",
    "Оффер «Прибираємо дублікати, не фото» вписується природньо"
  ],
  pressure_test: [
    "Ризик: аналогія може не спрацювати для тих, хто ніколи не друкував фото. Фікс: швидко перевести в телефон на 4с.",
    "Ризик: ностальгія може переважити CTA. Фікс: показати KeepClean UI з 13с."
  ],
  refs: { music_ref: null, hook_ref: null, ugc_realism: true },
  naming: {
    tracking_id: "KC_US_GRCH_LOSS_SHOEBOX_AIUGC_28S_HOOK_v01_STORAGE",
    ab_suffixes: ["_HOOKB", "_NOVO"]
  }
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

function proxyOpenAIResponse(body) {
  try {
    const data = JSON.parse(body)
    const text = data.choices?.[0]?.message?.content || ''
    return JSON.stringify({
      content: [{ type: 'text', text }],
      stop_reason: data.choices?.[0]?.finish_reason || 'stop',
    })
  } catch {
    return body
  }
}

function callOpenAI(body, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'content-length': Buffer.byteLength(body),
      },
    }

    const proxyReq = httpsRequest(options, proxyRes => {
      let responseBody = ''
      proxyRes.on('data', chunk => { responseBody += chunk })
      proxyRes.on('end', () => {
        resolve({
          statusCode: proxyRes.statusCode || 502,
          body: proxyRes.statusCode && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300
            ? proxyOpenAIResponse(responseBody)
            : responseBody,
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

    const apiKey = env.OPENAI_API_KEY

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
        payload.model = env.OPENAI_MODEL || payload.model || 'gpt-4o'
        if (payload.max_tokens && !payload.max_completion_tokens) {
          payload.max_tokens = Math.min(Number(payload.max_tokens) || 1200, 8000)
        }
        upstreamBody = JSON.stringify(payload)
      } catch {
        upstreamBody = body
      }

      const upstream = await callOpenAI(upstreamBody, apiKey)
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
