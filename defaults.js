// ─── Variation budget ────────────────────────────────────────────────────────
// Controls how many variants to generate per lever.
// angle = highest leverage (vary most), format = lowest (vary least).
export const VARIATION_BUDGET = { angle: 6, offer: 3, persona: 2, format: 2 }

export const DEFAULT_PRODUCT_ID = "keepclean"

export const DEFAULT_PRODUCTS = [
  {
    id: DEFAULT_PRODUCT_ID,
    name: "KeepClean",
    tag: "KC",
    market: "US",
    category: "Mobile photo cleaner",
    audience: "Старші американці та Gen X, які бояться втратити сімейні фото",
    promise: "Видаляє дублікати й чужі форварди, звільняє місце, не торкається оригінальних спогадів",
    defaultProblem: "storage_full",
  },
]

// ─── Personas ─────────────────────────────────────────────────────────────────
// Schema: compact persona card used by the constructor and settings UI.
// Fields:
//   id            — stable slug
//   archetypeName — short archetype name
//   description   — situation + behavior + emotional barrier
//   demoContext   — lightweight demographic/use-context note
//   tag           — tracking tag
//   name          — display label in UI selects (= archetypeName)
export const DEFAULT_PERSONAS = [
  {
    id: "boom_grch",
    archetypeName: "Обсесивні бабусі/дідусі",
    name: "Обсесивні бабусі/дідусі",
    description: "Фотографують онуків нонстоп — 'almost 5,000 photos in one year'.\nНе видаляють нічого, бо кожне фото = спогад",
    demoContext: "58–70, переважно жінки, 5–6 онуків",
    tag: "grch",
  },
  {
    id: "missed_moment",
    archetypeName: "Мами/бабусі важливих моментів",
    name: "Мами/бабусі важливих моментів",
    description: "Вже пропускали важливий момент через повний сторедж.\nБояться знову побачити 'Cannot take photo', коли дитина або онук робить щось неповторне",
    demoContext: "40–65, мами або бабусі, сімейні події, дні народження, свята",
    tag: "missed",
  },
  {
    id: "chronic_accumulator",
    archetypeName: "Хронічні накопичувачі галереї",
    name: "Хронічні накопичувачі галереї",
    description: "Роками знають, що галерею треба почистити, але не знають з чого почати.\nСкролять хаос, відкладають на потім і бояться випадково стерти важливе",
    demoContext: "45–58, Gen X, багато чатів, скриншотів, сімейних фото і дублікатів",
    tag: "accum",
  },
  {
    id: "slow_phone",
    archetypeName: "Ті, хто думають що телефон вже старий",
    name: "Ті, хто думають що телефон вже старий",
    description: "Телефон гальмує, камера відкривається повільно, застосунки зависають.\nДумають купувати новий телефон, хоча причина часто в переповненому сховищі",
    demoContext: "50–68, Boomers і Gen X, не пов'язують повільний телефон зі storage full",
    tag: "slowph",
  },
]

// ─── Insights ─────────────────────────────────────────────────────────────────
export const INSIGHT_TYPES = ["інсайт", "тригер", "заперечення", "драйвер"]

export const DEFAULT_INSIGHTS = [
  {
    id: "break_fear",
    type: "заперечення",
    essence: "Бояться, що «чистка» зламає телефон або зітре важливе.\nГоловний бар'єр довіри до cleaner-додатку",
    usage: "Safety-фрейм: прев'ю перед видаленням, «важливого не торкнемось»",
    tag: "break_fear",
  },
  {
    id: "tech",
    type: "тригер",
    essence: "Технічний бар'єр: майже половина Boomers потребує допомоги для налаштування девайсів",
    usage: "Показати максимально простий сценарій: один тап, все видно до видалення",
    tag: "tech",
  },
  {
    id: "memories",
    type: "інсайт",
    essence: "Бояться видаляти фото, бо це єдині спогади",
    usage: "Відділяти спогади від сміття: дублікати, форварди й скріни не дорівнюють сімейним фото",
    tag: "memories",
  },
]

// ─── Offers ───────────────────────────────────────────────────────────────────
// Schema:
//   product   — what is being sold
//   framing   — how the deal/value is framed:
//               bundle | giftWithPurchase | tiered | subscription |
//               priceAnchor | costPerUse | freeTrial
//   valueProp — core value in one line
//   label     — UI display text (= valueProp, kept for backwards compat)
export const DEFAULT_OFFERS = [
  {
    id: "free_trial",
    tag: "freetrial",
    product: "KeepClean",
    framing: "freeTrial",
    valueProp: "Побач скільки звільниш — ще до покупки. 1 тап, безкоштовно.",
    label: "Free trial: побач результат до покупки",
  },
  {
    id: "price_anchor",
    tag: "anchor",
    product: "KeepClean Premium",
    framing: "priceAnchor",
    valueProp: "Не купляй новий телефон за $800 — очисти старий за $4.99.",
    label: "Price anchor: $4.99 vs новий телефон за $800",
  },
  {
    id: "dupl_safe",
    tag: "dupl_safe",
    product: "KeepClean",
    framing: "costPerUse",
    valueProp: "Прибираємо дублікати й чужі форварди — твої спогади не чіпаємо.",
    label: "Safety frame: прибираємо дублікати, не спогади",
  },
]

// ─── Angles ───────────────────────────────────────────────────────────────────
// Schema:
//   id          — stable slug for selects/storage
//   name        — angle name shown in the constructor
//   description — core strategic framing for this angle
//   tag         — short tracking tag
export const DEFAULT_ANGLES = [
  {
    id: "loss_aversion",
    name: "Loss aversion",
    description: "Страх втратити цінне сильніший за бажання отримати —\n«не загуби спогади», а не «звільни місце»",
    tag: "loss",
  },
  {
    id: "safety_control",
    name: "Safety and control",
    description: "Головний бар'єр — страх натиснути Delete.\nКут має показувати контроль: користувач бачить прев'ю, сам підтверджує, важливе не зникає.",
    tag: "safe",
  },
  {
    id: "not_memories",
    name: "Not your memories",
    description: "Переозначити чистку: ми не видаляємо спогади, ми прибираємо дублікати, скріни й чужі форварди.\nФокус — «сміття не дорівнює пам'ять».",
    tag: "notmem",
  },
  {
    id: "future_moment",
    name: "Future moment",
    description: "Проблема не в гігабайтах, а в моменті, який можна не зняти.\nКут продає місце як готовність до наступного важливого фото або відео.",
    tag: "future",
  },
  {
    id: "dignity_independence",
    name: "Dignity and independence",
    description: "Не змушуй людину просити дітей про допомогу.\nКут: вона сама наводить порядок у телефоні, спокійно й без сорому.",
    tag: "dignity",
  },
  {
    id: "proof_reassurance",
    name: "Proof reassurance",
    description: "Людина не хоче бути першою, хто ризикує спогадами.\nКут знімає страх через приклад: інші теж боялись, але побачили прев'ю й нічого важливого не втратили.",
    tag: "proof",
  },
]

// ─── Formats ──────────────────────────────────────────────────────────────────
// Schema:
//   awarenessFit    — which awareness stages this format suits: cold | warm | hot
//   needsEducation  — true if product/problem requires explanation in the ad
//   productionCost  — low | medium | high
//   coldScalable    — can this format scale to cold audiences?
//   name, prod, note — kept for UI display + prompt builder
export const DEFAULT_FORMATS = [
  {
    id: "ugc",
    name: "UGC Story",
    tag: "ugc",
    prod: "AI-gen",
    awarenessFit: ["cold", "warm"],
    needsEducation: false,
    productionCost: "low",
    coldScalable: true,
    note: "Особиста історія, вертикаль. Найкраще для problem-aware холодної аудиторії.",
  },
  {
    id: "vsl",
    name: "VSL",
    tag: "vsl",
    prod: "AI-gen",
    awarenessFit: ["warm", "hot"],
    needsEducation: true,
    productionCost: "medium",
    coldScalable: false,
    note: "Топ під старшу аудиторію + едукейшн. Потрібна повна аргументація: хто клієнт, чому зараз.",
  },
  {
    id: "static",
    name: "Static Ad",
    tag: "static",
    prod: "static",
    awarenessFit: ["cold", "warm", "hot"],
    needsEducation: false,
    productionCost: "low",
    coldScalable: true,
    note: "НЕДООЦІНЕНИЙ. Дешевий, масштабується на cold. Слабкий static = skill issue, не формат.",
  },
  {
    id: "longcopy_static",
    name: "Long Copy Static",
    tag: "longstatic",
    prod: "static",
    awarenessFit: ["cold", "warm"],
    needsEducation: true,
    productionCost: "low",
    coldScalable: true,
    note: "НЕДООЦІНЕНИЙ. Для складних рішень де потрібен аргумент. Читають більше ніж думають.",
  },
  {
    id: "dialog",
    name: "Dialog",
    tag: "dialog",
    prod: "AI-gen",
    awarenessFit: ["cold", "warm"],
    needsEducation: true,
    productionCost: "low",
    coldScalable: true,
    note: "Двоє в кадрі, тепло. Природній objection handling через реальний діалог.",
  },
  {
    id: "thead",
    name: "Talking Head",
    tag: "thead",
    prod: "office",
    awarenessFit: ["cold", "warm"],
    needsEducation: false,
    productionCost: "medium",
    coldScalable: true,
    note: "Пряме звернення, жива зйомка. Credibility вище ніж AI-gen для скептичної аудиторії.",
  },
  {
    id: "screenrec",
    name: "Screen Recording",
    tag: "screenrec",
    prod: "screen (real)",
    awarenessFit: ["warm", "hot"],
    needsEducation: true,
    productionCost: "low",
    coldScalable: false,
    note: "Реальний запис екрана — максимальна достовірність. Для тих хто вже знає проблему.",
  },
  {
    id: "dpa",
    name: "DPA / Catalog",
    tag: "dpa",
    prod: "dynamic",
    awarenessFit: ["hot"],
    needsEducation: false,
    productionCost: "low",
    coldScalable: false,
    note: "УВАГА: переатрибутовує органіку. Дивись incremental attribution. НЕ масштабувати на cold.",
  },
  {
    id: "partnership",
    name: "Partnership / Creator",
    tag: "partner",
    prod: "partnership",
    awarenessFit: ["cold", "warm"],
    needsEducation: false,
    productionCost: "medium",
    coldScalable: true,
    note: "НЕДОВИКОРИСТАНИЙ арбітраж. Таргетинг по аудиторії інфлюенсера — окрема cold аудиторія.",
  },
  {
    id: "reaction",
    name: "Reaction",
    tag: "reaction",
    prod: "office",
    awarenessFit: ["cold", "warm"],
    needsEducation: false,
    productionCost: "medium",
    coldScalable: true,
    note: "Реакція на власну галерею. Емоційне самовпізнавання.",
  },
  {
    id: "beforeafter",
    name: "Before / After Static",
    tag: "beforeafter",
    prod: "static",
    awarenessFit: ["cold", "warm"],
    needsEducation: false,
    productionCost: "low",
    coldScalable: true,
    note: "Спліт до/після. Для transformation-кута.",
  },
]

// ─── Seeds ────────────────────────────────────────────────────────────────────
export const DEFAULT_SEEDS = [
  { id: "shoebox",  title: "Shoebox / double prints", text: "Then/now: стара взуттєва коробка з подвоєними відбитками (double prints) на кухонному столі → той самий безлад у сучасному телефоні → один тап KeepClean. Раніше перебирали руками, лишали хороше, викидали копії." },
  { id: "flextape", title: "Flex Tape leak",           text: "Акваріум (= телефон) тріскає, вода з дублікатами/емейлами/іконками апок хлище назовні; кремезний майстер заклеює тріщину скотчем із лого KeepClean. Драматичний інфомерціал, проблема→миттєвий фікс." },
  { id: "elephant", title: "Elephant CEO mascot",      text: "СЕО — теплий AI-слон (асоціація: память + довіра, «слон ніколи не забуває»), говорить на камеру про місію: ми оберігаємо спогади, а не видаляємо." },
  { id: "clones",   title: "Crowd of clones",          text: "Натовп ідентичних клонів на площі, а одна справжня унікальна людина загубилася серед копій. Дублікати ховають справжній спогад." },
  { id: "xerox",    title: "Xerox-maniac",             text: "Ксерокс без упину випльовує те саме фото, гора однакових аркушів росте до стелі. Найчистіша візуалізація «одне фото × тисячу разів»." },
  { id: "spam",     title: "Spam pile / one real letter", text: "Поштова скринька забита однаковими листівками й рекламою, а один справжній лист поховано під ними. Мапиться на «good morning» форварди." },
  { id: "dialog",   title: "Daughter + mom dialog",    text: "Донька лагідно показує мамі на її телефоні: «це фото в тебе 9 разів, ці квіти прийшли в трьох чатах. Онуків ніхто не чіпає — зникнуть лише копії». Мама: «Oh… they're all still here»." },
  { id: "povgran",  title: "POV grandmother screen rec", text: "POV від першої особи: руки бабусі гортають галерею, VO — сама бабуся: «I was scared to delete my photos…». Бачить, що сміття — це копії, не спогади." },
]

export function normalizePersona(persona = {}) {
  const archetypeName = persona.archetypeName || persona.name || ""
  const description = persona.description || [
    persona.problem,
    persona.desire,
    persona.trigger,
    persona.onScreenCharacter,
  ].filter(Boolean).join("\n")

  return {
    id: persona.id || `persona_${Date.now()}`,
    archetypeName,
    name: archetypeName,
    description,
    demoContext: persona.demoContext || "",
    tag: persona.tag || persona.segTag || "",
  }
}

export function normalizePersonas(personas = []) {
  return Array.isArray(personas) ? personas.map(normalizePersona) : []
}

export function normalizeInsight(insight = {}, index = 0) {
  return {
    id: insight.id || `insight_${Date.now()}_${index}`,
    type: INSIGHT_TYPES.includes(insight.type) ? insight.type : "інсайт",
    essence: insight.essence || insight.label || insight.description || "",
    usage: insight.usage || insight.howToUse || insight.use || "",
    tag: insight.tag || insight.id || "",
  }
}

export function normalizeInsights(insights = []) {
  return Array.isArray(insights) ? insights.map((insight, index) => normalizeInsight(insight, index)) : []
}

export function normalizeAngle(angle = {}, index = 0) {
  const name = angle.name || angle.title || angle.what || `Кут ${index + 1}`
  const description = angle.description
    || angle.argument
    || angle.painLed
    || [angle.what, angle.why].filter(Boolean).join("\n")
    || ""

  return {
    id: angle.id || `angle_${Date.now()}_${index}`,
    name,
    description,
    tag: angle.tag || angle.id || "",
  }
}

export function normalizeAngles(angles = []) {
  return Array.isArray(angles) ? angles.map((angle, index) => normalizeAngle(angle, index)) : []
}

export function createDefaultProductSettings(overrides = {}) {
  return {
    personas: normalizePersonas(DEFAULT_PERSONAS),
    insights: normalizeInsights(DEFAULT_INSIGHTS),
    offers: DEFAULT_OFFERS,
    angles: normalizeAngles(DEFAULT_ANGLES),
    formats: DEFAULT_FORMATS,
    seeds: DEFAULT_SEEDS,
    reference: { assetSample: "", composeSample: "" },
    generationRules: "",
    ...overrides,
    reference: {
      assetSample: "",
      composeSample: "",
      ...(overrides.reference || {}),
    },
  }
}

export function createEmptyProductSettings(overrides = {}) {
  return {
    personas: [],
    insights: [],
    offers: [],
    angles: [],
    formats: [],
    seeds: [],
    reference: { assetSample: "", composeSample: "" },
    generationRules: "",
    ...overrides,
    reference: {
      assetSample: "",
      composeSample: "",
      ...(overrides.reference || {}),
    },
  }
}

export function legacyRootSettings(raw = {}) {
  return createDefaultProductSettings({
    personas: raw.personas?.length ? normalizePersonas(raw.personas) : DEFAULT_PERSONAS,
    insights: raw.insights?.length ? normalizeInsights(raw.insights) : DEFAULT_INSIGHTS,
    offers: raw.offers?.length ? raw.offers : DEFAULT_OFFERS,
    angles: raw.angles?.length ? normalizeAngles(raw.angles) : DEFAULT_ANGLES,
    formats: raw.formats?.length ? raw.formats : DEFAULT_FORMATS,
    seeds: raw.seeds?.length ? raw.seeds : DEFAULT_SEEDS,
    reference: raw.reference || { assetSample: "", composeSample: "" },
    generationRules: raw.generationRules ?? "",
  })
}

export function normalizeProductSettings(raw = {}) {
  const products = raw.products?.length ? raw.products : DEFAULT_PRODUCTS
  const existing = raw.productSettings || {}
  const fallback = legacyRootSettings(raw)
  const hasProductSettings = !!raw.productSettings

  const productSettings = Object.fromEntries(products.map((product, index) => {
    const source = existing[product.id]

    if (source) {
      return [product.id, createEmptyProductSettings({
        personas: Array.isArray(source.personas) ? normalizePersonas(source.personas) : [],
        insights: Array.isArray(source.insights) ? normalizeInsights(source.insights) : [],
        offers: Array.isArray(source.offers) ? source.offers : [],
        angles: Array.isArray(source.angles) ? normalizeAngles(source.angles) : [],
        formats: Array.isArray(source.formats) ? source.formats : [],
        seeds: Array.isArray(source.seeds) ? source.seeds : [],
        reference: source.reference || { assetSample: "", composeSample: "" },
        generationRules: source.generationRules ?? "",
      })]
    }

    if (!hasProductSettings && index === 0) {
      return [product.id, fallback]
    }

    return [product.id, createEmptyProductSettings()]
  }))

  return {
    ...raw,
    products,
    productSettings,
  }
}
