import React, { useEffect, useMemo, useState } from 'react'
import CreativeConstructor from './creative-constructor.jsx'
import TestBase from './test-base.jsx'
import SettingsPanel from './settings-panel.jsx'
import { DEFAULT_PRODUCT_ID, DEFAULT_PRODUCTS, normalizeProductSettings } from './defaults.js'
import creoGuruLogo from './creoguru_nav.svg'

const C = {
  bg: "#EFEAE5", panel: "#FFFFFF", border: "#E6DFD8", ink: "#171320",
  muted: "#827A91", ai: "#7C3AED", dark: "#18121F", orange: "#F97316",
}

const TABS = [
  { id: 'constructor', label: 'Конструктор' },
  { id: 'tests',       label: 'База тестів', badge: 'DEMO' },
  { id: 'settings',    label: 'Налаштування' },
]

function TestBaseDemo({ onOpenPreview }) {
  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      background: '#F7F3EF',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: 'min(720px, 100%)',
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: '42px 44px',
        boxShadow: '0 22px 54px rgba(23, 19, 32, 0.08)',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          background: C.ai + '18',
          color: C.ai,
          border: `1px solid ${C.ai}33`,
          padding: '7px 12px',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: '.08em',
          marginBottom: 18,
        }}>
          DEMO VERSION
        </div>
        <h1 style={{
          margin: 0,
          color: C.ink,
          fontSize: 34,
          lineHeight: 1.1,
          fontWeight: 950,
          letterSpacing: 0,
        }}>
          База тестів буде пізніше
        </h1>
        <p style={{
          margin: '14px auto 0',
          maxWidth: 540,
          color: C.muted,
          fontSize: 16,
          lineHeight: 1.6,
        }}>
          Зараз фокус продукту — покрокове створення креативного ТЗ. Модуль бази тестів залишений як запланована частина: тут буде історія концептів, статуси, зв'язки між персонами, кутами, інсайтами, форматами й результатами.
        </p>
        <p style={{
          margin: '18px auto 0',
          maxWidth: 520,
          color: C.ink,
          fontSize: 15,
          lineHeight: 1.55,
          fontWeight: 750,
        }}>
          Ось приклад, як могла би виглядати база тестів у майбутній версії.
        </p>
        <button
          onClick={onOpenPreview}
          style={{
            marginTop: 22,
            border: 'none',
            borderRadius: 12,
            background: C.ai,
            color: '#fff',
            padding: '13px 20px',
            fontSize: 15,
            fontWeight: 900,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 16px 30px rgba(124, 58, 237, 0.22)',
          }}
        >
          Подивитись демо бази тестів →
        </button>
      </div>
    </div>
  )
}

function TestBasePreview({ selectedProductId, selectedProduct, onClose }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        flexShrink: 0,
        minHeight: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 22px',
        background: '#F7F3EF',
        borderBottom: `1px solid ${C.border}`,
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{
            borderRadius: 999,
            background: C.ai + '18',
            color: C.ai,
            border: `1px solid ${C.ai}33`,
            padding: '5px 9px',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '.07em',
            flexShrink: 0,
          }}>
            DEMO PREVIEW
          </span>
          <span style={{ color: C.muted, fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Приклад майбутнього вигляду бази тестів
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            background: '#fff',
            color: C.ink,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 850,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          ← Назад до опису
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <TestBase
          selectedProductId={selectedProductId}
          selectedProduct={selectedProduct}
        />
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('constructor')
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [selectedProductId, setSelectedProductId] = useState(DEFAULT_PRODUCT_ID)
  const [testsPreviewOpen, setTestsPreviewOpen] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(raw => {
        const normalized = normalizeProductSettings(raw)
        setProducts(normalized.products)
        setSelectedProductId(cur =>
          normalized.products.find(p => p.id === cur) ? cur : normalized.products[0]?.id || DEFAULT_PRODUCT_ID
        )
      })
      .catch(() => {})
  }, [])

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId) || products[0] || DEFAULT_PRODUCTS[0],
    [products, selectedProductId]
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: C.bg,
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      padding: 0,
      boxSizing: 'border-box',
    }}>
      <div style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        margin: 0,
        background: C.panel,
        border: 'none',
        borderRadius: 0,
        boxShadow: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Tab bar */}
        <div style={{
          flexShrink: 0,
          background: C.dark,
          padding: '0 38px',
        }}>
          <div style={{ height: 76, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={creoGuruLogo}
                alt="CreoGuru"
                style={{
                  display: 'block',
                  width: 168,
                  height: 'auto',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
              {TABS.map(({ id, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0,
                    fontSize: 15,
                    fontWeight: tab === id ? 850 : 650,
                    color: tab === id ? '#fff' : '#93889F',
                    fontFamily: 'inherit',
                    transition: 'color .15s',
                  }}
                >
                  <span>{label}</span>
                  {badge && (
                    <span style={{
                      borderRadius: 999,
                      background: tab === id ? C.ai : 'rgba(255,255,255,.08)',
                      color: tab === id ? '#fff' : '#AFA6BD',
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '3px 6px',
                      letterSpacing: '.06em',
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  style={{
                    border: '1px solid rgba(255,255,255,.12)',
                    borderRadius: 10,
                    background: '#21182D',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    padding: '8px 12px',
                    fontFamily: 'inherit',
                    minWidth: 150,
                    outline: 'none',
                  }}
                >
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>
            <div style={{
              width: 33, height: 33, borderRadius: '50%',
              background: C.ai,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 850,
              fontSize: 14,
            }}>
              A
            </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          overflow: tab === 'tests' ? 'hidden' : 'auto',
          minHeight: 0,
          background: '#fff',
        }}>
          {tab === 'constructor' && (
            <CreativeConstructor
              selectedProductId={selectedProductId}
              selectedProduct={selectedProduct}
              products={products}
              onProductChange={setSelectedProductId}
            />
          )}
          {tab === 'tests' && (
            testsPreviewOpen ? (
              <TestBasePreview
                selectedProductId={selectedProductId}
                selectedProduct={selectedProduct}
                onClose={() => setTestsPreviewOpen(false)}
              />
            ) : (
              <TestBaseDemo onOpenPreview={() => setTestsPreviewOpen(true)} />
            )
          )}
          {tab === 'settings' && (
            <SettingsPanel
              selectedProductId={selectedProductId}
              selectedProduct={selectedProduct}
              products={products}
              onProductChange={setSelectedProductId}
              onProductsChange={setProducts}
            />
          )}
        </div>
      </div>
    </div>
  )
}
