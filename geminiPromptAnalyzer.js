/**
 * geminiPromptAnalyzer.js
 * ─────────────────────────────────────────────────────────────
 * Gemini API 連携モジュール (独立キーファイル gemini_config.js 対応版)
 *
 * ■ 移管関数（app.js から移動）
 *   - fetchGeminiModelList(apiKey)
 *   - chooseBestGeminiModel(apiKey)
 *   - fetchGeminiSemanticAnalysis(localResult, steps)
 *
 * ■ 新規実装（Prompt Intelligence Analyzer 用）
 *   - analyzeWorkspacePrompt()
 *   - fetchGeminiPromptAnalysis(data)
 *   - renderWorkspaceGeminiResult(result)
 *
 * 依存:
 *   - gemini_config.js : APIキーのインポート元
 *   - app.js  : window.state, showToast
 *   - promptStructureAnalyzer.js : window.buildPromptStructureJSON
 * ─────────────────────────────────────────────────────────────
 */

import { geminiConfig } from "./gemini_config.js";

// ============================================================
// CONFIG & SHARED STATE
// ============================================================

/** モデル優先順位（Semantic Dominance 解析も参照） */
const GEMINI_MODEL_PRIORITY = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
];

// ============================================================
// ─── 移管関数 ─────────────────────────────────────────────
// ============================================================

/**
 * 利用可能な Gemini モデルのリストを v1beta API から取得する。
 * @param {string} apiKey
 * @returns {Promise<string[]>} e.g. ["models/gemini-2.5-flash", ...]
 */
async function fetchGeminiModelList(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Model list fetch failed: HTTP ${response.status}`);
  }
  const data = await response.json();
  console.log("[GeminiAnalyzer] Model list:", data);
  return (data.models || []).map(m => m.name);
}

/**
 * GEMINI_MODEL_PRIORITY に従い最適なモデル ID を選択して返す。
 * @param {string} apiKey
 * @returns {Promise<string>}
 */
async function chooseBestGeminiModel(apiKey) {
  let available;
  try {
    available = await fetchGeminiModelList(apiKey);
  } catch (e) {
    console.warn("[GeminiAnalyzer] Could not fetch model list, falling back to gemini-2.5-flash-lite:", e.message);
    return "gemini-2.5-flash-lite";
  }

  for (const candidate of GEMINI_MODEL_PRIORITY) {
    const found = available.some(name => name === `models/${candidate}` || name === candidate);
    if (found) {
      console.log(`[GeminiAnalyzer] Selected model: ${candidate}`);
      return candidate;
    }
  }

  console.warn("[GeminiAnalyzer] No priority model available. Falling back to gemini-2.5-flash-lite.");
  return "gemini-2.5-flash-lite";
}

/**
 * validateGeminiApiKeyFormat — API キーが空でないか検証する。
 * @param {string} key
 * @returns {boolean}
 */
function validateGeminiApiKeyFormat(key) {
  return typeof key === "string" && key.trim().length > 0;
}

/**
 * fetchGeminiSemanticAnalysis
 * Semantic Dominance Analysis パネル向け Gemini 呼び出し。
 * ─ app.js から移管。既存の initAnalysisPanel / Re-Analyze ボタンとの連携を維持。
 *
 * @param {Object} localResult - runSemanticAnalysis() の戻り値
 * @param {number} steps       - Target Sampling Steps
 * @returns {Promise<Object>}  - Gemini が返した分析 JSON
 */
async function fetchGeminiSemanticAnalysis(localResult, steps) {
  const apiKey = geminiConfig.apiKey ? geminiConfig.apiKey.trim() : "";
  if (!validateGeminiApiKeyFormat(apiKey)) {
    throw new Error("Gemini API Key is not configured or invalid in gemini_config.js.");
  }

  const posText = localResult.posTokens.map(t => `${t.text} (${t.weight})`).join(", ");
  const negText = localResult.negTokens.map(t => `${t.text} (${t.weight})`).join(", ");

  const systemPrompt = `You are an expert AI analyzing Stable Diffusion prompt structures.
Analyze the following positive and negative prompts.
Respond ONLY in valid JSON format matching exactly this structure:
{
  "classified": {
    "constraint": [{"text": "token text", "weight": 1.2}],
    "restraint": [{"text": "token text", "weight": 0.8}],
    "condition": [{"text": "token text", "weight": 1.0}]
  },
  "wtConstraint": 1.5,
  "wtRestraint": 0.5,
  "wtCondition": 1.0,
  "wtNeg": 2.5,
  "pctDiffusion": 60,
  "pctStructure": 40,
  "causalExplanation": "Explain the causal relationship between positive and negative prompts and Target Sampling Steps: ${steps}, and detect risks of prompt collapse...",
  "assessments": {
    "style": { "detected": true, "matchedKws": ["keyword"], "matchedReinf": ["keyword"], "matchedDanger": [], "stabilityScore": 85, "status": "stable" },
    "mid-frequency": { "detected": false, "matchedKws": [], "matchedReinf": [], "matchedDanger": [], "stabilityScore": 0, "status": "inactive" },
    "costume": { "detected": false, "matchedKws": [], "matchedReinf": [], "matchedDanger": [], "stabilityScore": 0, "status": "inactive" },
    "background": { "detected": false, "matchedKws": [], "matchedReinf": [], "matchedDanger": [], "stabilityScore": 0, "status": "inactive" },
    "composition": { "detected": false, "matchedKws": [], "matchedReinf": [], "matchedDanger": [], "stabilityScore": 0, "status": "inactive" },
    "subject_core": { "detected": false, "matchedKws": [], "matchedReinf": [], "matchedDanger": [], "stabilityScore": 0, "status": "inactive" },
    "optics_luminance": { "detected": false, "matchedKws": [], "matchedReinf": [], "matchedDanger": [], "stabilityScore": 0, "status": "inactive" },
    "atmosphere_diffusion": { "detected": false, "matchedKws": [], "matchedReinf": [], "matchedDanger": [], "stabilityScore": 0, "status": "inactive" }
  },
  "idealValues": {
    "pctConstraint": 40,
    "pctRestraint": 30,
    "pctCondition": 30,
    "densityScore": 70
  },
  "tokenCategories": {
    "token text": "Subject"
  }
}
Definitions:
- Constraint: structural/boundary terms (e.g. sharp focus, detailed, anatomy)
- Restraint: attenuation/suppression terms (e.g. soft, muted, blurry, smooth)
- Condition: interaction/lighting/field terms (e.g. lighting, bloom, cinematic)
- wtNeg is calculated as sum(2.0 - weight) for negative tokens.
- pctDiffusion + pctStructure must equal 100.
- assessments keys must be exactly: style, mid-frequency, costume, background, composition, subject_core, optics_luminance, atmosphere_diffusion.
  - status must be one of: 'stable', 'warning', 'critical', 'inactive'.
  - stabilityScore from 0 to 100.
- idealValues: Represents the ideal percentages of Constraint, Restraint, Condition, and ideal densityScore for this prompt, determined by the token content and the sequence structure/order of phases (LAYER ORDER).
- tokenCategories: A dictionary mapping every active token in the positive prompt to exactly one of: Subject, Character, Action, Material, Style, Medium, Environment, Luminance, Atmosphere, Color, Composition, Emotion.
Positive Prompt: [ ${posText} ]
Negative Prompt: [ ${negText} ]
Target Sampling Steps: ${steps}`;

  const modelId = await chooseBestGeminiModel(apiKey);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
  console.log(`[GeminiAnalyzer] fetchGeminiSemanticAnalysis → model: ${modelId}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    })
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    data = rawText;
  }
  console.log(`[GeminiAnalyzer] SemanticAnalysis full response (model: ${modelId}):`, data);

  if (!response.ok) {
    let errMsg = (typeof data === "object" && data?.error?.message)
      ? data.error.message : `HTTP ${response.status}`;
    if (response.status === 401 || errMsg.includes("invalid authentication credentials")) {
      errMsg = "Gemini APIキーが無効、または正しくありません。正しいAPIキーを設定し直してください。";
    }
    throw new Error(errMsg);
  }

  // ── Null-guard: candidates の存在チェック ────────────────
  const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) {
    throw new Error("Gemini returned an empty or malformed response (no candidates text).");
  }

  let result;
  try {
    result = JSON.parse(jsonText);
  } catch (e) {
    // Fallback: Gemini がMarkdownコードブロックで包んだ場合のパース
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      result = JSON.parse(match[1].trim());
    } else {
      throw new Error("Could not parse Gemini JSON response: " + e.message);
    }
  }
  result._usedModel = modelId;
  return result;
}

// ============================================================
// ─── 新規実装: Prompt Intelligence Analyzer ───────────────
// ============================================================

/**
 * fetchGeminiPromptAnalysis
 * gemini-2.5-flash-lite を固定モデルとして使用し、
 * プロンプト構造の7項目を JSON で返す Gemini 呼び出し。
 *
 * @param {Object} data - buildPromptStructureJSON() の戻り値
 * @returns {Promise<Object>}
 */
async function fetchGeminiPromptAnalysis(data) {
  const apiKey = geminiConfig.apiKey ? geminiConfig.apiKey.trim() : "";
  if (!validateGeminiApiKeyFormat(apiKey)) {
    throw new Error("Gemini API Key is not configured or invalid in gemini_config.js.");
  }

  // Compact prompt structure for token efficiency
  const compactPhases = (data.phases || []).map(p => ({
    name: p.name,
    order: p.order,
    isNeg: p.isNegative,
    role: p.phaseRole,
    tokens: (p.tokens || []).map(t => ({
      text: t.text,
      w: t.weight,
      pos: t.position,
      role: t.role,
      ...(t.redundancyFlag ? { dup: t.redundancyFlag.type } : {}),
      ...(t.conflictFlag   ? { conflict: true }             : {})
    }))
  }));

  const systemPrompt = `You are an expert Stable Diffusion prompt engineer. Analyze this structured prompt JSON and return your findings as valid JSON only — no explanation text outside the JSON.

PROMPT STRUCTURE:
${JSON.stringify(compactPhases, null, 2)}

METADATA:
- Total tokens: ${data.meta?.totalTokens ?? "unknown"}
- Positive phases: ${data.meta?.positivePhases ?? "?"}
- Negative phases: ${data.meta?.negativePhases ?? "?"}
- Avg weight: ${data.meta?.avgWeight ?? "?"}
- Pre-detected redundant tokens: ${data.meta?.redundantCount ?? 0}
- Pre-detected conflicts: ${data.meta?.conflictCount ?? 0}

Return ONLY valid JSON matching this exact structure:
{
  "strongestTokens": [
    { "text": "token text", "weight": 1.3, "reason": "Why this token is impactful" }
  ],
  "weakestTokens": [
    { "text": "token text", "weight": 0.9, "reason": "Why this token has low influence" }
  ],
  "semanticConflicts": [
    { "tokenA": "token text", "tokenB": "token text", "description": "Nature of the conflict" }
  ],
  "redundantTokens": [
    { "text": "token text", "duplicateOf": "original token text", "suggestion": "Remove or merge" }
  ],
  "duplicateConcepts": [
    { "concept": "concept name", "instances": ["token A", "token B"], "suggestion": "Unify into one token" }
  ],
  "incorrectTokenOrdering": [
    { "token": "token text", "currentPhase": "phase name", "suggestedPhase": "better phase name", "reason": "Reason for reordering" }
  ],
  "phaseHierarchyProblems": [
    { "phase": "phase name", "issue": "Description of the issue", "suggestion": "How to fix it" }
  ],
  "dangerPositives": [
    { "text": "token text", "reason": "Why this positive token is risky or destabilizing" }
  ],
  "dangerNegatives": [
    { "text": "token text", "reason": "Why this negative token is dangerous or overly suppressive" }
  ]
}

Analysis Conditions:
- DANGER POSITIVES: Detect tokens containing explicit negations, negative prefixes, suppressive words, generation-halting words, and explicitly low/high frequency terms that disrupt the intended style.
- DANGER NEGATIVES: Detect generation-halting words, structural topology terms, highly specific concepts, and words that suppress the "main/auxiliary phases" of the style defined in the positive prompt.

Rules:
- Return 3–6 items per array where applicable. Return empty array [] if none found.
- All string values must be concise (max 120 chars).
- Do NOT include any text outside the JSON object.
- CRITICAL: Any token strings returned in the JSON (such as "text", "token", "tokenA", "tokenB") MUST EXACTLY MATCH (one-to-one, case-sensitive) the token strings present in the input "PROMPT STRUCTURE" JSON (compactPhases). Do NOT invent new tokens, summarize, or modify any existing token strings. MUST NOT summarize, truncate, or split any token strings. Even if a token is a long sentence, you must return it exactly as it appears in the input PROMPT STRUCTURE (including spaces and symbols). If no matching token exists for a category, DO NOT invent one; return an empty array [] instead.
- CRITICAL: The explanation fields (reason, description, suggestion, issue) MUST BE OUTPUT STRICTLY IN JAPANESE (必ず日本語で出力すること). Token texts, concept names, and phase names should remain in their original English.`;

  // 固定モデル: gemini-2.5-flash-lite
  const modelId = "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
  console.log("[GeminiAnalyzer] fetchGeminiPromptAnalysis → model:", modelId);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    })
  });

  const rawText = await response.text();
  let apiData;
  try {
    apiData = JSON.parse(rawText);
  } catch (_) {
    apiData = rawText;
  }
  console.log("[GeminiAnalyzer] PromptAnalysis full response:", apiData);

  if (!response.ok) {
    let errMsg = (typeof apiData === "object" && apiData?.error?.message)
      ? apiData.error.message : `HTTP ${response.status}`;
    if (response.status === 401 || errMsg.includes("invalid authentication credentials")) {
      errMsg = "Gemini APIキーが無効、または正しくありません。正しいAPIキーを設定し直してください。";
    }
    throw new Error(errMsg);
  }

  const jsonText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) throw new Error("Gemini returned an empty response.");

  let result;
  try {
    result = JSON.parse(jsonText);
  } catch (e) {
    // Try to extract JSON from a markdown code block if Gemini wrapped it
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      result = JSON.parse(match[1]);
    } else {
      throw new Error("Could not parse Gemini JSON response: " + e.message);
    }
  }

  result._usedModel = modelId;
  return result;
}

// ============================================================
// RENDER: Workspace Gemini Result → UI
// ============================================================

/**
 * renderWorkspaceGeminiResult
 * fetchGeminiPromptAnalysis() の結果をワークスペースの
 * Prompt Intelligence Analyzer パネルに描画する。
 *
 * @param {Object} result - fetchGeminiPromptAnalysis() の戻り値
 */
function renderWorkspaceGeminiResult(result) {
  // ── helpers ──────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  function renderTokenList(items, textKey = "text", reasonKey = "reason") {
    if (!items || items.length === 0) {
      return '<span class="text-slate-600 italic">None detected.</span>';
    }
    return items.map(item => {
      const text   = item[textKey] || item.text || "—";
      const reason = item[reasonKey] || item.description || item.suggestion || "";
      const weight = item.weight != null ? ` <span class="opacity-60">(${item.weight}x)</span>` : "";
      return `<div class="mb-1.5">
        <span class="text-slate-200 font-semibold">${_escHtml(text)}${weight}</span>
        ${reason ? `<br><span class="text-slate-500 text-[10px] leading-tight">${_escHtml(reason)}</span>` : ""}
      </div>`;
    }).join("");
  }

  function renderPairList(items, keyA, keyB, descKey = "description") {
    if (!items || items.length === 0) {
      return '<span class="text-slate-600 italic">No conflicts detected.</span>';
    }
    return items.map(item => {
      const a    = item[keyA] || "—";
      const b    = item[keyB] || "";
      const desc = item[descKey] || item.suggestion || "";
      return `<div class="mb-1.5">
        <span class="text-rose-400 font-semibold">${_escHtml(a)}</span>
        ${b ? ` <span class="text-slate-500">↔</span> <span class="text-amber-400 font-semibold">${_escHtml(b)}</span>` : ""}
        ${desc ? `<br><span class="text-slate-500 text-[10px] leading-tight">${_escHtml(desc)}</span>` : ""}
      </div>`;
    }).join("");
  }

  function renderPhaseList(items) {
    if (!items || items.length === 0) {
      return '<span class="text-slate-600 italic">No issues detected.</span>';
    }
    return items.map(item => {
      const phase = item.phase || item.token || "—";
      const issue = item.issue || item.reason || "";
      const suggestion = item.suggestion || "";
      return `<div class="mb-1.5">
        <span class="text-purple-400 font-semibold">${_escHtml(phase)}</span>
        ${issue ? `<br><span class="text-slate-400 text-[10px] leading-tight">${_escHtml(issue)}</span>` : ""}
        ${suggestion ? `<br><span class="text-cyan-500 text-[10px] leading-tight">→ ${_escHtml(suggestion)}</span>` : ""}
      </div>`;
    }).join("");
  }

  // ── Strongest Tokens ─────────────────────────────────────
  const strongest = el("pia-strongest-tokens");
  if (strongest) {
    strongest.innerHTML = renderTokenList(result.strongestTokens, "text", "reason");
  }

  // ── Weakest Tokens ───────────────────────────────────────
  const weakest = el("pia-weakest-tokens");
  if (weakest) {
    weakest.innerHTML = renderTokenList(result.weakestTokens, "text", "reason");
  }

  // ── Semantic Conflicts ───────────────────────────────────
  const conflicts = el("pia-semantic-conflicts");
  if (conflicts) {
    conflicts.innerHTML = renderPairList(result.semanticConflicts, "tokenA", "tokenB", "description");
  }

  // ── Redundant Tokens + Duplicate Concepts ────────────────
  const redundant = el("pia-redundant-tokens");
  if (redundant) {
    const redHtml  = renderTokenList(result.redundantTokens, "text", "suggestion");
    const dupItems = (result.duplicateConcepts || []).map(d => ({
      text: `[Concept] ${d.concept}`,
      reason: `${(d.instances || []).join(", ")} — ${d.suggestion || ""}`
    }));
    const dupHtml  = renderTokenList(dupItems, "text", "reason");
    redundant.innerHTML = redHtml + (dupItems.length > 0 ? `<hr class="border-slate-800/60 my-2">${dupHtml}` : "");
  }

  // ── Layer Order (Incorrect Ordering + Phase Hierarchy Problems) ──
  const layerOrder = el("pia-layer-order");
  if (layerOrder) {
    const orderHtml = renderPhaseList(
      (result.incorrectTokenOrdering || []).map(i => ({
        phase: i.token,
        issue: `Currently in: ${i.currentPhase}`,
        suggestion: `Move to: ${i.suggestedPhase} — ${i.reason || ""}`
      }))
    );
    const hierarchyHtml = renderPhaseList(result.phaseHierarchyProblems || []);
    layerOrder.innerHTML =
      `<div class="mb-1 text-[9px] uppercase tracking-wider text-slate-600 font-bold">Token Ordering</div>` +
      orderHtml +
      `<div class="mb-1 mt-2 text-[9px] uppercase tracking-wider text-slate-600 font-bold">Phase Hierarchy</div>` +
      hierarchyHtml;
  }

  // ── Optimization (summary card) ──────────────────────────
  const optimization = el("pia-optimization");
  if (optimization) {
    const totalIssues =
      (result.semanticConflicts?.length  || 0) +
      (result.redundantTokens?.length    || 0) +
      (result.duplicateConcepts?.length  || 0) +
      (result.incorrectTokenOrdering?.length || 0) +
      (result.phaseHierarchyProblems?.length || 0);

    const strongCount = result.strongestTokens?.length || 0;
    const weakCount   = result.weakestTokens?.length   || 0;

    let scoreColor = "text-emerald-400";
    let scoreLabel = "Excellent";
    if (totalIssues >= 8)      { scoreColor = "text-rose-400";   scoreLabel = "Needs Work"; }
    else if (totalIssues >= 4) { scoreColor = "text-amber-400";  scoreLabel = "Fair"; }
    else if (totalIssues >= 2) { scoreColor = "text-cyan-400";   scoreLabel = "Good"; }

    optimization.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold ${scoreColor}">${scoreLabel}</span>
        <span class="text-[10px] text-slate-500 font-mono">${totalIssues} issue${totalIssues !== 1 ? "s" : ""} found</span>
      </div>
      <div class="grid grid-cols-2 gap-1.5 text-[10px]">
        <div class="bg-slate-800/40 rounded p-1.5">
          <span class="text-emerald-400 font-bold">${strongCount}</span>
          <span class="text-slate-500 ml-1">strong drivers</span>
        </div>
        <div class="bg-slate-800/40 rounded p-1.5">
          <span class="text-rose-400 font-bold">${weakCount}</span>
          <span class="text-slate-500 ml-1">weak tokens</span>
        </div>
        <div class="bg-slate-800/40 rounded p-1.5">
          <span class="text-amber-400 font-bold">${result.semanticConflicts?.length || 0}</span>
          <span class="text-slate-500 ml-1">conflicts</span>
        </div>
        <div class="bg-slate-800/40 rounded p-1.5">
          <span class="text-cyan-400 font-bold">${(result.redundantTokens?.length || 0) + (result.duplicateConcepts?.length || 0)}</span>
          <span class="text-slate-500 ml-1">redundancies</span>
        </div>
      </div>
      <div class="mt-2 text-[10px] text-slate-500">
        Analyzed by <span class="text-indigo-400 font-semibold">${result._usedModel || "gemini-2.5-flash-lite"}</span>
      </div>
    `;
    // Update summary truncated text for the button card
    // optimization.textContent = `${scoreLabel} · ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} · ${result._usedModel || 'gemini-2.5-flash-lite'}`;
  }

  // ── Danger Positives ─────────────────────────────────────
  const dangerPos = el("pia-danger-positives");
  if (dangerPos) {
    const items = result.dangerPositives || [];
    dangerPos.textContent = items.length > 0
      ? items.map(i => i.text || i.token || i).join(" · ")
      : "None detected.";
  }

  // ── Danger Negatives ─────────────────────────────────────
  const dangerNeg = el("pia-danger-negatives");
  if (dangerNeg) {
    const items = result.dangerNegatives || [];
    dangerNeg.textContent = items.length > 0
      ? items.map(i => i.text || i.token || i).join(" · ")
      : "None detected.";
  }

  // Cache result on window for modal access
  window._piaLastResult = result;

  // app.js のバインディングを更新してトークンバッジに反映する
  if (typeof applyGeminiAnalysisBindings === 'function') {
    applyGeminiAnalysisBindings(result);
  }
}

// ============================================================
// ORCHESTRATOR: analyzeWorkspacePrompt
// ============================================================

/**
 * analyzeWorkspacePrompt
 * Workspace の「Run Intelligence Analysis」ボタンに対応するフロー管理関数。
 *
 * Flow:
 *  1. buildPromptStructureJSON() でローカル構造を抽出
 *  2. fetchGeminiPromptAnalysis() で Gemini に送信
 *  3. renderWorkspaceGeminiResult() で UI に描画
 */
async function analyzeWorkspacePrompt() {
  const btn    = document.getElementById("btn-run-intelligence-analysis");
  const panels = [
    "pia-optimization",
    "pia-layer-order",
    "pia-strongest-tokens",
    "pia-weakest-tokens",
    "pia-redundant-tokens",
    "pia-semantic-conflicts",
    "pia-danger-positives",
    "pia-danger-negatives"
  ];

  // ── Guard: API key ──────────────────────────────────────
  const apiKey = geminiConfig.apiKey ? geminiConfig.apiKey.trim() : "";
  if (!validateGeminiApiKeyFormat(apiKey)) {
    _showAnalysisToast(
      "Gemini API Key が gemini_config.js に設定されていません。ファイルを確認してください。",
      "warning"
    );
    return;
  }

  // ── Guard: phases ───────────────────────────────────────
  const phasesSource = (typeof state !== "undefined" && Array.isArray(state.phases))
    ? state.phases : (window.state?.phases || []);
  const hasTokens = phasesSource.some(ph => {
    const toks = ph.isNegative
      ? (ph.tokens || [])
      : (ph.patterns?.[ph.activePatternIndex ?? 0]?.tokens || []);
    return toks.some(t => t.isActive !== false);
  });

  if (!hasTokens) {
    _showAnalysisToast("ワークスペースにトークンがありません。まずフェーズにトークンを追加してください。", "warning");
    return;
  }

  // ── Loading state ───────────────────────────────────────
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing with Gemini…`;
  }
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `<div class="flex items-center gap-2 text-slate-500 text-[10px]">
        <i class="fa-solid fa-circle-notch fa-spin text-indigo-400"></i> Fetching…
      </div>`;
    }
  });

  try {
    // Step 1: Local structure extraction
    const structureData = (typeof buildPromptStructureJSON === "function")
      ? buildPromptStructureJSON()
      : { phases: [], meta: {} };

    if (!structureData.phases || structureData.phases.length === 0) {
      throw new Error("No active phases found in the prompt structure.");
    }

    // Step 2: Gemini API call
    const result = await fetchGeminiPromptAnalysis(structureData);

    // Step 3: Render results
    renderWorkspaceGeminiResult(result);

    _showAnalysisToast(
      `Intelligence Analysis 完了 (${result._usedModel || "gemini-2.5-flash-lite"})`,
      "success"
    );

  } catch (err) {
    console.error("[GeminiAnalyzer] analyzeWorkspacePrompt failed:", err);
    panels.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `<span class="text-rose-400 text-[10px]">
          <i class="fa-solid fa-triangle-exclamation"></i> Error: ${_escHtml(err.message)}
        </span>`;
      }
    });
    _showAnalysisToast(`Gemini Error: ${err.message}`, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Run Intelligence Analysis`;
    }
  }
}

// ============================================================
// PRIVATE UTILITIES
// ============================================================

/**
 * HTML エスケープ。XSS 防止のため Gemini 応答テキストに使用。
 * @param {string} str
 * @returns {string}
 */
function _escHtml(str) {
  if (typeof str !== "string") str = String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * app.js の showToast があれば使用し、なければ console.log にフォールバック。
 * @param {string} message
 * @param {string} [type] - "success" | "warning" | "error"
 */
function _showAnalysisToast(message, type = "info") {
  if (typeof showToast === "function") {
    showToast(message, type);
  } else {
    console.log(`[GeminiAnalyzer][${type}] ${message}`);
  }
}

// ============================================================
// DOM READY: ボタンイベントを接続
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // ── PIA Run Button ──────────────────────────────────────
  const btn = document.getElementById("btn-run-intelligence-analysis");
  if (btn) {
    btn.addEventListener("click", analyzeWorkspacePrompt);
    console.log("[GeminiAnalyzer] btn-run-intelligence-analysis listener attached.");
  }

  // ── PIA Category Button → Modal ─────────────────────────
  _initPiaCategoryButtons();

  // ============================================================
  // 起動時 APIキー自動検証: gemini_config.js からキーを読み込み、
  // 接続ステータスを各パネルの #gemini-status 要素に反映する。
  // ============================================================
  _validateAndShowStatus();
});

/**
 * gemini_config.js のキーを起動時に検証し、
 * #gemini-status, #gemini-active-model, #btn-validate-api の各要素を更新する。
 */
async function _validateAndShowStatus() {
  const apiKey = geminiConfig.apiKey ? geminiConfig.apiKey.trim() : "";

  const statusEl     = document.getElementById("gemini-status");
  const modelEl      = document.getElementById("gemini-active-model");
  const validateBtn  = document.getElementById("btn-validate-api");

  // キーが未設定の場合
  if (!validateGeminiApiKeyFormat(apiKey)) {
    if (statusEl) {
      statusEl.innerHTML = `<i class="fa-solid fa-circle-exclamation text-[8px]"></i> Config Required`;
      statusEl.className = "font-semibold text-rose-400 flex items-center gap-1.5";
    }
    if (modelEl) modelEl.textContent = "None";
    console.warn("[GeminiAnalyzer] gemini_config.js: API key not configured.");
    return;
  }

  // 検証中表示
  if (statusEl) {
    statusEl.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-[8px]"></i> Validating…`;
    statusEl.className = "font-semibold text-slate-400 flex items-center gap-1.5";
  }
  if (validateBtn) validateBtn.disabled = true;

  try {
    const model = await chooseBestGeminiModel(apiKey);
    if (statusEl) {
      statusEl.innerHTML = `<i class="fa-solid fa-circle-check text-[8px]"></i> Connected`;
      statusEl.className = "font-semibold text-emerald-400 flex items-center gap-1.5";
    }
    if (modelEl) modelEl.textContent = model;
    console.log(`[GeminiAnalyzer] ✅ API Key validated. Active model: ${model}`);
  } catch (err) {
    if (statusEl) {
      statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark text-[8px]"></i> Auth Error`;
      statusEl.className = "font-semibold text-rose-400 flex items-center gap-1.5";
    }
    if (modelEl) modelEl.textContent = "None";
    console.error("[GeminiAnalyzer] ❌ API Key validation failed:", err.message);
  } finally {
    if (validateBtn) {
      validateBtn.disabled = false;
    }
  }

  // Validate & Connect ボタンに手動再検証機能を付与
  if (validateBtn) {
    validateBtn.addEventListener("click", () => _validateAndShowStatus(), { once: false });
  }
}

// ============================================================
// PIA MODAL CONTROLLER
// ============================================================

/**
 * Builds rich HTML content for the modal based on the category key
 * and the cached analysis result (window._piaLastResult).
 *
 * @param {string} category - e.g. "strongest", "weakest", ...
 * @returns {string} HTML string
 */
function _buildPiaModalContent(category) {
  const result = window._piaLastResult;

  function escH(s) { return _escHtml(s); }

  function itemCard(title, subtitle, badge) {
    return `<div class="pia-modal-item">
      ${badge ? `<span class="pia-modal-item-tag">${escH(badge)}</span>` : ""}
      <div class="pia-modal-item-title">${escH(title)}</div>
      ${subtitle ? `<div class="pia-modal-item-sub">${escH(subtitle)}</div>` : ""}
    </div>`;
  }

  function emptyState(icon = "fa-inbox") {
    return `<div class="pia-modal-empty">
      <i class="fa-solid ${icon}"></i>
      <span>No data available yet.<br>Run the analysis first.</span>
    </div>`;
  }

  if (!result) return emptyState();

  if (category === "optimization") {
    const totalIssues =
      (result.semanticConflicts?.length  || 0) +
      (result.redundantTokens?.length    || 0) +
      (result.duplicateConcepts?.length  || 0) +
      (result.incorrectTokenOrdering?.length || 0) +
      (result.phaseHierarchyProblems?.length || 0);
    const strongCount = result.strongestTokens?.length || 0;
    const weakCount   = result.weakestTokens?.length   || 0;
    let scoreLabel = "Excellent";
    let scoreHue   = "#34d399";
    if (totalIssues >= 8)      { scoreLabel = "Needs Work"; scoreHue = "#f87171"; }
    else if (totalIssues >= 4) { scoreLabel = "Fair";       scoreHue = "#fbbf24"; }
    else if (totalIssues >= 2) { scoreLabel = "Good";       scoreHue = "#22d3ee"; }

    return `
      <div style="background:rgba(15,23,42,0.6);border-radius:12px;padding:14px;margin-bottom:12px;border:1px solid rgba(99,102,241,0.2)">
        <div style="font-size:22px;font-weight:800;color:${scoreHue};margin-bottom:4px;">${scoreLabel}</div>
        <div style="font-size:11px;color:#64748b;">${totalIssues} total issue${totalIssues !== 1 ? "s" : ""} detected</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div class="pia-modal-item"><div class="pia-modal-item-title" style="color:#34d399;">${strongCount} Strong</div><div class="pia-modal-item-sub">High-impact tokens</div></div>
        <div class="pia-modal-item"><div class="pia-modal-item-title" style="color:#f87171;">${weakCount} Weak</div><div class="pia-modal-item-sub">Low-influence tokens</div></div>
        <div class="pia-modal-item"><div class="pia-modal-item-title" style="color:#fbbf24;">${result.semanticConflicts?.length || 0} Conflicts</div><div class="pia-modal-item-sub">Semantic contradictions</div></div>
        <div class="pia-modal-item"><div class="pia-modal-item-title" style="color:#22d3ee;">${(result.redundantTokens?.length||0)+(result.duplicateConcepts?.length||0)} Redundant</div><div class="pia-modal-item-sub">Duplicates &amp; concepts</div></div>
      </div>
      <div class="pia-modal-section-label">Analyzed by</div>
      <div class="pia-modal-item"><div class="pia-modal-item-title" style="color:#a5b4fc;">${escH(result._usedModel || "gemini-2.5-flash-lite")}</div></div>`;
  }

  if (category === "layer-order") {
    const orderItems = (result.incorrectTokenOrdering || []);
    const hierItems  = (result.phaseHierarchyProblems || []);
    if (orderItems.length === 0 && hierItems.length === 0) return emptyState("fa-layer-group");
    let html = "";
    if (orderItems.length > 0) {
      html += `<div class="pia-modal-section-label">Token Ordering Issues</div>`;
      orderItems.forEach(i => {
        html += itemCard(i.token || "—",
          `Currently in: ${i.currentPhase} → Move to: ${i.suggestedPhase}. ${i.reason || ""}`,
          "ORDERING");
      });
    }
    if (hierItems.length > 0) {
      html += `<div class="pia-modal-section-label">Phase Hierarchy Issues</div>`;
      hierItems.forEach(i => {
        html += itemCard(i.phase || "—",
          `${i.issue || ""} ${i.suggestion ? "→ " + i.suggestion : ""}`,
          "HIERARCHY");
      });
    }
    return html;
  }

  if (category === "strongest") {
    const items = result.strongestTokens || [];
    if (!items.length) return emptyState("fa-arrow-up-right-dots");
    return items.map(i => itemCard(
      `${i.text}${i.weight != null ? ` (${i.weight}x)` : ""}`,
      i.reason, "STRONG"
    )).join("");
  }

  if (category === "weakest") {
    const items = result.weakestTokens || [];
    if (!items.length) return emptyState("fa-arrow-down-short-wide");
    return items.map(i => itemCard(
      `${i.text}${i.weight != null ? ` (${i.weight}x)` : ""}`,
      i.reason, "WEAK"
    )).join("");
  }

  if (category === "redundant") {
    const redItems = result.redundantTokens || [];
    const dupItems = result.duplicateConcepts || [];
    if (!redItems.length && !dupItems.length) return emptyState("fa-clone");
    let html = "";
    if (redItems.length) {
      html += `<div class="pia-modal-section-label">Redundant Tokens</div>`;
      redItems.forEach(i => html += itemCard(i.text, `Duplicate of: ${i.duplicateOf} — ${i.suggestion || ""}`, "REDUNDANT"));
    }
    if (dupItems.length) {
      html += `<div class="pia-modal-section-label">Duplicate Concepts</div>`;
      dupItems.forEach(i => html += itemCard(`[Concept] ${i.concept}`,
        `${(i.instances||[]).join(", ")} — ${i.suggestion || ""}`, "CONCEPT"));
    }
    return html;
  }

  if (category === "conflicts") {
    const items = result.semanticConflicts || [];
    if (!items.length) return emptyState("fa-triangle-exclamation");
    return items.map(i => itemCard(
      `${i.tokenA} ↔ ${i.tokenB}`,
      i.description, "CONFLICT"
    )).join("");
  }

  if (category === "danger-pos") {
    const items = result.dangerPositives || [];
    if (!items.length) return emptyState("fa-radiation");
    return `<div class="pia-modal-section-label">Dangerous positive tokens — may destabilize the diffusion process</div>` +
      items.map(i => itemCard(
        i.text || i.token || String(i),
        i.reason || i.description || "",
        "DANGER +"
      )).join("");
  }

  if (category === "danger-neg") {
    const items = result.dangerNegatives || [];
    if (!items.length) return emptyState("fa-skull-crossbones");
    return `<div class="pia-modal-section-label">Dangerous negative tokens — may suppress intended content</div>` +
      items.map(i => itemCard(
        i.text || i.token || String(i),
        i.reason || i.description || "",
        "DANGER −"
      )).join("");
  }

  return emptyState();
}

/** Category metadata: title, icon, accent color */
const _PIA_CATEGORY_META = {
  "optimization":  { title: "Optimization",     icon: "fa-solid fa-lightbulb",            color: "#f472b6" },
  "layer-order":   { title: "Layer Order",       icon: "fa-solid fa-layer-group",           color: "#c084fc" },
  "strongest":     { title: "Strongest Tokens",  icon: "fa-solid fa-arrow-up-right-dots",   color: "#34d399" },
  "weakest":       { title: "Weakest Tokens",    icon: "fa-solid fa-arrow-down-short-wide", color: "#f87171" },
  "redundant":     { title: "Redundant Tokens",  icon: "fa-solid fa-clone",                 color: "#22d3ee" },
  "conflicts":     { title: "Semantic Conflicts",icon: "fa-solid fa-triangle-exclamation",  color: "#fbbf24" },
  "danger-pos":    { title: "Danger Positives",  icon: "fa-solid fa-radiation",             color: "#fb923c" },
  "danger-neg":    { title: "Danger Negatives",  icon: "fa-solid fa-skull-crossbones",      color: "#f87171" },
};

/**
 * Opens the PIA detail modal for a given category.
 * @param {string} category
 */
function openPiaModal(category) {
  const overlay  = document.getElementById("pia-modal-overlay");
  const titleEl  = document.getElementById("pia-modal-title");
  const iconEl   = document.getElementById("pia-modal-icon");
  const bodyEl   = document.getElementById("pia-modal-body");
  if (!overlay) return;

  const meta = _PIA_CATEGORY_META[category] || { title: category, icon: "fa-solid fa-circle-info", color: "#a5b4fc" };
  titleEl.textContent = meta.title;
  titleEl.style.color = meta.color;
  iconEl.innerHTML    = `<i class="${meta.icon}" style="color:${meta.color}"></i>`;
  bodyEl.innerHTML    = _buildPiaModalContent(category);

  overlay.setAttribute("aria-hidden", "false");
  overlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

/**
 * Closes the PIA detail modal.
 */
function closePiaModal() {
  const overlay = document.getElementById("pia-modal-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/**
 * Wires up all .pia-category-btn elements and the modal close button.
 */
function _initPiaCategoryButtons() {
  // Category buttons
  document.querySelectorAll(".pia-category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      openPiaModal(category);
    });
  });

  // Close button inside modal
  const closeBtn = document.getElementById("pia-modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closePiaModal);
  }

  // Click on overlay backdrop to close
  const overlay = document.getElementById("pia-modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePiaModal();
    });
  }

  // ESC key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePiaModal();
  });
}

// ============================================================
// GLOBAL EXPORT
// ============================================================
window.fetchGeminiModelList       = fetchGeminiModelList;
window.chooseBestGeminiModel      = chooseBestGeminiModel;
window.validateGeminiApiKeyFormat = validateGeminiApiKeyFormat;
window.fetchGeminiSemanticAnalysis = fetchGeminiSemanticAnalysis;
window.fetchGeminiPromptAnalysis   = fetchGeminiPromptAnalysis;
window.renderWorkspaceGeminiResult = renderWorkspaceGeminiResult;
window.analyzeWorkspacePrompt      = analyzeWorkspacePrompt;
window.openPiaModal                = openPiaModal;
window.closePiaModal               = closePiaModal;

console.log("[GeminiAnalyzer] Module loaded. All Gemini functions available.");
