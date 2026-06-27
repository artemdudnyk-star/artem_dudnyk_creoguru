import React, { useState, useEffect, useMemo } from "react";
import {
  DEFAULT_PERSONAS, DEFAULT_INSIGHTS, DEFAULT_OFFERS,
  DEFAULT_ANGLES, DEFAULT_FORMATS,
  DEFAULT_PRODUCTS, normalizeProductSettings,
} from "./defaults.js";
import creoGuruLogo from "./creoguru_hero.svg";

const C = {
  bg: "#FFFFFF", surface: "#F7F3EF", panel: "#FFFFFF", softPanel: "#F9F7F5",
  border: "#E6DFEA", borderStrong: "#D8CDED", ink: "#171320",
  muted: "#7F768E", human: "#7C3AED", humanSoft: "#F1E8FF",
  ai: "#7C3AED", aiSoft: "#F1E8FF", ok: "#16803C", okSoft: "#E8F7EE",
  warn: "#B45309", warnSoft: "#FFF4D6", fail: "#C62828", failSoft: "#FDECEC",
  orange: "#F97316", orangeSoft: "#FFF1E7", dark: "#18121F",
};

const TACTIC_LABELS = {
  problemAgitation:                  "Problem Agitation",
  contrarianTruth:                   "Contrarian Truth",
  socialProof:                       "Social Proof",
  curiosityGap:                      "Curiosity Gap",
  objectionHandling:                 "Objection Handling",
  transformation:                    "Before → After",
  "Problem Agitation":              "Problem Agitation",
  "Contrarian Truth":               "Contrarian Truth",
  "Social Proof / Authority":       "Social Proof",
  "Curiosity Gap":                  "Curiosity Gap",
  "Objection Handling":             "Objection Handling",
  "Before-After Transformation":    "Before → After",
  "Psychological Confrontation":    "Psych Confrontation",
  "Sensory / ASMR":                 "Sensory / ASMR",
  "Humor-Relief":                   "Humor",
  "Dignity / Independence":         "Dignity",
};
const TACTIC_COLORS = {
  problemAgitation:               "#E6A817",
  contrarianTruth:                "#0E8FA8",
  socialProof:                    "#2F7D4F",
  curiosityGap:                   "#8B5CF6",
  objectionHandling:              "#E05A2B",
  transformation:                 "#5B4FD6",
  "Problem Agitation":           "#E6A817",
  "Contrarian Truth":            "#0E8FA8",
  "Social Proof / Authority":    "#2F7D4F",
  "Curiosity Gap":               "#8B5CF6",
  "Objection Handling":          "#E05A2B",
  "Before-After Transformation": "#5B4FD6",
  "Psychological Confrontation": "#B7791F",
  "Sensory / ASMR":             "#0E8FA8",
  "Humor-Relief":                "#2F7D4F",
  "Dignity / Independence":      "#5B4FD6",
};


function slugify(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 12);
}

// ─── Pure logic ───────────────────────────────────────────────────────────────

function validatePersona(p) {
  if (!p) return [];
  const issues = [];
  const description = p.description || p.problem || "";
  if (!description.trim()) {
    issues.push("Відсутнє поле «ОПИС» — персона не має опису ситуації та поведінки");
    return issues;
  }
  const combined = `${p.name || ""} ${description}`.toLowerCase();
  if (/\b\d{2}[-–]\d{2}\b/.test(combined))
    issues.push("Віковий діапазон краще тримати в полі «Демо», а не в описі архетипу");
  if (/busy professional/i.test(combined))
    issues.push("«Busy professional» — шаблон без конкретного болю");
  if (!p.tag)
    issues.push("Відсутній TAG — буде важче трекати креативи");
  return issues;
}

function getPersonaDescription(persona) {
  return persona?.description || persona?.problem || "";
}

function getPersonaDemo(persona) {
  return persona?.demoContext || "";
}

function getInsightEssence(insight) {
  return insight?.essence || insight?.label || "";
}

function getInsightUsage(insight) {
  return insight?.usage || insight?.howToUse || insight?.use || "";
}

function getAngleDescription(angle) {
  return angle?.description || angle?.argument || angle?.painLed || angle?.what || "";
}

function wordsCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function compactCode(value, fallback = "X", max = 12) {
  const compact = slugify(value || fallback).replace(/_/g, "").toUpperCase().slice(0, max);
  return compact || fallback;
}

function getFormatCode(format) {
  const raw = format?.tag || format?.name || format?.prod || "FMT";
  const prod = String(format?.prod || "").toLowerCase();
  if (prod.includes("ai")) return "AIUGC";
  if (prod.includes("static")) return "STATIC";
  if (prod.includes("screen")) return "SCREEN";
  return compactCode(raw, "FMT", 10);
}

function scoreHook(hook) {
  const scores = { ...hook.scores };
  const total = hook.total ?? Object.values(scores).reduce((s, v) => s + v, 0);
  const hasZero = Object.values(scores).some(v => v === 0);
  const pass = hook.verdict ? hook.verdict === "PASS" : (total >= 7 && !hasZero);
  return { scores, total, pass };
}

function buildTrackingId(product, persona, angle, hypothesisTag, format, problem, hookIdea, duration = 28) {
  return [
    compactCode(product?.tag || product?.name, "PRD", 4),
    compactCode(product?.market, "US", 4),
    compactCode(persona?.tag || persona?.id, "AUD", 8),
    compactCode(angle?.tag || angle?.id || angle?.name, "ANGLE", 8),
    compactCode(hypothesisTag || "concept", "CONCEPT", 12),
    getFormatCode(format),
    `${duration || 28}S`,
    compactCode(hookIdea || "hook", "HOOK", 8),
    "v01",
    compactCode(problem || "tag", "TAG", 12),
  ].join("_");
}

function getResultTrackingId(result, fallback = "") {
  return result?.naming?.tracking_id || result?.header?.tracking_id || fallback;
}

function getResultHypothesisTag(result, seed = "") {
  const tracking = getResultTrackingId(result, "");
  if (tracking) {
    const parts = tracking.split("_");
    if (parts[4]) return parts[4].toLowerCase();
  }
  return slugify(result?.header?.one_liner || seed || "concept").slice(0, 20) || "concept";
}

function normalizeGeneratedBrief(result = {}, fallbackTrackingId = "") {
  const header = result.header || result.brief || {};
  const quality = result.quality || {};
  const naming = result.naming || {};
  const tracking = naming.tracking_id || header.tracking_id || fallbackTrackingId;

  return {
    ...result,
    header: {
      tracking_id: tracking,
      one_liner: header.one_liner || header.oneLine || result.adaptation || "",
      audience: header.audience || "",
      angle: header.angle || "",
      emotional_job: header.emotional_job || header.emotionalJob || "",
      format: header.format || "",
      duration_s: Number(header.duration_s || header.duration || 28),
      hook_0_3s: header.hook_0_3s || result.productionBrief?.hook3s || "",
    },
    quality: {
      score: quality.score || "",
      checklist: Array.isArray(quality.checklist) ? quality.checklist : [],
    },
    asset: Array.isArray(result.asset) ? result.asset : [],
    compose: Array.isArray(result.compose) ? result.compose : [],
    vo: Array.isArray(result.vo) ? result.vo : [],
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    pressure_test: Array.isArray(result.pressure_test) ? result.pressure_test : (Array.isArray(result.weakSpots) ? result.weakSpots : []),
    refs: {
      music_ref: result.refs?.music_ref ?? null,
      hook_ref: result.refs?.hook_ref ?? null,
      ugc_realism: Boolean(result.refs?.ugc_realism),
    },
    naming: {
      tracking_id: tracking,
      ab_suffixes: Array.isArray(naming.ab_suffixes) ? naming.ab_suffixes : [],
    },
  };
}

function briefToValidationText(item) {
  return Object.entries(item || {}).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : value}`).join(" ");
}

function validateGeneratedBrief(result, { isAI = false } = {}) {
  const issues = [];
  const asset = Array.isArray(result?.asset) ? result.asset : [];
  const compose = Array.isArray(result?.compose) ? result.compose : [];
  const composeText = compose.map(briefToValidationText).join(" ").toLowerCase();
  const tracking = getResultTrackingId(result, "");

  if (!asset.length) issues.push("ASSET має бути масивом із таймкодами.");
  if (!compose.length) issues.push("COMPOSE має бути масивом із таймкодами.");
  if (asset.length && compose.length && asset.length !== compose.length) issues.push("ASSET і COMPOSE мають мати однакову кількість беатів.");

  asset.forEach((beat, index) => {
    const screen = String(beat.screen || "").toLowerCase();
    const screenOk = screen.includes("green") || screen.includes("грін") || screen.includes("placeholder") || screen.includes("плейс") || screen.includes("нема ui") || screen.includes("немає ui") || screen.includes("no ui");
    if (!beat.tc) issues.push(`ASSET beat ${index + 1}: немає tc.`);
    if (!screenOk) issues.push(`ASSET beat ${index + 1}: screen має бути green-screen / placeholder / нема UI.`);
  });

  const min = Math.min(asset.length, compose.length);
  for (let i = 0; i < min; i += 1) {
    if (asset[i]?.tc !== compose[i]?.tc) issues.push(`Таймкод ASSET/COMPOSE не збігається в beat ${i + 1}.`);
  }

  compose.forEach((beat, index) => {
    if (!beat.tc) issues.push(`COMPOSE beat ${index + 1}: немає tc.`);
    if (!String(beat.subs || "").trim()) issues.push(`COMPOSE beat ${index + 1}: subs обов'язкові.`);
  });

  const voLines = Array.isArray(result?.vo) ? result.vo : [];
  voLines.forEach((line, index) => {
    if (!line.tc || !line.line) issues.push(`VO line ${index + 1}: потрібні tc і line.`);
    if (wordsCount(line.line) > 14) issues.push(`VO line ${index + 1}: репліка задовга, треба до ~12 слів.`);
  });

  const lastCompose = compose[compose.length - 1] || {};
  const lastBrand = String(lastCompose.brand || "").toLowerCase();
  if (!lastBrand || !(lastBrand.includes("лого") || lastBrand.includes("logo")) || !(lastBrand.includes("app store") || lastBrand.includes("google play") || lastBrand.includes("стор"))) {
    issues.push("CTA beat має містити brand: лого + пекшот + App Store / Google Play.");
  }

  if (isAI && !composeText.includes("ai generated")) {
    issues.push("AI-формат має містити наскрізний дисклеймер 'AI Generated' у COMPOSE.");
  }

  const trackingRegex = /^[A-Z0-9]+_[A-Z0-9]+_[A-Z0-9]+_[A-Z0-9]+_[A-Z0-9]+_[A-Z0-9]+_\d+S_[A-Z0-9]+_v\d{2}_[A-Z0-9]+$/;
  if (!trackingRegex.test(String(tracking || ""))) {
    issues.push("tracking_id не відповідає формату PROD_GEO_AUD_ANGLE_CONCEPT_FORMAT_LEN_HOOK_vNN_TAG.");
  }

  const allCopy = `${briefToValidationText(result?.header)} ${asset.map(briefToValidationText).join(" ")} ${compose.map(briefToValidationText).join(" ")}`.toLowerCase();
  if (/(stupid|dumb|old people|boomers are|пенсіонери не|старі люди не)/.test(allCopy)) {
    issues.push("Біль має цілитись у ситуацію/продукт, не в людину.");
  }

  return issues;
}

// Escapes unescaped double quotes inside JSON string values using a state machine.
// Handles cases where LLM writes: "copy": "She said "hello" today"
function repairJsonQuotes(text) {
  let result = "";
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && inString) {
      result += ch + (text[i + 1] || "");
      i += 2;
      continue;
    }
    if (ch === '"') {
      if (!inString) {
        inString = true;
        result += ch;
      } else {
        let j = i + 1;
        while (j < text.length && /\s/.test(text[j])) j++;
        const next = text[j];
        if (!next || next === ":" || next === "," || next === "}" || next === "]") {
          inString = false;
          result += ch;
        } else {
          result += '\\"';
        }
      }
    } else {
      result += ch;
    }
    i++;
  }
  return result;
}

function stripModelJson(text) {
  let cleaned = (text || "").trim();
  cleaned = cleaned.replace(/```[a-z]*/gi, "").replace(/```/g, "").trim();

  const starts = [cleaned.indexOf("{"), cleaned.indexOf("[")].filter(i => i >= 0);
  const start = starts.length ? Math.min(...starts) : -1;
  if (start < 0) return cleaned;

  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
    } else if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      const open = stack[stack.length - 1];
      if ((open === "{" && ch === "}") || (open === "[" && ch === "]")) stack.pop();
      if (!stack.length) return cleaned.slice(start, i + 1);
    }
  }
  return cleaned.slice(start);
}

function escapeControlCharsInStrings(text) {
  let result = "";
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (inString) {
      if (escaped) {
        result += ch;
        escaped = false;
      } else if (ch === "\\") {
        result += ch;
        escaped = true;
      } else if (ch === "\"") {
        result += ch;
        inString = false;
      } else if (ch === "\n" || ch === "\r") {
        result += "\\n";
      } else if (ch === "\t") {
        result += "\\t";
      } else {
        result += ch;
      }
    } else {
      result += ch;
      if (ch === "\"") inString = true;
    }
  }
  return result;
}

function parseModelJson(rawText) {
  const candidate = stripModelJson(rawText);
  if (!candidate) throw new Error("Порожня відповідь від API");

  const applyFixes = (s) => s
    .replace(/^\uFEFF/, "")
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/\\([^"\\\/bfnrtu\n\r])/g, "$1");

  const variants = [
    candidate,
    escapeControlCharsInStrings(candidate),
    repairJsonQuotes(candidate),
    escapeControlCharsInStrings(repairJsonQuotes(candidate)),
  ].map(applyFixes);

  let lastError = null;
  for (const variant of variants) {
    try {
      return JSON.parse(variant);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Не вдалося розпарсити JSON");
}

async function fetchLLMText(prompt, maxTokens = 1200) {
  const res = await fetch("/api/adapt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || data?.error || `HTTP ${res.status}`);
  if (!data) throw new Error("API повернув невалідний JSON");
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return {
    text: (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim(),
    stopReason: data.stop_reason || "",
  };
}

async function repairJsonWithLLM(brokenText, parseError, maxTokens) {
  const repairPrompt = `Repair this malformed JSON into valid JSON.
Rules:
- Return ONLY valid JSON. No markdown, no comments.
- Preserve the original meaning and keys.
- Escape all inner double quotes inside string values.
- Replace raw line breaks inside string values with \\n.
- If the JSON was truncated, close the current string/object/array as safely as possible.

Parse error: ${parseError.message}

MALFORMED JSON:
${stripModelJson(brokenText).slice(0, 18000)}`;
  const repaired = await fetchLLMText(repairPrompt, Math.min(Math.max(maxTokens, 2500), 6000));
  return parseModelJson(repaired.text);
}

async function callLLM(prompt, maxTokens = 1200) {
  const parseOrRepair = async ({ text, stopReason }) => {
    try {
      return parseModelJson(text);
    } catch (parseError) {
      if (stopReason === "max_tokens") throw parseError;
      return repairJsonWithLLM(text, parseError, maxTokens);
    }
  };

  try {
    const first = await fetchLLMText(prompt, maxTokens);
    try {
      return await parseOrRepair(first);
    } catch (firstError) {
      if (first.stopReason === "max_tokens") {
        const retryPrompt = `${prompt}

IMPORTANT RETRY:
Your previous answer was cut off. Return a compact, minified JSON object only.
Use the new contract: header, quality, asset[], compose[], vo[], strengths[], pressure_test[], refs, naming.
Do not include productionBrief or shotList. Keep asset/compose to 4-6 beats.
No markdown. No raw line breaks inside string values.`;
        const retry = await fetchLLMText(retryPrompt, Math.min(maxTokens + 2500, 8000));
        return await parseOrRepair(retry);
      }
      throw firstError;
    }
  } catch (e) {
    throw new Error(
      e.message?.includes("JSON")
        ? `Модель повернула пошкоджений JSON. Спробуй ще раз; я вже додав авто-ремонт і повтор при обрізаній відповіді. Деталь: ${e.message}`
        : e.message
    );
  }
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function TacticBadge({ tactic, small }) {
  const color = TACTIC_COLORS[tactic] || C.muted;
  return (
    <span style={{
      fontSize: small ? 10 : 11, fontWeight: 600, color,
      background: color + "22", border: `1px solid ${color}55`,
      borderRadius: 4, padding: small ? "1px 5px" : "2px 7px",
    }}>
      {TACTIC_LABELS[tactic] || tactic}
    </span>
  );
}

function FormatMeta({ format }) {
  if (!format?.awarenessFit) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
      {format.awarenessFit.map(s => (
        <span key={s} style={{ fontSize: 10, background: C.humanSoft, color: C.human, borderRadius: 3, padding: "1px 6px" }}>{s}</span>
      ))}
      <span style={{ fontSize: 10, background: format.coldScalable ? C.okSoft : C.warnSoft, color: format.coldScalable ? C.ok : C.warn, borderRadius: 3, padding: "1px 6px" }}>
        cold {format.coldScalable ? "✓" : "✗"}
      </span>
      {format.needsEducation && (
        <span style={{ fontSize: 10, background: C.aiSoft, color: C.ai, borderRadius: 3, padding: "1px 6px" }}>edukacja</span>
      )}
      <span style={{ fontSize: 10, background: C.surface, color: C.muted, borderRadius: 3, padding: "1px 6px" }}>
        cost: {format.productionCost}
      </span>
    </div>
  );
}

const SCORE_LABELS = { clarity: "Clarity", relevance: "Relevance", novelty: "Novelty", specificity: "Specificity", credibility: "Credibility" };
const FLOW_STEPS = ["Ідея", "Персона", "Кут", "Інсайт", "Оффер", "Формат", "Хук", "ТЗ"];

function ConstructorStepper({ activeIndex, onStepClick, canOpenStep }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${FLOW_STEPS.length}, minmax(74px, 1fr))`,
      alignItems: "start",
      gap: 8,
      margin: "34px 0 40px",
      overflowX: "auto",
      paddingBottom: 4,
    }}>
      {FLOW_STEPS.map((label, i) => {
        const active = i <= activeIndex;
        const complete = i < activeIndex;
        const available = canOpenStep ? canOpenStep(i) : true;
        return (
          <div
            key={label}
            onClick={() => available && onStepClick?.(i)}
            style={{ position: "relative", minWidth: 74, cursor: available && onStepClick ? "pointer" : "not-allowed", opacity: available ? 1 : 0.55 }}
          >
            {i < FLOW_STEPS.length - 1 && (
              <div style={{
                position: "absolute",
                top: 20,
                left: "calc(50% + 30px)",
                right: "calc(-50% + 30px)",
                height: 4,
                borderRadius: 999,
                background: complete ? C.ai : "#E8DFEF",
              }} />
            )}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 850,
                fontSize: 15,
                background: active ? C.ai : "#FFFFFF",
                color: active ? "#FFFFFF" : C.muted,
                border: `2px solid ${active ? C.ai : "#DCD2EA"}`,
                boxShadow: active ? "0 12px 26px rgba(124, 58, 237, 0.2)" : "none",
              }}>
                {i + 1}
              </div>
              <div style={{
                fontSize: 12.5,
                fontWeight: 850,
                color: active ? C.ink : C.muted,
                textAlign: "center",
                lineHeight: 1.2,
              }}>
                {label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HookCard({ hook, isSelected, onSelect }) {
  const { scores, total, pass } = scoreHook(hook);
  return (
    <div style={{
      border: `1px solid ${isSelected ? C.ok : pass ? C.ok + "55" : C.fail + "44"}`,
      borderLeft: `3px solid ${isSelected ? C.ok : pass ? C.ok : C.fail}`,
      borderRadius: 8, padding: "10px 12px", marginBottom: 10,
      background: isSelected ? C.okSoft : pass ? C.okSoft : C.failSoft,
      outline: isSelected ? `2px solid ${C.ok}55` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <TacticBadge tactic={hook.angle_type} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: pass ? C.ok : C.fail }}>
            {pass ? "✓ PASS" : "✗ FAIL"} {total}/10
          </span>
          {isSelected ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.ok, background: "#fff", border: `1px solid ${C.ok}`, borderRadius: 5, padding: "2px 9px" }}>
              ✓ Обрано
            </span>
          ) : (
            <button onClick={() => onSelect(hook)}
              style={{ fontSize: 11, fontWeight: 600, color: C.ai, background: C.aiSoft, border: `1px solid ${C.ai}55`, borderRadius: 5, padding: "2px 9px", cursor: "pointer", fontFamily: "inherit" }}>
              Обрати
            </button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12.5, marginBottom: 8, lineHeight: 1.5 }}>
        <div><b style={{ color: C.muted, fontWeight: 600 }}>Visual:</b> {hook.visual}</div>
        <div><b style={{ color: C.ink, fontWeight: 700 }}>Copy:</b> <span style={{ color: C.ink }}>{hook.copy}</span></div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: hook.weak_spot ? 6 : 0 }}>
        {Object.entries(scores).map(([k, v]) => (
          <span key={k} style={{
            fontSize: 10, fontWeight: 500, borderRadius: 3, padding: "1px 6px",
            color: v >= 2 ? C.ok : v === 1 ? C.warn : C.fail,
            background: v >= 2 ? C.okSoft : v === 1 ? C.warnSoft : C.failSoft,
          }}>
            {SCORE_LABELS[k]}: {v}/2
          </span>
        ))}
      </div>
      {hook.weak_spot && (
        <div style={{ fontSize: 11, color: C.warn, background: C.warnSoft, borderRadius: 4, padding: "3px 8px", marginTop: 2 }}>
          ↳ {hook.weak_spot}
        </div>
      )}
    </div>
  );
}

function BriefQuality({ result }) {
  const generatedChecks = Array.isArray(result?.quality?.checklist) ? result.quality.checklist : [];
  const checks = generatedChecks.length
    ? generatedChecks.map(check => ({ label: check.label, ok: Boolean(check.passed) }))
    : [
      { label: "Є 0–3s hook", ok: !!result?.header?.hook_0_3s },
      { label: "ASSET timeline", ok: Array.isArray(result?.asset) && result.asset.length >= 3 },
      { label: "COMPOSE timeline", ok: Array.isArray(result?.compose) && result.compose.length === result?.asset?.length },
      { label: "VO з таймінгами", ok: Array.isArray(result?.vo) && result.vo.length > 0 },
      { label: "Refs + naming", ok: !!result?.refs && !!result?.naming?.tracking_id },
    ];
  const passed = checks.filter(c => c.ok).length;
  const score = result?.quality?.score || `${passed}/${checks.length || 5}`;
  return (
    <div style={{ background: passed >= 4 ? C.okSoft : C.warnSoft, border: `1px solid ${passed >= 4 ? C.ok : C.warn}44`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: passed >= 4 ? C.ok : C.warn, letterSpacing: ".04em" }}>ЯКІСТЬ ТЗ</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: passed >= 4 ? C.ok : C.warn }}>{score}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {checks.map(check => (
          <span key={check.label} style={{
            fontSize: 11,
            color: check.ok ? C.ok : C.warn,
            background: check.ok ? "#fff" : "#fff8e6",
            border: `1px solid ${check.ok ? C.ok : C.warn}33`,
            borderRadius: 5,
            padding: "3px 7px",
          }}>
            {check.ok ? "✓" : "!"} {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimelineBeat({ beat, index, fields, color }) {
  return (
    <div style={{ background: C.softPanel, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: "11px 13px", marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 900, color, background: color + "18", border: `1px solid ${color}33`, borderRadius: 6, padding: "3px 8px" }}>
          {index + 1}. {beat.tc || "—"}
        </span>
        {beat.label && <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 850 }}>{beat.label}</span>}
      </div>
      {fields.map(([label, key]) => !beat[key] ? null : (
        <div key={key} style={{ fontSize: 12.8, color: C.ink, lineHeight: 1.5, marginTop: 4, whiteSpace: "pre-wrap" }}>
          <b style={{ color: C.muted, fontWeight: 850 }}>{label}:</b> {beat[key]}
        </div>
      ))}
    </div>
  );
}

function TimelineSection({ title, items, fields, color }) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color, letterSpacing: ".06em", marginBottom: 8 }}>{title}</div>
      {items.map((beat, i) => <TimelineBeat key={`${title}-${i}`} beat={beat} index={i} fields={fields} color={color} />)}
    </div>
  );
}

function ProductionBriefPanel({ result }) {
  const header = result?.header || {};
  const refs = result?.refs || {};
  const naming = result?.naming || {};
  const hasBrief = Object.keys(header).length || result?.asset?.length || result?.compose?.length;
  if (!hasBrief) return null;

  const headerItems = [
    ["Tracking ID", header.tracking_id],
    ["One-liner", header.one_liner],
    ["Audience", header.audience],
    ["Кут", header.angle],
    ["Emotional job", header.emotional_job],
    ["Формат", [header.format, header.duration_s ? `${header.duration_s}s` : ""].filter(Boolean).join(" · ")],
    ["Hook", header.hook_0_3s],
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, marginBottom: 14 }}>
        {headerItems.map(([label, value]) => !value ? null : (
          <div key={label} style={{ background: C.softPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.muted, letterSpacing: ".05em", marginBottom: 4 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.45, wordBreak: label === "Tracking ID" ? "break-all" : "normal" }}>{value}</div>
          </div>
        ))}
      </div>

      <BriefQuality result={result} />

      <TimelineSection
        title="ASSET"
        items={result.asset}
        color={C.ai}
        fields={[
          ["In frame", "in_frame"],
          ["Camera", "camera"],
          ["Screen", "screen"],
          ["VO", "vo"],
          ["Audio", "audio"],
        ]}
      />

      <TimelineSection
        title="COMPOSE"
        items={result.compose}
        color={C.ok}
        fields={[
          ["Real UI", "real_ui"],
          ["Trigger", "trigger"],
          ["Music", "music"],
          ["Subs", "subs"],
          ["VO", "vo"],
          ["Brand", "brand"],
        ]}
      />

      {Array.isArray(result.vo) && result.vo.length > 0 && (
        <div style={{ background: C.softPanel, border: `1px solid ${C.border}`, borderRadius: 9, padding: "11px 13px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: C.muted, letterSpacing: ".06em", marginBottom: 8 }}>VO</div>
          {result.vo.map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: C.ink, lineHeight: 1.55, marginTop: i ? 6 : 0 }}>
              <b style={{ color: C.ai }}>{i + 1}. {line.tc}</b> — {line.line}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div style={{ background: C.okSoft, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.ok, marginBottom: 6, letterSpacing: ".05em" }}>СИЛЬНІ СТОРОНИ</div>
          {(result.strengths || []).map((s, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.45 }}>• {s}</div>)}
        </div>
        <div style={{ background: C.warnSoft, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.warn, marginBottom: 6, letterSpacing: ".05em" }}>PRESSURE-TEST</div>
          {(result.pressure_test || []).map((s, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.45 }}>• {s}</div>)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, marginBottom: 16 }}>
        {[
          ["Music ref", refs.music_ref || "null"],
          ["Hook ref", refs.hook_ref || "null"],
          ["UGC realism", refs.ugc_realism ? "true" : "false"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: C.softPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.muted, letterSpacing: ".05em", marginBottom: 4 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.45, wordBreak: "break-word" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.aiSoft, border: `1px solid ${C.ai}33`, borderRadius: 9, padding: "11px 13px", marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: C.ai, letterSpacing: ".06em", marginBottom: 8 }}>НЕЙМІНГ</div>
        <code style={{ display: "block", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, color: C.ink, wordBreak: "break-all", marginBottom: naming.ab_suffixes?.length ? 8 : 0 }}>
          {naming.tracking_id || header.tracking_id || "—"}
        </code>
        {Array.isArray(naming.ab_suffixes) && naming.ab_suffixes.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {naming.ab_suffixes.map(suffix => (
              <span key={suffix} style={{ fontSize: 11, fontWeight: 850, color: C.ai, background: "#fff", border: `1px solid ${C.ai}33`, borderRadius: 6, padding: "3px 7px" }}>{suffix}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreativeConstructor({
  selectedProductId,
  selectedProduct,
  products = DEFAULT_PRODUCTS,
  onProductChange,
}) {
  const currentProduct = selectedProduct || products.find(p => p.id === selectedProductId) || products[0] || DEFAULT_PRODUCTS[0];
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS);
  const [insights, setInsights] = useState(DEFAULT_INSIGHTS);
  const [offers,   setOffers]   = useState(DEFAULT_OFFERS);
  const [angles,   setAngles]   = useState(DEFAULT_ANGLES);
  const [formats,  setFormats]  = useState(DEFAULT_FORMATS);
  const [reference, setReference] = useState({ assetSample: "", composeSample: "" });
  const [generationRules, setGenerationRules] = useState("");

  const [seed,      setSeed]      = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [personaId, setPersonaId] = useState(DEFAULT_PERSONAS[0].id);
  const [insightId, setInsightId] = useState(DEFAULT_INSIGHTS[0].id);
  const [offerId,   setOfferId]   = useState(DEFAULT_OFFERS[0].id);
  const [angleId,   setAngleId]   = useState(DEFAULT_ANGLES[0].id);
  const [formatId,  setFormatId]  = useState(DEFAULT_FORMATS[0].id);
  const [hookIdea,  setHookIdea]  = useState("");
  const [problem,   setProblem]   = useState(currentProduct.defaultProblem || "storage_full");

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState(null);
  const [history,      setHistory]      = useState([]);
  const [savePanel,    setSavePanel]    = useState(false);
  const [saveData,     setSaveData]     = useState({ uniqueDetails: "", status: "idea" });
  const [saved,        setSaved]        = useState(false);

  const [hooks,        setHooks]        = useState([]);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [hookError,    setHookError]    = useState("");
  const [selectedHook, setSelectedHook] = useState(null);

  const [revisionNote, setRevisionNote] = useState("");
  const [revising,     setRevising]     = useState(false);
  const [revisionError, setRevisionError] = useState("");

  const [logicIssues,  setLogicIssues]  = useState(null);  // null = не перевірено, [] = ok, [{issue,why},...] = є діри
  const [logicLoading, setLogicLoading] = useState(false);
  const [logicError,   setLogicError]   = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(raw => {
        const normalized = normalizeProductSettings(raw);
        const s = normalized.productSettings[selectedProductId] || {};
        const product = normalized.products.find(p => p.id === selectedProductId) || currentProduct;
        const apply = (list, setList, setId) => {
          const nextList = Array.isArray(list) ? list : [];
          setList(nextList);
          setId(cur => nextList.find(x => x.id === cur) ? cur : (nextList[0]?.id || ""));
        };
        apply(s.personas, setPersonas, setPersonaId);
        apply(s.insights, setInsights, setInsightId);
        apply(s.offers,   setOffers,   setOfferId);
        apply(s.angles,   setAngles,   setAngleId);
        apply(s.formats,  setFormats,  setFormatId);
        setReference(s.reference || { assetSample: "", composeSample: "" });
        setGenerationRules(typeof s.generationRules === "string" ? s.generationRules : "");
        setProblem(product.defaultProblem || "storage_full");
        setResult(null);
        setHooks([]);
        setSelectedHook(null);
        setError("");
        setCurrentStep(0);
      })
      .catch(() => {});
  }, [selectedProductId]);

  const persona = personas.find(p => p.id === personaId) || personas[0];
  const insight = insights.find(i => i.id === insightId) || insights[0];
  const offer   = offers.find(o => o.id === offerId)     || offers[0];
  const angle   = angles.find(a => a.id === angleId)     || angles[0];
  const format  = formats.find(f => f.id === formatId)   || formats[0];
  const isAI    = format?.prod === "AI-gen";
  const personaDescription = getPersonaDescription(persona);
  const personaDemo = getPersonaDemo(persona);
  const insightEssence = getInsightEssence(insight);
  const insightUsage = getInsightUsage(insight);
  const angleDescription = getAngleDescription(angle);

  const personaIssues = useMemo(() => validatePersona(persona), [persona]);
  const missingConfig = [
    !persona && "персони",
    !angle && "кути",
    !insight && "інсайти",
    !offer && "оффери",
    !format && "формати",
  ].filter(Boolean);
  const configReady = missingConfig.length === 0;
  const canGenerate   = !!seed.trim() && configReady && personaIssues.length === 0 && !!hookIdea.trim() && !loading;
  const stepReady = [
    !!seed.trim(),
    !!persona && personaIssues.length === 0,
    !!angle,
    !!insight,
    !!offer,
    !!format,
    !!hookIdea.trim(),
    canGenerate || !!result,
  ];
  const currentStepReady = stepReady[currentStep];
  const canOpenStep = (index) => index <= currentStep || stepReady.slice(0, index).every(Boolean);
  const openStep = (index) => {
    if (canOpenStep(index)) setCurrentStep(index);
  };
  const goBack = () => setCurrentStep(step => Math.max(0, step - 1));
  const goNext = () => setCurrentStep(step => Math.min(FLOW_STEPS.length - 1, step + 1));

  const resultFallbackTrackingId = result
    ? buildTrackingId(currentProduct, persona, angle, getResultHypothesisTag(result, seed), format, problem, hookIdea, result.header?.duration_s || 28)
    : "";
  const trackingId = result ? getResultTrackingId(result, resultFallbackTrackingId) : "";
  const legacyNaming = trackingId;

  function refSuffix() {
    const a = reference.assetSample?.trim();
    const c = reference.composeSample?.trim();
    if (!a && !c) return "";
    return `\nЗРАЗОК ФОРМАТУ (дотримуйся цього стилю і рівня деталізації):\nАССЕТ: ${a || "—"}\nКОМПОЗ: ${c || "—"}`;
  }

  function rulesSuffix() {
    const r = generationRules?.trim();
    if (!r) return "";
    return `\nЗАГАЛЬНІ ПРАВИЛА ГЕНЕРАЦІЇ (обов'язково дотримуватись):\n${r}`;
  }

  async function generate() {
    setLoading(true); setError(""); setResult(null); setSaved(false); setSavePanel(false);
    setHooks([]); setSelectedHook(null); setRevisionNote(""); setRevisionError("");
    setLogicIssues(null); setLogicError("");
    const fallbackTrackingId = buildTrackingId(currentProduct, persona, angle, slugify(seed).slice(0, 12), format, problem, hookIdea, 28);
    const prompt = `Ти — асистент креативного продакшну для продукту ${currentProduct.name}.
Головний принцип: КРЕАТИВ = ТАРГЕТИНГ. Один концепт = одна гіперспецифічна персона × один кут × один інсайт.
Маркетолог дає ІДЕЮ. Твоя задача — АДАПТУВАТИ її під лінзи. НЕ вигадуй нову ідею.

ПРОДУКТ:
  Назва: ${currentProduct.name}
  Категорія: ${currentProduct.category || "—"}
  Ринок: ${currentProduct.market || "—"}
  Аудиторія продукту: ${currentProduct.audience || "—"}
  Promise / що реально робить: ${currentProduct.promise || "—"}

ІДЕЯ: "${seed.trim()}"

ПЕРСОНА (архетип, не демографія):
  Архетип: ${persona.archetypeName || persona.name}
  Опис: ${personaDescription || "—"}
  Демо: ${personaDemo || "—"}

КУТ:
  Назва: ${angle.name}
  Опис: ${angleDescription || "—"}

ІНСАЙТ / ТРИГЕР / БАР'ЄР:
  Тип: ${insight?.type || "інсайт"}
  Суть: ${insightEssence || "—"}
  Як використати: ${insightUsage || "—"}

ОФФЕР: ${offer.framing ? `[${offer.framing}]` : ""} ${offer.valueProp || offer.label}
ФОРМАТ: ${format.name} (${format.prod}; ${(format.awarenessFit || []).join("/")}; ${format.note})
ІДЕЯ ХУКА: ${hookIdea || "—"}
TRACKING_ID_BASE: ${fallbackTrackingId}

Правила:
${isAI
  ? `- AI-формат: ASSET = люди/оточення/дії; будь-який екран телефону в кадрі = green-screen placeholder. AI НЕ генерує UI. COMPOSE = реальні UI/скрінрекорди, саби, звуки, лого, CTA, наскрізний дисклеймер 'AI Generated'.`
  : `- Формат ${format.prod}: ASSET = що знімаємо або генеруємо; COMPOSE = монтаж/верстка/UI. Дисклеймер 'AI Generated' не потрібен.`}
- НЕ створюй productionBrief або shotList. Єдине джерело правди по сценах: asset[] і compose[].
- asset[] і compose[] — паралельні нумеровані таймлайни з однаковими tc 1:1. 4–6 беатів, покривають весь duration_s.
- Таймкоди в форматі '0–4с', '4.5–13с'. duration_s за замовчуванням 28.
- asset[].screen: тільки 'green-screen / placeholder' або 'нема UI'. Ніколи не описуй згенерований UI в ASSET.
- compose[].real_ui: реальний UI або скрінрекорд, який монтується в green-screen.
- compose[].subs обов'язкові в кожному беаті; саби читаються без звуку.
- CTA-беат: brand має явно містити лого, пекшот, CTA-плашку, App Store / Google Play.
- VO/репліки — короткі, до ~12 слів на репліку, зі зведеним блоком vo[] і таймінгами.
- Інлайн VO-таймінги в asset[].vo: 'Line one' (4с) → 'Line two' (6.5с).
- Біль цілиться в ситуацію/телефон/сховище, не в людину.
- refs.music_ref і refs.hook_ref можуть бути null, ugc_realism boolean.
- naming.tracking_id і header.tracking_id мають збігатися з форматом: PROD_GEO_AUD_ANGLE_CONCEPT_FORMAT_LEN_HOOK_vNN_TAG. Можеш використати TRACKING_ID_BASE або стабільно уточнити CONCEPT.
- strengths 2–4 пункти. pressure_test 2–4 ризики з фіксом.
- Репліки/копі англійською (US), решта — українською.
- ВАЖЛИВО ДЛЯ JSON: у всіх текстових полях НЕ використовуй подвійні лапки — лише одинарні або без лапок.
- ВАЖЛИВО ДЛЯ JSON: не вставляй сирі переноси рядків всередині string values; якщо потрібно — використовуй \\n.
${refSuffix()}${rulesSuffix()}
Поверни ЛИШЕ валідний компактний JSON без markdown і без зайвих ключів:
{"header":{"tracking_id":"${fallbackTrackingId}","one_liner":"string","audience":"string","angle":"${angle.name}","emotional_job":"string","format":"${getFormatCode(format)}","duration_s":28,"hook_0_3s":"string"},"quality":{"score":"5/5","checklist":[{"label":"Є 0–3s hook","passed":true},{"label":"ASSET і COMPOSE синхронні","passed":true},{"label":"VO має таймінги","passed":true},{"label":"CTA має brand/store","passed":true},{"label":"AI Generated policy виконано","passed":true}]},"asset":[{"tc":"0–4с","label":"Хук","in_frame":"люди/оточення/дія/емоція/світло","camera":"UGC, handheld, максимально реалістично","screen":"green-screen / placeholder або нема UI","vo":"нема VO або 'line' (0с)","audio":"music / trigger"}],"compose":[{"tc":"0–4с","real_ui":"реальний UI або скрінрекорд","trigger":"—","music":"тренд-звук","subs":"крупні саби, синхрон VO","vo":"—","brand":"—"}],"vo":[{"tc":"4с","line":"Your phone says storage is full."}],"strengths":["string"],"pressure_test":["ризик + фікс"],"refs":{"music_ref":null,"hook_ref":null,"ugc_realism":true},"naming":{"tracking_id":"${fallbackTrackingId}","ab_suffixes":["_HOOKB","_NOVO"]}}`;
    try {
      let parsed = normalizeGeneratedBrief(await callLLM(prompt, 6500), fallbackTrackingId);
      let validationIssues = validateGeneratedBrief(parsed, { isAI });
      if (validationIssues.length) {
        const repairPrompt = `${prompt}

VALIDATION FAILED. Fix the JSON below so every invariant passes.
Errors:
${validationIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Return the FULL corrected JSON contract only. Keep the same concept, but regenerate invalid beats if needed.
BROKEN_JSON:
${JSON.stringify(parsed).slice(0, 18000)}`;
        parsed = normalizeGeneratedBrief(await callLLM(repairPrompt, 6500), fallbackTrackingId);
        validationIssues = validateGeneratedBrief(parsed, { isAI });
      }
      if (validationIssues.length) {
        throw new Error(`Згенероване ТЗ не пройшло валідатор: ${validationIssues.slice(0, 3).join("; ")}`);
      }
      setResult(parsed);
      const hypothesisTag = getResultHypothesisTag(parsed, seed);
      setHistory(h => [{
        name: getResultTrackingId(parsed, fallbackTrackingId) || `26Q2_${problem}_${persona.tag || "aud"}_${angle.tag || angle.id || "angle"}_${hypothesisTag}_v1`,
        angle: angle.name,
        insight: insight.tag || insight.id,
        format: format.name,
        hook: hookIdea,
      }, ...h]);
    } catch (e) {
      setError(`Помилка: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function reviseAssetCompose() {
    if (!revisionNote.trim() || !result) return;
    setRevising(true); setRevisionError("");
    const prompt = `Ти — асистент продакшну для продукту ${currentProduct.name}. Маркетолог переглянув концепт і хоче внести правку.

ПОТОЧНИЙ КОНЦЕПТ:
Продукт: ${currentProduct.name} — ${currentProduct.promise || "—"}
Ідея: "${seed.trim()}"
Персона: ${persona.archetypeName || persona.name} — ${personaDescription || "—"}
Кут: ${angle.name} — ${angleDescription || "—"}
Інсайт: [${insight?.type || "інсайт"}] ${insightEssence || "—"} | Як використати: ${insightUsage || "—"}
Оффер: ${offer.valueProp || offer.label}
Формат: ${format.name} (${format.prod})
Хук: ${hookIdea}

ПОТОЧНИЙ JSON:
${JSON.stringify(result).slice(0, 16000)}

ПРАВКА: "${revisionNote.trim()}"
${refSuffix()}${rulesSuffix()}
Перегенеруй повний JSON у новому контракті: header, quality, asset[], compose[], vo[], strengths[], pressure_test[], refs, naming.
Збережи naming.tracking_id стабільним: ${trackingId || resultFallbackTrackingId}.
Не повертай productionBrief або shotList.
ASSET і COMPOSE мають бути синхронні 1:1 за tc. Кожен COMPOSE beat має subs. CTA beat має brand із лого + пекшот + App Store / Google Play.
${isAI ? "Для AI-формату COMPOSE має містити наскрізний дисклеймер 'AI Generated'." : ""}
Поверни ЛИШЕ валідний компактний JSON без markdown.`;
    try {
      const fallbackTrackingId = trackingId || resultFallbackTrackingId;
      let parsed = normalizeGeneratedBrief(await callLLM(prompt, 6500), fallbackTrackingId);
      let validationIssues = validateGeneratedBrief(parsed, { isAI });
      if (validationIssues.length) {
        const repairPrompt = `${prompt}

VALIDATION FAILED:
${validationIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Return the FULL corrected JSON only.
BROKEN_JSON:
${JSON.stringify(parsed).slice(0, 18000)}`;
        parsed = normalizeGeneratedBrief(await callLLM(repairPrompt, 6500), fallbackTrackingId);
        validationIssues = validateGeneratedBrief(parsed, { isAI });
      }
      if (validationIssues.length) {
        throw new Error(`Правка не пройшла валідатор: ${validationIssues.slice(0, 3).join("; ")}`);
      }
      setResult(parsed);
      setRevisionNote("");
    } catch (e) {
      setRevisionError(`Помилка: ${e.message}`);
    } finally {
      setRevising(false);
    }
  }

  async function generateHooks() {
    setHooksLoading(true); setHookError(""); setSelectedHook(null);
    const prompt = `You generate performance-ad HOOKS for ${currentProduct.name} (${currentProduct.category || "product"}; ${currentProduct.market || "market"}). A hook is the first ~3 seconds of a video ad. Output hook variants as strict JSON only.

CORE PRINCIPLE: The creative IS the targeting. Every hook must agitate the viewer's actual problem/desire — NOT call out a demographic.

EVERY HOOK HAS THREE LAYERS:
- visual: what is on screen in seconds 0–3. Concrete, shootable. Write in Ukrainian (team working language).
- audio: VO line, ambient, music, or silence. Keep VO short. Write in Ukrainian.
- copy: the on-screen text / spoken claim that ships in the ad. Write in ENGLISH (US market).

ANGLE TYPES (use exact string for angle_type):
"Problem Agitation" · "Contrarian Truth" · "Social Proof / Authority" · "Curiosity Gap" · "Objection Handling" · "Before-After Transformation" · "Psychological Confrontation" · "Sensory / ASMR" · "Humor-Relief" · "Dignity / Independence"

HARD RULES:
1. Span at least TWO distinct angle types AND at least TWO emotional poles (fear/loss vs dignity/pride vs humor). If persona is 50+, at least one hook MUST use "Dignity / Independence".
2. Negative emotion targets the device/problem, NEVER the person.
3. Claims stay defensible: "free up space / remove duplicates / clear junk" only. Hard numbers in copy must be attributable to something visible on screen.
4. Specificity beats vagueness: concrete numbers, ages, named outcomes.

SCORING — grade each hook 0–2 per criterion (total /10):
- clarity: understood by a stranger in 3s. 2=instant; 1=needs a beat; 0=confusing.
- relevance: agitates the PROBLEM/desire. 2=hits the nerve; 1=adjacent; 0=generic/demographic call-out.
- novelty: 2=fresh angle; 1=familiar with twist; 0=done-to-death.
- specificity: 2=concrete numbers/names; 1=partly; 0=vague.
- credibility: 2=believable on its face; 1=claim floats; 0=not believable.
Be a tough, honest grader. VERDICT: PASS if total >= 7 AND no criterion is 0; otherwise FAIL.

INPUTS:
PRODUCT: ${currentProduct.name} — ${currentProduct.promise || "—"}
PERSONA: ${persona.archetypeName || persona.name} — ${personaDescription || "—"}
DEMO CONTEXT: ${personaDemo || "—"}
ANGLE: ${angle.name} — ${angleDescription || "—"}
INSIGHT: [${insight?.type || "insight"}] ${insightEssence || "—"}
HOW TO USE INSIGHT: ${insightUsage || "—"}
USER HOOK IDEA: "${hookIdea?.trim() || "—"}"
CREATIVE IDEA: "${seed.trim()}"
${rulesSuffix()}
IMPORTANT FOR JSON: do NOT use double quotes inside field values.

Return ONLY a JSON object. No prose, no markdown, no code fences:
{"hooks":[{"angle_type":"string","visual":"string","audio":"string","copy":"string","scores":{"clarity":0,"relevance":0,"novelty":0,"specificity":0,"credibility":0},"total":0,"verdict":"PASS","weak_spot":"one line: lowest criterion + how to fix; empty string if all >= 1"}]}
Generate 3 hooks. Order best-first by total score.`;
    try {
      const parsed = await callLLM(prompt, 2000);
      const arr = Array.isArray(parsed) ? parsed : (parsed?.hooks ?? [parsed]);
      arr.sort((a, b) => (b.total ?? scoreHook(b).total) - (a.total ?? scoreHook(a).total));
      setHooks(arr);
    } catch (e) {
      setHookError(`Помилка: ${e.message}`);
    } finally {
      setHooksLoading(false);
    }
  }

  function selectHook(hook) {
    setSelectedHook(hook);
    setHookIdea(hook.copy || hook.angle_type);
  }

  async function checkLogic() {
    if (!result) return;
    setLogicLoading(true); setLogicError(""); setLogicIssues(null);
    const prompt = `Ти — стратегічний ревʼювер Meta-реклами для продукту ${currentProduct.name}.
Завдання: знайти ЛОГІЧНІ ДІРИ у метафорі/образі концепту.

Логічна діра = коли дія або образ у метафорі тягне ПРОТИЛЕЖНИЙ сенс від того, що робить продукт.
Класичний приклад: продукт ВИДАЛЯЄ зайве, але образ «заклеює тріщину скотчем» — заклеювання = приховування проблеми, не вирішення.
Інший приклад: герой «біжить від пожежі» — але продукт не рятує, а клінить; образ = втеча, а треба = контроль.

КОНЦЕПТ:
Ідея: "${seed.trim()}"
Персона: ${persona.archetypeName || persona.name} — ${personaDescription}
Продукт: ${currentProduct.name} — ${currentProduct.promise || "—"}
Кут: ${angle.name} — ${angleDescription || "—"}
Інсайт: [${insight?.type || "інсайт"}] ${insightEssence || "—"}
ASSET timeline: ${JSON.stringify(result.asset || [])}
COMPOSE timeline: ${JSON.stringify(result.compose || [])}
VO: ${JSON.stringify(result.vo || [])}
${rulesSuffix()}
Поверни ЛИШЕ валідний JSON-масив без markdown. Якщо дір немає — порожній масив [].
Формат: [{"issue":"назва діри (1 рядок)","why":"чому це діра — конкретно"}]
ВАЖЛИВО: НЕ використовуй подвійні лапки всередині текстових полів.`;
    try {
      const parsed = await callLLM(prompt, 1500);
      setLogicIssues(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setLogicError(`Помилка: ${e.message}`);
    } finally {
      setLogicLoading(false);
    }
  }

  async function saveToBase() {
    const record = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      productId: currentProduct.id,
      product: currentProduct.name,
      seed: seed.trim(),
      problem,
      segment: persona.tag || "persona",
      persona: persona.archetypeName || persona.name,
      insight: insightEssence || insight?.tag || "",
      offer: offer.valueProp || offer.label,
      angle: angle.name,
      format: `${format.name} · ${format.prod}`,
      hookIdea,
      hypothesisTag: getResultHypothesisTag(result, seed),
      brief: result.header || null,
      productionBrief: {
        quality: result.quality || null,
        asset: result.asset || [],
        compose: result.compose || [],
        vo: result.vo || [],
        refs: result.refs || null,
        pressure_test: result.pressure_test || [],
      },
      naming: legacyNaming,
      trackingId,
      uniqueDetails: saveData.uniqueDetails,
      status: saveData.status,
    };
    try {
      const res = await fetch("/api/tests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true); setSavePanel(false);
    } catch (e) {
      setError(`Не вдалося зберегти в базу: ${e.message}`);
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  const sel = {
    width: "100%",
    minHeight: 56,
    padding: "13px 16px",
    border: `1px solid ${C.borderStrong}`,
    borderRadius: 14,
    background: "#FFFEFC",
    color: C.ink,
    fontSize: 15.5,
    fontWeight: 700,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };
  const lbl = {
    fontSize: 11,
    fontWeight: 850,
    color: C.muted,
    marginBottom: 8,
    display: "block",
    letterSpacing: ".12em",
    textTransform: "uppercase",
  };
  const card = (accent) => ({
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${accent}`,
    borderRadius: 18,
    padding: 32,
    marginBottom: 20,
    boxShadow: "0 14px 34px rgba(23, 19, 32, 0.045)",
  });
  const stepH = (n, t, color) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
      <span style={{ width: 36, height: 36, borderRadius: 11, background: color, color: "#fff", fontSize: 17, fontWeight: 850, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 12px 24px ${color}33` }}>{n}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 850, color, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 2 }}>Крок {String(n).padStart(2, "0")}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.ink, lineHeight: 1.05 }}>{t}</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: "48px clamp(22px, 5vw, 60px) 52px", lineHeight: 1.5 }}>
      <div style={{ maxWidth: 1114, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", margin: "0 auto 18px" }}>
          <img
            src={creoGuruLogo}
            alt="CreoGuru"
            style={{
              display: "block",
              width: "min(330px, 72vw)",
              height: "auto",
              margin: "0 auto",
            }}
          />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginTop: 26 }}>
            <select
              value={currentProduct.id}
              onChange={e => onProductChange?.(e.target.value)}
              style={{
                border: `1px solid ${C.borderStrong}`,
                borderRadius: 12,
                background: "#fff",
                color: C.ink,
                fontSize: 15,
                fontWeight: 850,
                padding: "12px 42px 12px 16px",
                fontFamily: "inherit",
                minWidth: 206,
                minHeight: 48,
                outline: "none",
              }}
            >
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
        </div>

        <ConstructorStepper activeIndex={currentStep} onStepClick={openStep} canOpenStep={canOpenStep} />

        {missingConfig.length > 0 && (
          <div style={{
            background: C.warnSoft,
            border: `1px solid ${C.warn}44`,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
            color: C.warn,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
              Для {currentProduct.name} ще не заповнені налаштування
            </div>
            <div style={{ fontSize: 12.5, color: C.muted }}>
              Додай у вкладці «Налаштування»: {missingConfig.join(", ")}. Кожен продукт має власні списки і не наслідує KeepClean автоматично.
            </div>
          </div>
        )}

        {/* ── 1. Ідея ──────────────────────────────────────────────────────────── */}
        <div style={{ ...card(C.human), display: currentStep === 0 ? "block" : "none" }}>
          {stepH(1, "Ідея", C.human)}
          <textarea value={seed} onChange={e => setSeed(e.target.value)}
            placeholder="Введи свою креативну ідею: метафора, хук, сцена, гег, культурний референс…"
            style={{ width: "100%", minHeight: 118, padding: "18px 20px", border: `1px solid ${C.borderStrong}`, borderRadius: 14, fontSize: 16, fontFamily: "inherit", color: C.ink, resize: "vertical", boxSizing: "border-box", background: "#FFFEFC", outline: "none", lineHeight: 1.55 }} />
        </div>

        {/* ── 2. Персона ───────────────────────────────────────────────────────── */}
        <div style={{ ...card(C.human), display: currentStep === 1 ? "block" : "none" }}>
          {stepH(2, "Персона", C.human)}
          <select style={sel} value={personaId} onChange={e => setPersonaId(e.target.value)}>
            {personas.map(p => <option key={p.id} value={p.id}>{p.name || p.archetypeName}</option>)}
          </select>

          {persona && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
                {personaDescription && (
                  <div style={{ background: C.softPanel, borderRadius: 13, padding: "18px 20px" }}>
                    <span style={lbl}>Опис</span>
                    <p style={{ fontSize: 15, color: C.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{personaDescription}</p>
                  </div>
                )}
                {personaDemo && (
                  <div style={{ background: C.softPanel, borderRadius: 13, padding: "18px 20px" }}>
                    <span style={lbl}>Демо</span>
                    <p style={{ fontSize: 15, color: C.ink, margin: 0, lineHeight: 1.6 }}>{personaDemo}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {personaIssues.length > 0 && (
            <div style={{ background: C.warnSoft, border: `1px solid ${C.warn}44`, borderRadius: 7, padding: "8px 11px", marginTop: 9 }}>
              {personaIssues.map((issue, i) => (
                <div key={i} style={{ fontSize: 12, color: C.warn, marginBottom: i < personaIssues.length - 1 ? 3 : 0 }}>• {issue}</div>
              ))}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>Відредагуй персону в Налаштуваннях або скинь до дефолту.</div>
            </div>
          )}

        </div>

        {/* ── 3. Кут ───────────────────────────────────────────────────────────── */}
        <div style={{ ...card(C.ai), display: currentStep === 2 ? "block" : "none" }}>
          {stepH(3, "Кут", C.ai)}
          <select style={sel} value={angleId} onChange={e => setAngleId(e.target.value)}>
            {angles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {angle && (
            <div style={{ background: C.humanSoft, border: `1px solid ${C.ai}22`, borderRadius: 13, padding: "17px 18px", marginTop: 14 }}>
              <span style={lbl}>Опис</span>
              <p style={{ fontSize: 15, color: C.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {angleDescription || "—"}
              </p>
            </div>
          )}
        </div>

        {/* ── 4. Інсайт ───────────────────────────────────────────────────────── */}
        <div style={{ ...card(C.ok), display: currentStep === 3 ? "block" : "none" }}>
          {stepH(4, "Інсайт", C.ok)}
          <select style={sel} value={insightId} onChange={e => setInsightId(e.target.value)}>
            {insights.map(i => (
              <option key={i.id} value={i.id}>
                {(i.tag || i.id)} · {i.type || "інсайт"}
              </option>
            ))}
          </select>
          {insight && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 26,
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: C.okSoft,
                  border: `1px solid ${C.ok}33`,
                  color: C.ok,
                  fontSize: 12,
                  fontWeight: 900,
                }}>
                  {insight.type || "інсайт"}
                </span>
                {insight.tag && (
                  <code style={{
                    borderRadius: 8,
                    padding: "5px 9px",
                    background: C.aiSoft,
                    color: C.ai,
                    fontSize: 12,
                    fontWeight: 850,
                    fontFamily: "ui-monospace, Menlo, monospace",
                  }}>
                    {insight.tag}
                  </code>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <div style={{ background: C.softPanel, borderRadius: 13, padding: "18px 20px" }}>
                  <span style={lbl}>Суть</span>
                  <p style={{ fontSize: 15, color: C.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {insightEssence || "—"}
                  </p>
                </div>
                <div style={{ background: C.softPanel, borderRadius: 13, padding: "18px 20px" }}>
                  <span style={lbl}>Як використати</span>
                  <p style={{ fontSize: 15, color: C.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {insightUsage || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Оффер ─────────────────────────────────────────────────────────── */}
        <div style={{ ...card(C.human), display: currentStep === 4 ? "block" : "none" }}>
          {stepH(5, "Оффер", C.human)}
          <select style={sel} value={offerId} onChange={e => setOfferId(e.target.value)}>
            {offers.map(o => <option key={o.id} value={o.id}>{o.label || o.valueProp}</option>)}
          </select>
          {offer?.framing && (
            <span style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 850, color: C.ai, background: C.aiSoft, borderRadius: 8, padding: "7px 11px" }}>{offer.framing}</span>
          )}
          {offer?.valueProp && (
            <p style={{ fontSize: 15, color: C.muted, margin: "10px 0 0", lineHeight: 1.55 }}>{offer.valueProp}</p>
          )}
        </div>

        {/* ── 6. Формат ────────────────────────────────────────────────────────── */}
        <div style={{ ...card(C.human), display: currentStep === 5 ? "block" : "none" }}>
          {stepH(6, "Формат", C.human)}
          <select style={sel} value={formatId} onChange={e => setFormatId(e.target.value)}>
            {formats.map(f => <option key={f.id} value={f.id}>{f.name} · {f.prod}</option>)}
          </select>
          <FormatMeta format={format} />
          {format?.id === "dpa" && (
            <p style={{ fontSize: 13, color: C.fail, margin: "10px 0 0", fontWeight: 750 }}>DPA переатрибутовує органіку — не масштабувати на cold.</p>
          )}
          {format?.note && (
            <p style={{ fontSize: 13.5, color: C.muted, margin: "8px 0 0", fontStyle: "italic", lineHeight: 1.5 }}>{format.note}</p>
          )}
        </div>

        {/* ── 7. Хук ───────────────────────────────────────────────────────────── */}
        <div style={{ ...card(C.ai), display: currentStep === 6 ? "block" : "none" }}>
          {stepH(7, "Хук", C.ai)}
          <label style={{ ...lbl, color: C.ink, marginBottom: 10 }}>
            В чому ідея хука?
          </label>
          <input
            value={hookIdea}
            onChange={e => { setHookIdea(e.target.value); setSelectedHook(null); }}
            placeholder="чіпляюча фраза — why nobody is talking about what this man just said"
            style={{ ...sel, fontSize: 15.5 }}
          />
          <p style={{ fontSize: 14, color: C.muted, margin: "10px 0 12px" }}>
            Обов'язкове поле. Немає ідей? Запропонуємо варіанти — обери один.
          </p>
          {!hookIdea.trim() && (
              <button onClick={generateHooks} disabled={hooksLoading || !seed.trim() || !configReady}
              style={{
                border: `1px solid ${C.ai}`, background: C.aiSoft, color: C.ai,
                borderRadius: 12, padding: "10px 18px", fontSize: 14, fontWeight: 850,
                cursor: (hooksLoading || !seed.trim() || !configReady) ? "not-allowed" : "pointer",
                fontFamily: "inherit", marginBottom: hooks.length > 0 ? 12 : 0,
              }}>
              {hooksLoading ? "Генерую…" : !configReady ? "Спершу заповни налаштування продукту" : "Запропонувати варіанти →"}
            </button>
          )}
          {hookError && <p style={{ fontSize: 13, color: C.fail, margin: "8px 0 0" }}>{hookError}</p>}
          {hooks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {hooks.map((hook, i) => (
                <HookCard
                  key={i}
                  hook={hook}
                  isSelected={selectedHook?.angle_type === hook.angle_type && selectedHook?.copy === hook.copy}
                  onSelect={selectHook}
                />
              ))}
              {hooks.length > 0 && !hookIdea.trim() && (
                <button onClick={generateHooks} disabled={hooksLoading}
                  style={{
                    border: `1px solid ${C.border}`, background: "none", color: C.muted,
                    borderRadius: 7, padding: "4px 12px", fontSize: 12, cursor: hooksLoading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", marginTop: 6,
                  }}>
                  {hooksLoading ? "Генерую…" : "↻ Ще варіанти"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 8. ТЗ ────────────────────────────────────────────────────────────── */}
        {currentStep === 7 && (
          <div style={card(C.ai)}>
            {stepH(8, "ТЗ", C.ai)}
            <p style={{ fontSize: 15, color: C.muted, margin: "-8px 0 18px", lineHeight: 1.55 }}>
              Перевір вибрані блоки й згенеруй production-ready creative brief.
            </p>

        <button onClick={generate} disabled={!canGenerate}
          style={{
            width: "100%", padding: "17px 20px", border: "none", borderRadius: 14, marginBottom: 10,
            background: !seed.trim() ? C.border
              : !configReady ? C.warn + "33"
              : personaIssues.length > 0 ? C.warn + "33"
              : !hookIdea.trim() ? C.border
              : loading ? C.ai + "88" : `linear-gradient(135deg, ${C.ai}, #6D28D9)`,
            color: (!seed.trim() || !configReady || personaIssues.length > 0 || !hookIdea.trim()) ? C.muted : "#fff",
            fontSize: 16, fontWeight: 900,
            cursor: canGenerate ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: canGenerate ? "0 18px 34px rgba(124, 58, 237, 0.28)" : "none",
          }}>
          {loading ? "Генерую ТЗ…"
            : !seed.trim() ? "Спершу введи ідею"
            : !configReady ? `Заповни налаштування продукту: ${missingConfig.join(", ")}`
            : personaIssues.length > 0 ? "Виправ персону перед генерацією"
            : !hookIdea.trim() ? "Спершу вкажи ідею хука"
            : "Згенерувати ТЗ →"}
        </button>
        {personaIssues.length > 0 && (
          <p style={{ fontSize: 12, color: C.warn, textAlign: "center", margin: "0 0 14px" }}>
            Вузька персона = точніший таргетинг. Відредагуй у вкладці Налаштування.
          </p>
        )}

        {error && <div style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warn}`, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 14 }}>{error}</div>}

        {/* ── Result ───────────────────────────────────────────────────────────── */}
        {result && (
          <div style={{ background: C.softPanel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: C.ai, color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Адаптація від AI</span>
            </div>

            <ProductionBriefPanel result={result} />

            {/* Logic check */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: ".04em" }}>ПЕРЕВІРКА ЛОГІКИ МЕТАФОРИ</div>
                <button onClick={checkLogic} disabled={logicLoading}
                  style={{
                    border: `1px solid ${C.warn}`, background: C.warnSoft, color: C.warn,
                    borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 600,
                    cursor: logicLoading ? "not-allowed" : "pointer", fontFamily: "inherit", flexShrink: 0,
                  }}>
                  {logicLoading ? "Аналізую…" : logicIssues !== null ? "↻ Перевірити ще раз" : "Перевірити логіку →"}
                </button>
              </div>
              {logicError && <p style={{ fontSize: 12, color: C.fail, margin: "0 0 6px" }}>{logicError}</p>}
              {logicIssues !== null && (
                logicIssues.length === 0 ? (
                  <div style={{ background: C.okSoft, border: `1px solid ${C.ok}44`, borderRadius: 7, padding: "8px 11px" }}>
                    <span style={{ fontSize: 12, color: C.ok, fontWeight: 600 }}>✓ Логічних дір не виявлено</span>
                  </div>
                ) : (
                  <div style={{ background: C.warnSoft, border: `1px solid ${C.warn}44`, borderRadius: 7, padding: "8px 11px" }}>
                    {logicIssues.map((item, i) => (
                      <div key={i} style={{ marginBottom: i < logicIssues.length - 1 ? 8 : 0 }}>
                        <div style={{ fontSize: 12, color: C.warn, fontWeight: 600 }}>• {item.issue}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2, paddingLeft: 10 }}>{item.why}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 7, borderTop: `1px solid ${C.warn}22`, paddingTop: 6 }}>
                      Не блокує — рішення за тобою. Можна виправити через «Правку ассету/композу».
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Revision */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, letterSpacing: ".04em" }}>ПРАВКА АССЕТУ / КОМПОЗУ</div>
              <textarea
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                placeholder="Опиши що змінити: 'зроби хук більш драматичним', 'додай конкретні цифри', 'скороти ассет до 1 речення'…"
                style={{ width: "100%", minHeight: 64, padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, fontFamily: "inherit", color: C.ink, resize: "vertical", boxSizing: "border-box", marginBottom: 8 }}
              />
              {revisionError && <p style={{ fontSize: 12, color: C.fail, margin: "0 0 6px" }}>{revisionError}</p>}
              <button
                onClick={reviseAssetCompose}
                disabled={!revisionNote.trim() || revising}
                style={{
                  border: `1px solid ${C.ai}`, background: revisionNote.trim() ? C.aiSoft : C.surface,
                  color: revisionNote.trim() ? C.ai : C.muted,
                  borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600,
                  cursor: revisionNote.trim() && !revising ? "pointer" : "not-allowed", fontFamily: "inherit",
                }}>
                {revising ? "Перегенерую…" : "↻ Застосувати правку"}
              </button>
            </div>

            {/* Save */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              {saved ? (
                <div style={{ fontSize: 13.5, color: C.ok, fontWeight: 500 }}>✓ Збережено в базу тестів</div>
              ) : !savePanel ? (
                <button onClick={() => { setSavePanel(true); setSaveData({ uniqueDetails: "", status: "idea" }); }}
                  style={{ border: `1px solid ${C.ai}`, background: C.aiSoft, color: C.ai, borderRadius: 8, padding: "7px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Зберегти в базу →
                </button>
              ) : (
                <div>
                  <label style={lbl}>Що унікального в цьому крео</label>
                  <textarea value={saveData.uniqueDetails} onChange={e => setSaveData(d => ({ ...d, uniqueDetails: e.target.value }))}
                    placeholder="Опиши ключову деталь, що відрізняє це крео…"
                    style={{ width: "100%", minHeight: 68, padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, fontFamily: "inherit", color: C.ink, resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <select value={saveData.status} onChange={e => setSaveData(d => ({ ...d, status: e.target.value }))} style={{ ...sel, width: "auto", flex: "0 0 auto" }}>
                      <option value="idea">Ідея</option>
                      <option value="in_production">В продакшні</option>
                      <option value="live">Лайв</option>
                      <option value="killed">Killed</option>
                    </select>
                    <button onClick={saveToBase} style={{ background: C.ai, color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Зберегти</button>
                    <button onClick={() => setSavePanel(false)} style={{ background: "none", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 13px", fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>Скасувати</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        )}

        <div style={{
          display: "flex",
          justifyContent: currentStep === 0 ? "flex-end" : "space-between",
          gap: 12,
          margin: "0 0 22px",
        }}>
          {currentStep > 0 && (
            <button
              onClick={goBack}
              style={{
                border: `1px solid ${C.borderStrong}`,
                background: "#fff",
                color: C.muted,
                borderRadius: 12,
                padding: "13px 20px",
                fontSize: 15,
                fontWeight: 850,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Назад
            </button>
          )}
          {currentStep < FLOW_STEPS.length - 1 && (
            <button
              onClick={goNext}
              disabled={!currentStepReady}
              style={{
                border: "none",
                background: currentStepReady ? C.ai : C.border,
                color: currentStepReady ? "#fff" : C.muted,
                borderRadius: 12,
                padding: "13px 22px",
                fontSize: 15,
                fontWeight: 900,
                cursor: currentStepReady ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                boxShadow: currentStepReady ? "0 14px 28px rgba(124, 58, 237, 0.22)" : "none",
              }}
            >
              Далі: {FLOW_STEPS[currentStep + 1]} →
            </button>
          )}
        </div>

        {/* ── Session history ───────────────────────────────────────────────────── */}
        {currentStep === 7 && history.length > 0 && (
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Сесія</span>
              <span style={{ fontSize: 12, color: C.muted }}>{history.length} концептів</span>
            </div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", borderTop: i ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
                <code style={{ fontFamily: "ui-monospace, Menlo, monospace", color: C.muted, wordBreak: "break-all" }}>{h.name}</code>
                <span style={{ color: C.muted, whiteSpace: "nowrap" }}>{h.angle}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
