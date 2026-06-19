/**
 * promptStructureAnalyzer.js
 * ─────────────────────────────────────────────────────────────
 * ローカル解析専用モジュール。
 * app.js の state.phases からGemini送信用の軽量JSONを構築する。
 *
 * 依存: app.js 不要。
 *   - 引数でphasesデータを受け取るか、
 *   - window.state.phases をフォールバックで参照する。
 * ─────────────────────────────────────────────────────────────
 */

// ============================================================
// 内部ユーティリティ
// ============================================================

/**
 * フェーズの名前からトークンの意味的ロールを推定する。
 * @param {Object} phase
 * @returns {string}
 */
function _inferPhaseRole(phase) {
  if (phase.isNegative) return "negative";
  const name = (phase.name || "").toLowerCase();
  if (/subject|character|person|figure|object/.test(name)) return "subject";
  if (/style|medium|art/.test(name))                         return "style";
  if (/environment|lighting|light|background|scene/.test(name)) return "environment";
  if (/atmosphere|mood|tone|color/.test(name))               return "atmosphere";
  if (/camera|angle|lens|shot|composition/.test(name))       return "camera";
  if (/quality|detail|render/.test(name))                    return "quality";
  return "modifier";
}

/**
 * トークン個別のロールを推定する（テキストベースのヒューリスティクス）。
 * @param {string} text  - トークン本文
 * @param {string} phaseRole - 親フェーズのロール
 * @returns {string}
 */
function _inferTokenRole(text, phaseRole) {
  if (phaseRole === "negative") return "negative";
  const t = text.toLowerCase();
  if (/\bshot on\b|lens|aperture|f\/|dslr|camera/.test(t))           return "camera";
  if (/\d+k\b|resolution|masterpiece|best quality|highly detailed/.test(t)) return "quality";
  if (/lighting|light rays|illumination|shadow|glow|hdr/.test(t))   return "lighting";
  if (/background|landscape|city|forest|street|environment/.test(t)) return "environment";
  if (/style|painting|art|illustration|render|digital/.test(t))      return "style";
  if (phaseRole !== "modifier") return phaseRole;
  return "modifier";
}

/**
 * フェーズからアクティブなトークン配列を取得する。
 * app.js の getPhaseTokens と同ロジック。
 * @param {Object} phase
 * @returns {Array}
 */
function _getPhaseTokens(phase) {
  if (phase.isNegative) {
    return Array.isArray(phase.tokens) ? phase.tokens : [];
  }
  const patterns = phase.patterns;
  if (!patterns || patterns.length === 0) return [];
  let idx = typeof phase.activePatternIndex === "number" ? phase.activePatternIndex : 0;
  if (idx < 0 || idx >= patterns.length) idx = 0;
  const pattern = patterns[idx];
  return (pattern && Array.isArray(pattern.tokens)) ? pattern.tokens : [];
}

/**
 * テキストを正規化する（小文字・トリム・記号除去）。
 * @param {string} text
 * @returns {string}
 */
function _normalize(text) {
  return text.toLowerCase().trim().replace(/[()[\]:*]/g, "").replace(/\s+/g, " ");
}

/**
 * Jaccard類似度（単語セット）を計算する。
 * @param {string} a
 * @param {string} b
 * @returns {number} 0.0 – 1.0
 */
function _jaccardSimilarity(a, b) {
  const setA = new Set(_normalize(a).split(" ").filter(Boolean));
  const setB = new Set(_normalize(b).split(" ").filter(Boolean));
  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union        = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * テキストAがBを包含（部分文字列として含む）しているか判定する。
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function _subsumes(a, b) {
  const na = _normalize(a);
  const nb = _normalize(b);
  return na !== nb && (na.includes(nb) || nb.includes(na));
}

// ============================================================
// 重複・類似トークン検出
// ============================================================

/**
 * 全トークンリストから重複・類似ペアを検出し、各トークンIDへのフラグセットを返す。
 *
 * @param {Array<{id:string, text:string}>} allTokens
 * @param {number} [similarityThreshold=0.72] Jaccard閾値
 * @returns {Map<string, {type:"duplicate"|"similar"|"subsumes", peerText:string}>}
 */
function _detectDuplicates(allTokens, similarityThreshold = 0.72) {
  const flagMap = new Map(); // tokenId → { type, peerText }
  for (let i = 0; i < allTokens.length; i++) {
    for (let j = i + 1; j < allTokens.length; j++) {
      const ta = allTokens[i];
      const tb = allTokens[j];
      const na = _normalize(ta.text);
      const nb = _normalize(tb.text);

      if (na === nb) {
        // 完全重複
        if (!flagMap.has(ta.id)) flagMap.set(ta.id, { type: "duplicate", peerText: tb.text });
        if (!flagMap.has(tb.id)) flagMap.set(tb.id, { type: "duplicate", peerText: ta.text });
      } else if (_subsumes(ta.text, tb.text)) {
        // 一方が他方を包含
        if (!flagMap.has(ta.id)) flagMap.set(ta.id, { type: "subsumes", peerText: tb.text });
        if (!flagMap.has(tb.id)) flagMap.set(tb.id, { type: "subsumes", peerText: ta.text });
      } else {
        const sim = _jaccardSimilarity(ta.text, tb.text);
        if (sim >= similarityThreshold) {
          if (!flagMap.has(ta.id)) flagMap.set(ta.id, { type: "similar", similarity: +sim.toFixed(2), peerText: tb.text });
          if (!flagMap.has(tb.id)) flagMap.set(tb.id, { type: "similar", similarity: +sim.toFixed(2), peerText: ta.text });
        }
      }
    }
  }
  return flagMap;
}

// ============================================================
// セマンティクス競合の静的ルール（app.js の SEMANTIC_CONFLICT_RULES を参照）
// ============================================================

/** app.js のグローバルルールがあれば借用し、なければ組み込みの最小セットを使う */
function _getConflictRules() {
  if (typeof SEMANTIC_CONFLICT_RULES !== "undefined" && Array.isArray(SEMANTIC_CONFLICT_RULES)) {
    return SEMANTIC_CONFLICT_RULES;
  }
  return [
    {
      category: "Watercolor",
      coreKeywords: ["watercolor", "chromatic-wash", "water color"],
      posConflicts:  ["metallic", "glossy surface", "plastic", "3d render"],
      negDangers:    ["brushstroke", "paint bleed", "tonal smoothing"]
    },
    {
      category: "Anime",
      coreKeywords: ["anime", "cel-shading", "manga"],
      posConflicts:  ["photorealistic", "3d render", "hyper-realistic"],
      negDangers:    ["flat color", "outline", "2d", "illustration"]
    },
    {
      category: "Photorealistic",
      coreKeywords: ["photorealistic", "shot on", "raw photo", "dslr"],
      posConflicts:  ["anime style", "watercolor", "oil painting", "illustration"],
      negDangers:    ["bokeh", "depth of field", "film grain"]
    },
    {
      category: "Cyberpunk",
      coreKeywords: ["cyberpunk", "neon lit", "synthwave"],
      posConflicts:  ["natural lighting", "rustic", "medieval"],
      negDangers:    ["neon", "glow", "city lights"]
    }
  ];
}

/**
 * Core Token から起動するセマンティクス競合を検出する。
 *
 * @param {Array<{id:string, text:string, isNegative:boolean}>} allTokens
 * @returns {Map<string, {reason:string, category:string}>}
 */
function _detectSemanticConflicts(allTokens) {
  const rules = _getConflictRules();
  const conflictMap = new Map();

  // 1) Core トークンのテキストを収集
  const coreTokenTexts = allTokens
    .filter(t => t.isCore && !t.isNegative)
    .map(t => _normalize(t.text));

  // Core トークンが見つからない場合は全陽性トークンをフォールバックとして使う
  const baseTexts = coreTokenTexts.length > 0
    ? coreTokenTexts
    : allTokens.filter(t => !t.isNegative).map(t => _normalize(t.text));

  // 2) アクティブなルールを特定
  const activeRules = [];
  rules.forEach(rule => {
    const matched = rule.coreKeywords.some(kw =>
      baseTexts.some(bt => bt.includes(kw.toLowerCase()))
    );
    if (matched) activeRules.push(rule);
  });

  if (activeRules.length === 0) return conflictMap;

  // 3) 各トークンをスキャン
  allTokens.forEach(tok => {
    const tokText = _normalize(tok.text);
    activeRules.forEach(rule => {
      if (!tok.isNegative) {
        const hit = rule.posConflicts.find(kw => tokText.includes(kw.toLowerCase()));
        if (hit && !conflictMap.has(tok.id)) {
          conflictMap.set(tok.id, {
            reason: `Semantic conflict with "${rule.category}" style token`,
            category: rule.category,
            conflictKeyword: hit
          });
        }
      } else {
        const danger = rule.negDangers.find(kw => tokText.includes(kw.toLowerCase()));
        if (danger && !conflictMap.has(tok.id)) {
          conflictMap.set(tok.id, {
            reason: `Dangerous suppression: overlaps with "${rule.category}" (${danger})`,
            category: rule.category,
            conflictKeyword: danger
          });
        }
      }
    });
  });

  return conflictMap;
}

// ============================================================
// メインエクスポート関数
// ============================================================

/**
 * buildPromptStructureJSON
 * ─────────────────────────────────────────────────────────────
 * 現在のプロンプトから構造化JSONを生成する。
 *
 * @param {Array|null} phasesOverride
 *   - 渡された場合、この配列を使用する。
 *   - null / undefined の場合、window.state.phases をフォールバックとして使用。
 *
 * @returns {Object} {
 *   phases: [...],
 *   meta: { totalTokens, activeTokens, positivePhases, negativePhases }
 * }
 */
function buildPromptStructureJSON(phasesOverride) {
  // ── データソースを解決 ──────────────────────────────────────
  let phases = phasesOverride;
  if (!Array.isArray(phases)) {
    if (typeof state !== "undefined" && Array.isArray(state.phases)) {
      phases = state.phases;
    } else if (window.state && Array.isArray(window.state.phases)) {
      phases = window.state.phases;
    } else {
      console.warn("[promptStructureAnalyzer] No phases data available.");
      return { phases: [], meta: { totalTokens: 0, activeTokens: 0, positivePhases: 0, negativePhases: 0 } };
    }
  }

  // ── 全トークンのフラット配列を作成（重複・競合検出用）────────
  const allTokensFlat = [];
  phases.forEach(phase => {
    const tokens = _getPhaseTokens(phase);
    tokens.forEach(tok => {
      allTokensFlat.push({
        id:         tok.id,
        text:       tok.text,
        isActive:   tok.isActive !== false,
        isCore:     !!tok.isCore,
        isNegative: !!phase.isNegative
      });
    });
  });

  const duplicateMap = _detectDuplicates(allTokensFlat);
  const conflictMap  = _detectSemanticConflicts(allTokensFlat);

  // ── フェーズごとに構造化データを生成 ─────────────────────────
  let posIdx = 0;
  let negIdx = 0;
  let globalTokenPosition = 0;

  const structuredPhases = phases
    .filter(phase => phase.isActive !== false)
    .map(phase => {
      const phaseRole = _inferPhaseRole(phase);
      const order     = phase.isNegative ? ++negIdx : ++posIdx;

      const rawTokens = _getPhaseTokens(phase);
      const structuredTokens = rawTokens
        .filter(tok => tok.isActive !== false)
        .map(tok => {
          const tokenRole  = _inferTokenRole(tok.text, phaseRole);
          const position   = ++globalTokenPosition;
          const dupFlag    = duplicateMap.get(tok.id) || null;
          const conflictFlag = conflictMap.get(tok.id) || null;

          const entry = {
            id:       tok.id,
            text:     tok.text,
            weight:   typeof tok.weight === "number" ? tok.weight : 1.0,
            role:     tokenRole,
            isCore:   !!tok.isCore,
            position: position
          };

          // 重複フラグが存在する場合のみ追加
          if (dupFlag) {
            entry.redundancyFlag = {
              type:     dupFlag.type,
              peerText: dupFlag.peerText,
              ...(dupFlag.similarity !== undefined && { similarity: dupFlag.similarity })
            };
          }

          // 競合フラグが存在する場合のみ追加
          if (conflictFlag) {
            entry.conflictFlag = {
              reason:          conflictFlag.reason,
              category:        conflictFlag.category,
              conflictKeyword: conflictFlag.conflictKeyword
            };
          }

          return entry;
        });

      const phaseResult = {
        id:         phase.id,
        name:       phase.name,
        order:      order,
        isNegative: !!phase.isNegative,
        color:      phase.color || "purple",
        phaseRole:  phaseRole,
        tokens:     structuredTokens
      };

      // ポジティブフェーズにはアクティブパターン情報も追加
      if (!phase.isNegative && Array.isArray(phase.patterns)) {
        phaseResult.patternCount       = phase.patterns.length;
        phaseResult.activePatternIndex = typeof phase.activePatternIndex === "number"
          ? phase.activePatternIndex : 0;
        const ap = phase.patterns[phaseResult.activePatternIndex];
        phaseResult.activePatternName  = ap ? ap.patternName : "Pattern 1";
      }

      return phaseResult;
    });

  // ── メタデータ集計 ────────────────────────────────────────────
  const totalTokens    = structuredPhases.reduce((s, p) => s + p.tokens.length, 0);
  const positivePhases = structuredPhases.filter(p => !p.isNegative).length;
  const negativePhases = structuredPhases.filter(p =>  p.isNegative).length;
  const totalWeight    = allTokensFlat
    .reduce((s, t) => {
      const raw = phases
        .flatMap(ph => _getPhaseTokens(ph))
        .find(tk => tk.id === t.id);
      return s + (raw ? (raw.weight || 1.0) : 1.0);
    }, 0);

  const meta = {
    totalTokens:    totalTokens,
    activeTokens:   totalTokens,
    positivePhases: positivePhases,
    negativePhases: negativePhases,
    avgWeight:      totalTokens > 0 ? +(totalWeight / totalTokens).toFixed(3) : 1.0,
    redundantCount: duplicateMap.size,
    conflictCount:  conflictMap.size,
    generatedAt:    new Date().toISOString()
  };

  return { phases: structuredPhases, meta };
}

// グローバルに公開
window.buildPromptStructureJSON = buildPromptStructureJSON;

console.log("[promptStructureAnalyzer] Module loaded. buildPromptStructureJSON() available.");
