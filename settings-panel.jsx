import React, { useState, useEffect } from 'react'
import {
  DEFAULT_PERSONAS, DEFAULT_INSIGHTS, DEFAULT_OFFERS,
  DEFAULT_ANGLES, DEFAULT_FORMATS,
  DEFAULT_PRODUCTS, DEFAULT_PRODUCT_ID,
  INSIGHT_TYPES,
  createDefaultProductSettings, createEmptyProductSettings, normalizeProductSettings,
} from './defaults.js'

const C = {
  bg: "#F7F3EF", panel: "#FFFFFF", border: "#E6DFEA", ink: "#171320",
  muted: "#7F768E", ok: "#16803C", okSoft: "#E8F7EE",
  ai: "#7C3AED", aiSoft: "#F1E8FF",
}

const FRAMING_OPTIONS = [
  'freeTrial', 'priceAnchor', 'costPerUse', 'bundle',
  'giftWithPurchase', 'tiered', 'subscription',
]
const AWARENESS_OPTIONS = ['cold', 'warm', 'hot']
const COST_OPTIONS = ['low', 'medium', 'high']

const SECTIONS = [
  {
    key: 'personas', label: 'Персони', color: '#7C3AED', bg: '#F1E8FF',
    fields: [
      { key: 'id',            label: 'ID',       type: 'text',     mono: true },
      { key: 'archetypeName', label: 'Архетип',  type: 'text' },
      { key: 'description',   label: 'Опис',     type: 'textarea' },
      { key: 'demoContext',   label: 'Демо',     type: 'text' },
      { key: 'tag',           label: 'TAG',      type: 'text',     mono: true },
    ],
    displayField: 'archetypeName',
    make: () => ({
      id: `persona_${Date.now()}`,
      archetypeName: '', name: '',
      description: '', demoContext: '', tag: '',
    }),
    // archetypeName → name sync
    onFieldUpdate: (item, key, val) =>
      key === 'archetypeName' ? { ...item, [key]: val, name: val } : { ...item, [key]: val },
  },
  {
    key: 'angles', label: 'Кути', color: '#B7791F', bg: '#FBEFD4',
    fields: [
      { key: 'name',        label: 'Назва', type: 'text' },
      { key: 'description', label: 'Опис',  type: 'textarea' },
    ],
    displayField: 'name',
    make: () => ({
      id: `angle_${Date.now()}`,
      name: '',
      description: '',
      tag: '',
    }),
  },
  {
    key: 'insights', label: 'Інсайти', color: '#16803C', bg: '#E8F7EE',
    fields: [
      { key: 'id',      label: 'ID (slug)',         type: 'text',     mono: true },
      { key: 'type',    label: 'Тип',               type: 'select',   options: INSIGHT_TYPES },
      { key: 'essence', label: 'Суть',              type: 'textarea' },
      { key: 'usage',   label: 'Як використати',    type: 'textarea' },
      { key: 'tag',     label: 'TAG',               type: 'text',     mono: true },
    ],
    displayField: 'essence',
    make: () => ({
      id: `insight_${Date.now()}`,
      type: 'інсайт',
      essence: '',
      usage: '',
      tag: '',
    }),
  },
  {
    key: 'offers', label: 'Оффери', color: '#7C3AED', bg: '#F1E8FF',
    fields: [
      { key: 'id',       label: 'ID (slug)',       type: 'text',   mono: true },
      { key: 'tag',      label: 'Тег',             type: 'text',   mono: true },
      { key: 'product',  label: 'Продукт',         type: 'text' },
      { key: 'framing',  label: 'Фреймінг',        type: 'select', options: FRAMING_OPTIONS },
      { key: 'valueProp',label: 'Value Prop',       type: 'textarea' },
      { key: 'label',    label: 'Display (select)', type: 'text' },
    ],
    displayField: 'label',
    make: () => ({ id: `offer_${Date.now()}`, tag: '', product: '', framing: 'freeTrial', valueProp: '', label: '' }),
  },
  {
    key: 'formats', label: 'Формати', color: '#7C3AED', bg: '#EDE9FE',
    fields: [
      { key: 'id',              label: 'ID (slug)',          type: 'text',   mono: true },
      { key: 'name',            label: 'Назва',              type: 'text' },
      { key: 'tag',             label: 'Тег',                type: 'text',   mono: true },
      { key: 'prod',            label: 'Продакшн',           type: 'select', options: ['AI-gen', 'office', 'screen (real)', 'static', 'dynamic', 'partnership'] },
      { key: 'awarenessFit',    label: 'Awareness (через кому)', type: 'tags' },
      { key: 'needsEducation',  label: 'Потребує едукейшн',  type: 'bool' },
      { key: 'productionCost',  label: 'Вартість продакшну', type: 'select', options: COST_OPTIONS },
      { key: 'coldScalable',    label: 'Масштаб на cold',    type: 'bool' },
      { key: 'note',            label: 'Нотатка',            type: 'text' },
    ],
    displayField: 'name',
    make: () => ({
      id: `format_${Date.now()}`, name: '', tag: '', prod: 'AI-gen',
      awarenessFit: ['cold'], needsEducation: false,
      productionCost: 'low', coldScalable: true, note: '',
    }),
  },
]

const DEFAULTS_MAP = {
  personas: DEFAULT_PERSONAS,
  insights: DEFAULT_INSIGHTS,
  offers:   DEFAULT_OFFERS,
  angles:   DEFAULT_ANGLES,
  formats:  DEFAULT_FORMATS,
}

const REFERENCE_KEY = 'reference'
const REFERENCE_COLOR = '#6B21A8'
const REFERENCE_BG = '#F3E8FF'
const RULES_KEY = 'rules'
const RULES_COLOR = '#0F766E'
const RULES_BG = '#CCFBF1'
const PRODUCTS_KEY = 'products'
const PRODUCTS_COLOR = '#F97316'
const PRODUCTS_BG = '#FFF1E7'

const PRODUCT_FIELDS = [
  { key: 'id',             label: 'ID (slug)',            type: 'text',     mono: true },
  { key: 'name',           label: 'Назва продукту',       type: 'text' },
  { key: 'tag',            label: 'Tracking tag',         type: 'text',     mono: true },
  { key: 'market',         label: 'Ринок',                type: 'text',     mono: true },
  { key: 'category',       label: 'Категорія',            type: 'text' },
  { key: 'audience',       label: 'Аудиторія продукту',   type: 'textarea' },
  { key: 'promise',        label: 'Product promise',      type: 'textarea' },
  { key: 'defaultProblem', label: 'Default problem tag',  type: 'text',     mono: true },
]

// ---- Field input ----

function FieldInput({ field, value, onChange }) {
  const base = {
    width: '100%', boxSizing: 'border-box',
    padding: '7px 9px',
    border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.ink, background: C.panel,
    fontFamily: field.mono ? 'ui-monospace, Menlo, monospace' : 'ui-sans-serif, system-ui, sans-serif',
  }

  if (field.type === 'textarea') return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      rows={3}
      style={{ ...base, resize: 'vertical', lineHeight: 1.45 }}
    />
  )

  if (field.type === 'select') return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} style={base}>
      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  // Array field — stored as array, edited as comma-separated string
  if (field.type === 'tags') return (
    <input
      type="text"
      value={Array.isArray(value) ? value.join(', ') : (value || '')}
      onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
      placeholder="значення через кому"
      style={base}
    />
  )

  // Boolean field — select true/false
  if (field.type === 'bool') return (
    <select value={value ? 'true' : 'false'} onChange={e => onChange(e.target.value === 'true')} style={base}>
      <option value="true">Так</option>
      <option value="false">Ні</option>
    </select>
  )

  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={base}
    />
  )
}

// ---- Item card ----

function ItemCard({ item, fields, color, onUpdate, onDelete, index }) {
  const hasTextarea = fields.some(f => f.type === 'textarea')
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.04em' }}>
          #{index + 1}
        </span>
        <button
          onClick={onDelete}
          title="Видалити"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: '0 2px',
          }}
        >×</button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: hasTextarea ? '1fr 1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {fields.map(f => (
          <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto' }}>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 700,
              color: C.muted, letterSpacing: '.05em', marginBottom: 4,
            }}>
              {f.label.toUpperCase()}
            </label>
            <FieldInput
              field={f}
              value={item[f.key]}
              onChange={val => onUpdate(f.key, val)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Main ----

export default function SettingsPanel({
  selectedProductId = DEFAULT_PRODUCT_ID,
  products = DEFAULT_PRODUCTS,
  onProductChange,
  onProductsChange,
}) {
  const [draft, setDraft] = useState(null)
  const [activeKey, setActiveKey] = useState('personas')
  const [status, setStatus] = useState(null) // null | 'saving' | 'saved' | 'error'

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(raw => {
        const normalized = normalizeProductSettings(raw)
        setDraft(normalized)
        onProductsChange?.(normalized.products)
        if (!normalized.products.find(p => p.id === selectedProductId)) {
          onProductChange?.(normalized.products[0]?.id || DEFAULT_PRODUCT_ID)
        }
      })
      .catch(() => {
        const fallback = normalizeProductSettings({
          products,
          productSettings: {
            [selectedProductId]: createDefaultProductSettings(),
          },
        })
        setDraft(fallback)
      })
  }, [])

  useEffect(() => {
    if (draft?.products?.length) onProductsChange?.(draft.products)
  }, [draft?.products])

  const activeProductId =
    draft?.products.find(p => p.id === selectedProductId)?.id ||
    draft?.products[0]?.id ||
    DEFAULT_PRODUCT_ID

  const activeProduct = draft?.products.find(p => p.id === activeProductId) || DEFAULT_PRODUCTS[0]
  const activeSettings = draft?.productSettings?.[activeProductId] || createEmptyProductSettings()

  const updateProductSettings = updater => {
    setDraft(d => {
      const productId = d.products.find(p => p.id === activeProductId)?.id || d.products[0]?.id || DEFAULT_PRODUCT_ID
      const current = d.productSettings?.[productId] || createDefaultProductSettings()
      const next = typeof updater === 'function' ? updater(current) : updater
      return {
        ...d,
        productSettings: {
          ...(d.productSettings || {}),
          [productId]: next,
        },
      }
    })
    setStatus(null)
  }

  const updateItem = (section, idx, field, val) => {
    const cfg = SECTIONS.find(s => s.key === section)
    updateProductSettings(current => ({
      ...current,
      [section]: current[section].map((item, i) => {
        if (i !== idx) return item
        return cfg.onFieldUpdate ? cfg.onFieldUpdate(item, field, val) : { ...item, [field]: val }
      }),
    }))
  }

  const addItem = section => {
    const cfg = SECTIONS.find(s => s.key === section)
    updateProductSettings(current => ({ ...current, [section]: [...current[section], cfg.make()] }))
  }

  const deleteItem = (section, idx) => {
    updateProductSettings(current => ({ ...current, [section]: current[section].filter((_, i) => i !== idx) }))
  }

  const resetSection = section => {
    updateProductSettings(current => ({ ...current, [section]: DEFAULTS_MAP[section] }))
  }

  const updateReference = (field, val) => {
    updateProductSettings(current => ({ ...current, reference: { ...current.reference, [field]: val } }))
  }

  const updateGenerationRules = val => {
    updateProductSettings(current => ({ ...current, generationRules: val }))
  }

  const updateProduct = (idx, field, val) => {
    setDraft(d => {
      const oldProduct = d.products[idx]
      const nextProducts = d.products.map((product, i) => i === idx ? { ...product, [field]: val } : product)
      let nextProductSettings = d.productSettings || {}

      if (field === 'id' && oldProduct?.id && val && oldProduct.id !== val) {
        const existing = nextProductSettings[oldProduct.id] || createDefaultProductSettings()
        nextProductSettings = { ...nextProductSettings, [val]: existing }
        delete nextProductSettings[oldProduct.id]
        if (selectedProductId === oldProduct.id) onProductChange?.(val)
      }

      return { ...d, products: nextProducts, productSettings: nextProductSettings }
    })
    setStatus(null)
  }

  const addProduct = () => {
    const id = `product_${Date.now()}`
    const newProduct = {
      id,
      name: 'Новий продукт',
      tag: 'PRD',
      market: activeProduct.market || 'US',
      category: '',
      audience: '',
      promise: '',
      defaultProblem: activeProduct.defaultProblem || 'main_problem',
    }

    setDraft(d => ({
      ...d,
      products: [...d.products, newProduct],
      productSettings: {
        ...(d.productSettings || {}),
        [id]: createEmptyProductSettings(),
      },
    }))
    onProductChange?.(id)
    setActiveKey(PRODUCTS_KEY)
    setStatus(null)
  }

  const deleteProduct = idx => {
    setDraft(d => {
      if (d.products.length <= 1) return d
      const removed = d.products[idx]
      const nextProducts = d.products.filter((_, i) => i !== idx)
      const nextProductSettings = { ...(d.productSettings || {}) }
      delete nextProductSettings[removed.id]
      if (selectedProductId === removed.id) onProductChange?.(nextProducts[0]?.id || DEFAULT_PRODUCT_ID)
      return { ...d, products: nextProducts, productSettings: nextProductSettings }
    })
    setStatus(null)
  }

  const save = async () => {
    setStatus('saving')
    try {
      const normalized = normalizeProductSettings(draft)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDraft(normalized)
      onProductsChange?.(normalized.products)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  if (!draft) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: C.muted, fontSize: 14,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    }}>
      Завантаження…
    </div>
  )

  const activeSec = SECTIONS.find(s => s.key === activeKey) || SECTIONS[0]
  const items = activeSettings[activeKey] || []

  return (
    <div style={{
      display: 'flex', height: '100%',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    }}>

      {/* Sidebar */}
      <div style={{
        width: 190, flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
        background: C.panel,
        paddingTop: 12,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 14px 10px', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.06em' }}>
          ПРОДУКТ
        </div>
        <div style={{ padding: '0 12px 12px' }}>
          <select
            value={activeProductId}
            onChange={e => onProductChange?.(e.target.value)}
            style={{
              width: '100%',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: '#FFFEFC',
              color: C.ink,
              fontSize: 13,
              fontWeight: 700,
              padding: '8px 9px',
              fontFamily: 'inherit',
            }}
          >
            {draft.products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setActiveKey(PRODUCTS_KEY)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', textAlign: 'left',
            padding: '9px 14px 9px 12px',
            border: 'none', borderLeft: `3px solid ${activeKey === PRODUCTS_KEY ? PRODUCTS_COLOR : 'transparent'}`,
            background: activeKey === PRODUCTS_KEY ? PRODUCTS_BG : 'transparent',
            color: activeKey === PRODUCTS_KEY ? PRODUCTS_COLOR : C.muted,
            fontWeight: activeKey === PRODUCTS_KEY ? 600 : 400,
            fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <span>Продукти</span>
          <span style={{
            fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: 'center',
            background: activeKey === PRODUCTS_KEY ? PRODUCTS_COLOR : C.border,
            color: activeKey === PRODUCTS_KEY ? '#fff' : C.muted,
            borderRadius: 10, padding: '1px 6px',
          }}>
            {draft.products.length}
          </span>
        </button>

        <div style={{ padding: '14px 14px 10px', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.06em' }}>
          СПИСКИ
        </div>
        {SECTIONS.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActiveKey(sec.key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', textAlign: 'left',
              padding: '9px 14px 9px 12px',
              border: 'none', borderLeft: `3px solid ${activeKey === sec.key ? sec.color : 'transparent'}`,
              background: activeKey === sec.key ? sec.bg : 'transparent',
              color: activeKey === sec.key ? sec.color : C.muted,
              fontWeight: activeKey === sec.key ? 600 : 400,
              fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <span>{sec.label}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: 'center',
              background: activeKey === sec.key ? sec.color : C.border,
              color: activeKey === sec.key ? '#fff' : C.muted,
              borderRadius: 10, padding: '1px 6px',
            }}>
              {activeSettings[sec.key]?.length || 0}
            </span>
          </button>
        ))}

        <div style={{ padding: '14px 14px 6px', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.06em' }}>
          ЗАГАЛЬНЕ
        </div>
        <button
          onClick={() => setActiveKey(REFERENCE_KEY)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 14px 9px 12px',
            border: 'none', borderLeft: `3px solid ${activeKey === REFERENCE_KEY ? REFERENCE_COLOR : 'transparent'}`,
            background: activeKey === REFERENCE_KEY ? REFERENCE_BG : 'transparent',
            color: activeKey === REFERENCE_KEY ? REFERENCE_COLOR : C.muted,
            fontWeight: activeKey === REFERENCE_KEY ? 600 : 400,
            fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Референс
        </button>
        <button
          onClick={() => setActiveKey(RULES_KEY)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 14px 9px 12px',
            border: 'none', borderLeft: `3px solid ${activeKey === RULES_KEY ? RULES_COLOR : 'transparent'}`,
            background: activeKey === RULES_KEY ? RULES_BG : 'transparent',
            color: activeKey === RULES_KEY ? RULES_COLOR : C.muted,
            fontWeight: activeKey === RULES_KEY ? 600 : 400,
            fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Правила генерації
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: C.bg }}>

        {activeKey === PRODUCTS_KEY ? (
          <>
            <div style={{
              flexShrink: 0, padding: '12px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: C.panel,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Продукти</span>
                <span style={{ fontSize: 13, color: C.muted }}>{draft.products.length} записів</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {status === 'saved' && <span style={{ fontSize: 13, color: C.ok }}>✓ Збережено</span>}
                {status === 'error' && <span style={{ fontSize: 13, color: '#B91C1C' }}>Помилка збереження</span>}
                <button
                  onClick={addProduct}
                  style={{
                    background: PRODUCTS_BG, border: `1px solid ${PRODUCTS_COLOR}`,
                    color: PRODUCTS_COLOR, borderRadius: 7,
                    padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  + Додати продукт
                </button>
                <button onClick={save} disabled={status === 'saving'}
                  style={{
                    background: PRODUCTS_COLOR, border: 'none', color: '#fff',
                    borderRadius: 7, padding: '6px 16px', fontSize: 13, fontWeight: 600,
                    cursor: status === 'saving' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: status === 'saving' ? .7 : 1,
                  }}>
                  {status === 'saving' ? 'Збереження…' : 'Зберегти всі зміни'}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {draft.products.map((product, idx) => (
                <ItemCard
                  key={product.id || idx}
                  index={idx}
                  item={product}
                  fields={PRODUCT_FIELDS}
                  color={PRODUCTS_COLOR}
                  onUpdate={(field, val) => updateProduct(idx, field, val)}
                  onDelete={() => deleteProduct(idx)}
                />
              ))}
              {draft.products.length <= 1 && (
                <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0' }}>
                  Мінімум один продукт має залишатися в системі.
                </p>
              )}
            </div>
          </>
        ) : activeKey === RULES_KEY ? (
          <>
            <div style={{
              flexShrink: 0, padding: '12px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: C.panel,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Правила генерації · {activeProduct.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {status === 'saved' && <span style={{ fontSize: 13, color: C.ok }}>✓ Збережено</span>}
                {status === 'error' && <span style={{ fontSize: 13, color: '#B91C1C' }}>Помилка збереження</span>}
                <button onClick={save} disabled={status === 'saving'}
                  style={{
                    background: RULES_COLOR, border: 'none', color: '#fff',
                    borderRadius: 7, padding: '6px 16px', fontSize: 13, fontWeight: 600,
                    cursor: status === 'saving' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: status === 'saving' ? .7 : 1,
                  }}>
                  {status === 'saving' ? 'Збереження…' : 'Зберегти'}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
                Ці правила підмішуються в кожен промпт генерації — ассет/композ, правку, перевірку логіки і батарею хуків.
                Пиши по одному правилу на рядок. Якщо поле порожнє — нічого не додається.
              </p>
              <textarea
                value={activeSettings.generationRules || ''}
                onChange={e => updateGenerationRules(e.target.value)}
                rows={16}
                placeholder={'- має бути чергування кадрів: крупні плани + далекі\n- обов\'язковий логотип AI-генерації\n- субтитри на кожній сцені\n- CTA в останні 3 секунди'}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  fontSize: 13.5, color: C.ink, fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                  resize: 'vertical', lineHeight: 1.6,
                }}
              />
            </div>
          </>
        ) : activeKey === REFERENCE_KEY ? (
          <>
            {/* Reference toolbar */}
            <div style={{
              flexShrink: 0, padding: '12px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: C.panel,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Референс · {activeProduct.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {status === 'saved' && <span style={{ fontSize: 13, color: C.ok }}>✓ Збережено</span>}
                {status === 'error' && <span style={{ fontSize: 13, color: '#B91C1C' }}>Помилка збереження</span>}
                <button onClick={save} disabled={status === 'saving'}
                  style={{
                    background: REFERENCE_COLOR, border: 'none', color: '#fff',
                    borderRadius: 7, padding: '6px 16px', fontSize: 13, fontWeight: 600,
                    cursor: status === 'saving' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: status === 'saving' ? .7 : 1,
                  }}>
                  {status === 'saving' ? 'Збереження…' : 'Зберегти'}
                </button>
              </div>
            </div>

            {/* Reference form */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
                Зразок ассету і композу — AI буде орієнтуватися на цей формат при кожній генерації.
                Заповни вручну, взявши за основу найкращий існуючий крео.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.05em', marginBottom: 6 }}>
                  ЗРАЗОК АССЕТ
                </label>
                <textarea
                  value={activeSettings.reference?.assetSample || ''}
                  onChange={e => updateReference('assetSample', e.target.value)}
                  rows={8}
                  placeholder="Опиши ідеальний ассет: що відбувається в кадрі, які сцени, хронометраж, персонаж, поведінка…"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    fontSize: 13.5, color: C.ink, fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    resize: 'vertical', lineHeight: 1.55,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.05em', marginBottom: 6 }}>
                  ЗРАЗОК КОМПОЗ
                </label>
                <textarea
                  value={activeSettings.reference?.composeSample || ''}
                  onChange={e => updateReference('composeSample', e.target.value)}
                  rows={8}
                  placeholder="Опиши ідеальний композ: монтаж, субтитри, звуки, музика, лого, CTA, таймінг…"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    fontSize: 13.5, color: C.ink, fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    resize: 'vertical', lineHeight: 1.55,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* List toolbar */}
            <div style={{
              flexShrink: 0, padding: '12px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: C.panel,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{activeSec.label} · {activeProduct.name}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{items.length} записів</span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {status === 'saved' && (
                  <span style={{ fontSize: 13, color: C.ok }}>✓ Збережено</span>
                )}
                {status === 'error' && (
                  <span style={{ fontSize: 13, color: '#B91C1C' }}>Помилка збереження</span>
                )}

                <button
                  onClick={() => resetSection(activeKey)}
                  title="Скинути до дефолтних значень"
                  style={{
                    background: 'none', border: `1px solid ${C.border}`, borderRadius: 7,
                    padding: '6px 12px', fontSize: 12.5, color: C.muted, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {items.length === 0 ? 'Заповнити дефолтами' : 'Скинути до дефолту'}
                </button>

                <button
                  onClick={() => addItem(activeKey)}
                  style={{
                    background: activeSec.bg, border: `1px solid ${activeSec.color}`,
                    color: activeSec.color, borderRadius: 7,
                    padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  + Додати
                </button>

                <button
                  onClick={save}
                  disabled={status === 'saving'}
                  style={{
                    background: activeSec.color, border: 'none', color: '#fff',
                    borderRadius: 7, padding: '6px 16px', fontSize: 13, fontWeight: 600,
                    cursor: status === 'saving' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: status === 'saving' ? .7 : 1,
                  }}
                >
                  {status === 'saving' ? 'Збереження…' : 'Зберегти всі зміни'}
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {items.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: 200, color: C.muted, gap: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Список порожній для {activeProduct.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, maxWidth: 420, textAlign: 'center' }}>
                    Це окремі налаштування продукту. Вони не копіюються з KeepClean автоматично.
                  </div>
                  <button
                    onClick={() => addItem(activeKey)}
                    style={{
                      background: activeSec.bg, border: `1px solid ${activeSec.color}`,
                      color: activeSec.color, borderRadius: 7, padding: '7px 16px',
                      fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    }}
                  >
                    + Додати перший запис
                  </button>
                  <button
                    onClick={() => resetSection(activeKey)}
                    style={{
                      background: 'none', border: `1px solid ${C.border}`,
                      color: C.muted, borderRadius: 7, padding: '7px 16px',
                      fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    }}
                  >
                    Заповнити системними дефолтами
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <ItemCard
                    key={item.id || idx}
                    index={idx}
                    item={item}
                    fields={activeSec.fields}
                    color={activeSec.color}
                    onUpdate={(field, val) => updateItem(activeKey, idx, field, val)}
                    onDelete={() => deleteItem(activeKey, idx)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
