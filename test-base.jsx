import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { DEFAULT_PRODUCT_ID } from './defaults.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const BG = '#0e0e12'

const LAYERS = [
  { key: 'problem', label: 'Проблема', color: '#A2A2C0' },
  { key: 'persona', label: 'Персона',  color: '#5ECBDC' },
  { key: 'angle',   label: 'Кут',      color: '#E6C96A' },
  { key: 'insight', label: 'Інсайт',   color: '#7BC67A' },
  { key: 'offer',   label: 'Оффер',    color: '#5B6FD6' },
  { key: 'format',  label: 'Формат',   color: '#C084F5' },
]

const LAYER_MAP = Object.fromEntries(LAYERS.map(l => [l.key, l]))

const STATUS_COLOR = {
  idea:          '#E6C96A',
  in_production: '#5ECBDC',
  live:          '#7BC67A',
  killed:        '#44444A',
}
const STATUS_LABEL = {
  idea: 'Ідея', in_production: 'Продакшн', live: 'Лайв', killed: 'Killed',
}

// Радіуси за типом вузла
const R = { layer: 16, value: 7, creo: 4.5 }

function hexRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

// ─── Build graph ──────────────────────────────────────────────────────────────
// Structure:
//   layer:X  ──  val:X:VALUE  ──  creo:ID
//                               ╱
//   layer:Y  ──  val:Y:VALUE  ╱

function buildGraph(tests) {
  if (!tests.length) return { nodes: [], links: [], adj: new Map() }

  const nodeMap = new Map()
  const linkPairs = []   // [srcId, tgtId]
  const adj = new Map()  // id → Set<id>

  const addLink = (src, tgt) => {
    linkPairs.push([src, tgt])
    if (!adj.has(src)) adj.set(src, new Set())
    if (!adj.has(tgt)) adj.set(tgt, new Set())
    adj.get(src).add(tgt)
    adj.get(tgt).add(src)
  }

  // 1. Layer header nodes (one per variable)
  LAYERS.forEach(({ key, label, color }) => {
    nodeMap.set(`layer:${key}`, {
      id: `layer:${key}`, type: 'layer',
      layerKey: key, label, color,
    })
  })

  // 2. Unique value nodes per layer + connect to layer
  LAYERS.forEach(({ key }) => {
    const seen = new Set()
    tests.forEach(test => {
      const val = test[key]
      if (!val || seen.has(val)) return
      seen.add(val)
      const id = `val:${key}:${val}`
      nodeMap.set(id, {
        id, type: 'value',
        layerKey: key,
        label: val,
        color: LAYER_MAP[key].color,
      })
      addLink(`layer:${key}`, id)
    })
  })

  // 3. Creo nodes + connect to their values
  tests.forEach(test => {
    const id = `creo:${test.id}`
    nodeMap.set(id, {
      id, type: 'creo',
      label: test.hypothesisTag || '—',
      test,
      color: STATUS_COLOR[test.status] ?? '#888',
    })
    LAYERS.forEach(({ key }) => {
      const val = test[key]
      if (val) addLink(`val:${key}:${val}`, id)
    })
  })

  const links = linkPairs.map(([src, tgt]) => ({ source: src, target: tgt }))
  return { nodes: [...nodeMap.values()], links, adj }
}

// ─── Canvas draw ──────────────────────────────────────────────────────────────

function paintNode(node, ctx, globalScale, highlightIds, selectedCreoId) {
  const r     = R[node.type] ?? 5
  const color = node.color
  const rgb   = hexRgb(color)
  const lit   = !highlightIds || highlightIds.has(node.id)
  const alpha = lit ? 1 : 0.07

  if (!node.x && !node.y) return // not positioned yet

  // Glow halos (only for lit nodes)
  if (lit) {
    ctx.beginPath()
    ctx.arc(node.x, node.y, r * 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${rgb},0.04)`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(node.x, node.y, r * 2.2, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${rgb},0.1)`
    ctx.fill()
  }

  // Layer node: ring + hollow fill
  if (node.type === 'layer') {
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${rgb},${0.15 * alpha})`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.strokeStyle = `rgba(${rgb},${0.85 * alpha})`
    ctx.lineWidth = 2 / globalScale
    ctx.stroke()
  } else {
    // Value / Creo: solid dot
    if (node.type === 'creo' && selectedCreoId === node.test?.id) {
      // selection ring
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 2.5 / globalScale, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 1.5 / globalScale
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${rgb},${alpha})`
    ctx.fill()
  }

  // Labels
  if (node.type === 'layer' && lit) {
    const fs = Math.max(8, 13 / globalScale)
    ctx.font = `700 ${fs}px ui-sans-serif,system-ui,sans-serif`
    ctx.fillStyle = `rgba(${rgb},0.9)`
    ctx.textAlign = 'center'
    ctx.fillText(node.label, node.x, node.y + r + fs + 2 / globalScale)
  }

  if (node.type === 'value' && lit) {
    const fs = Math.max(7, 11 / globalScale)
    ctx.font = `500 ${fs}px ui-sans-serif,system-ui,sans-serif`
    ctx.fillStyle = `rgba(255,255,255,0.78)`
    ctx.textAlign = 'left'
    const lbl = node.label.length > 32 ? node.label.slice(0, 30) + '…' : node.label
    ctx.fillText(lbl, node.x + r + 3 / globalScale, node.y + fs * 0.38)
  }

  if (node.type === 'creo' && lit && globalScale > 1.4) {
    const fs = Math.max(6, 9 / globalScale)
    ctx.font = `${fs}px ui-monospace,Menlo,monospace`
    ctx.fillStyle = `rgba(255,255,255,0.55)`
    ctx.textAlign = 'left'
    ctx.fillText(node.label, node.x + r + 2 / globalScale, node.y + fs * 0.38)
  }
}

function paintPointer(node, color, ctx) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(node.x, node.y, R[node.type] ?? 5, 0, 2 * Math.PI)
  ctx.fill()
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ test, onClose }) {
  const sc = STATUS_COLOR[test.status] ?? '#888'
  const sl = STATUS_LABEL[test.status] ?? test.status
  const rows = [
    ['Що унікально',  test.uniqueDetails],
    ['Creative brief', test.brief?.one_liner || test.brief?.oneLine],
    ['Hook',          test.hookIdea],
    ['Tracking ID',   test.trackingId],
    ['Неймінг',       test.naming],
    ['Персона',       test.persona],
    ['Кут',           test.angle],
    ['Інсайт',        test.insight],
    ['Оффер',         test.offer],
    ['Формат',        test.format],
    ['Якість ТЗ',     test.productionBrief?.quality?.score],
    ['VO',            Array.isArray(test.productionBrief?.vo) ? test.productionBrief.vo.map(v => `${v.tc}: ${v.line}`).join('\n') : null],
    ['Дата',          new Date(test.date).toLocaleDateString('uk-UA')],
  ]

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: '#16161e', borderLeft: '1px solid #222230',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        padding: '13px 16px', borderBottom: '1px solid #222230',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#e0e0f0' }}>Крео</span>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#44445A', fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
      </div>

      <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: sc,
          background: sc + '22', padding: '3px 8px', borderRadius: 5,
          border: `1px solid ${sc}55`,
        }}>{sl}</span>

        <div style={{
          fontSize: 11, fontWeight: 600, color: '#7B8FFF',
          fontFamily: 'ui-monospace, Menlo, monospace',
          marginTop: 10, wordBreak: 'break-all', lineHeight: 1.4,
        }}>{test.hypothesisTag}</div>

        {rows.map(([label, val]) => !val ? null : (
          <div key={label} style={{ marginTop: 13 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#383848', letterSpacing: '.05em', marginBottom: 3 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontSize: 12.5, color: '#9090B0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TestBase({ selectedProductId = DEFAULT_PRODUCT_ID, selectedProduct }) {
  const [tests,     setTests]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)  // test object
  const [highlight, setHighlight] = useState(null)  // Set<id> | null

  const fgRef        = useRef(null)
  const containerRef = useRef(null)
  const [size, setSize] = useState({ w: 900, h: 600 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tests')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTests(await res.json())
    } catch {
      setTests([])
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const visibleTests = useMemo(() => tests.filter(test => {
    if (selectedProductId === DEFAULT_PRODUCT_ID) return !test.productId || test.productId === selectedProductId
    return test.productId === selectedProductId
  }), [tests, selectedProductId])

  const { nodes, links, adj } = useMemo(() => buildGraph(visibleTests), [visibleTests])

  // Custom forces: layer nodes repel strongly, values moderately
  useEffect(() => {
    const fg = fgRef.current
    if (!fg || !nodes.length) return
    fg.d3Force('charge').strength(node => {
      if (node.type === 'layer') return -600
      if (node.type === 'value') return -60
      return -20
    })
    fg.d3Force('link').distance(link => {
      const src = link.source
      const tgt = link.target
      if (src.type === 'layer' || tgt.type === 'layer') return 120
      if (src.type === 'value' || tgt.type === 'value') return 60
      return 40
    })
    setTimeout(() => fgRef.current?.zoomToFit(500, 80), 1200)
  }, [nodes])

  // Compute highlight set for a clicked node
  const getHighlight = useCallback((nodeId) => {
    const s = new Set([nodeId])
    adj.get(nodeId)?.forEach(id => {
      s.add(id)
      // For creo: also highlight the layer nodes (2 hops)
      const n = nodes.find(n => n.id === id)
      if (n?.type === 'value') adj.get(id)?.forEach(id2 => s.add(id2))
    })
    return s
  }, [adj, nodes])

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'creo') {
      setSelected(prev => prev?.id === node.test?.id ? null : node.test)
      setHighlight(getHighlight(node.id))
    } else {
      setSelected(null)
      setHighlight(prev => {
        const same = prev?.has(node.id) && prev.size === (getHighlight(node.id).size)
        return same ? null : getHighlight(node.id)
      })
    }
  }, [getHighlight])

  const handleBgClick = useCallback(() => {
    setSelected(null)
    setHighlight(null)
  }, [])

  const paintNodeCb = useCallback((node, ctx, gs) => {
    paintNode(node, ctx, gs, highlight, selected?.id)
  }, [highlight, selected])

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {loading ? (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#333348', fontSize: 14,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}>Завантаження…</div>
        ) : visibleTests.length === 0 ? (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}>
            <div style={{ fontSize: 32 }}>🌱</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#6060A0' }}>База порожня</div>
            <div style={{ fontSize: 13, color: '#333348' }}>Збережи перше крео для {selectedProduct?.name || 'цього продукту'}</div>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={{ nodes, links }}
            width={size.w}
            height={size.h}
            backgroundColor={BG}
            nodeCanvasObject={paintNodeCb}
            nodeCanvasObjectMode={() => 'replace'}
            nodePointerAreaPaint={paintPointer}
            linkColor={link => {
              const src = link.source
              const tgt = link.target
              if (!src?.type) return 'rgba(255,255,255,0.06)'
              if (src.type === 'layer' || tgt.type === 'layer') return 'rgba(255,255,255,0.08)'
              return 'rgba(255,255,255,0.12)'
            }}
            linkWidth={link => {
              const src = link.source
              if (!src?.type) return 0.5
              return src.type === 'layer' ? 0.5 : 0.8
            }}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBgClick}
            cooldownTicks={150}
            d3VelocityDecay={0.25}
            d3AlphaDecay={0.015}
            enableNodeDrag
            enableZoomInteraction
            enablePanInteraction
          />
        )}

        {/* Legend */}
        {visibleTests.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            display: 'flex', flexDirection: 'column', gap: 4,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#2a2a3e', letterSpacing: '.08em', marginBottom: 2 }}>ШАРИ</div>
            {LAYERS.map(({ key, label, color }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 9, height: 9, borderRadius: '50%',
                  border: `1.5px solid ${color}`,
                  boxShadow: `0 0 5px ${color}88`,
                }} />
                <span style={{ fontSize: 10.5, color: '#33334A' }}>{label}</span>
              </div>
            ))}
            <div style={{ fontSize: 9, fontWeight: 700, color: '#2a2a3e', letterSpacing: '.08em', marginTop: 6, marginBottom: 2 }}>СТАТУС</div>
            {Object.entries(STATUS_COLOR).map(([key, color]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 10, color: '#2a2a3a' }}>{STATUS_LABEL[key]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Refresh */}
        <button onClick={load} style={{
          position: 'absolute', top: 12, right: 12,
          background: '#1a1a24', border: '1px solid #252535',
          color: '#3a3a58', borderRadius: 8, padding: '6px 12px',
          fontSize: 12, cursor: 'pointer',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif', zIndex: 5,
        }}>↻ Оновити</button>

        {/* Hint */}
        {visibleTests.length > 0 && !highlight && !selected && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            fontSize: 11, color: '#2a2a3e',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            pointerEvents: 'none',
          }}>
            {selectedProduct?.name || 'Продукт'} · клік на вузол — підсвітить зв'язки · клік на крео — відкриє деталі
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel test={selected} onClose={() => { setSelected(null); setHighlight(null) }} />
      )}
    </div>
  )
}
