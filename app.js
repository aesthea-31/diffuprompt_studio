import {
  CONCEPT_CATEGORIES,
  classifyTokenLocal,
  mapTokensToCategories,
  calculateLayerOrderScore,
  calculateRedundancyControl,
  calculateInformationEfficiency,
  calculateConceptCategoriesScore,
  calculateLayerBalanceScore,
  calculateConceptDiversity
} from './SemanticDensity.js';

// Stable Diffusion Prompt Editor - Core Application Logic

// Initial State
let state = {
  phases: [
    {
      id: "subject",
      name: "Core Subject",
      isActive: true,
      isNegative: false,
      color: "purple", // purple, cyan, fuchsia, emerald, rose, blue
      activePatternIndex: 0,
      patterns: [
        {
          patternName: "Pattern 1",
          tokens: [
            { id: "tok_1", text: "cyberpunk warrior cyborg girl", weight: 1.15, isActive: true },
            { id: "tok_2", text: "futuristic sleek armor", weight: 1.0, isActive: true },
            { id: "tok_3", text: "striking detailed neon eyes", weight: 1.25, isActive: true }
          ]
        }
      ]
    },
    {
      id: "medium",
      name: "Medium & Style",
      isActive: true,
      isNegative: false,
      color: "cyan",
      activePatternIndex: 0,
      patterns: [
        {
          patternName: "Pattern 1",
          tokens: [
            { id: "tok_4", text: "digital painting", weight: 1.0, isActive: true },
            { id: "tok_5", text: "highly detailed concept art", weight: 1.1, isActive: true },
            { id: "tok_6", text: "sharp focus", weight: 1.0, isActive: true }
          ]
        }
      ]
    },
    {
      id: "details",
      name: "Environment & Lighting",
      isActive: true,
      isNegative: false,
      color: "emerald",
      activePatternIndex: 0,
      patterns: [
        {
          patternName: "Pattern 1",
          tokens: [
            { id: "tok_7", text: "neon lit rain-slicked city streets", weight: 1.2, isActive: true },
            { id: "tok_8", text: "volumetric atmospheric fog", weight: 0.9, isActive: true },
            { id: "tok_9", text: "raytracing global illumination", weight: 1.05, isActive: true }
          ]
        }
      ]
    },
    {
      id: "negative",
      name: "Negative Tags",
      isActive: true,
      isNegative: true,
      color: "rose",
      tokens: [
        { id: "tok_10", text: "blurry", weight: 1.0, isActive: true },
        { id: "tok_11", text: "deformed anatomy", weight: 1.0, isActive: true },
        { id: "tok_12", text: "bad hands", weight: 1.0, isActive: true },
        { id: "tok_13", text: "low quality", weight: 1.0, isActive: true }
      ]
    }
  ],
  presets: [],
  activeConcept: null  // 現在選択中のコンセプトID（commit ボタンの有効化に使用）
};

window.state = state;

// Default Built-in Presets
const DEFAULT_PRESETS = [
  {
    id: "preset_photoreal",
    name: "📸 Photorealistic Portrait",
    isBuiltIn: true,
    phases: [
      {
        id: "subj",
        name: "Subject",
        isActive: true,
        isNegative: false,
        color: "purple",
        activePatternIndex: 0,
        patterns: [
          {
            patternName: "Pattern 1",
            tokens: [
              { id: "p1", text: "close up portrait of an elderly man with deep wrinkles", weight: 1.2, isActive: true },
              { id: "p2", text: "thoughtful expression", weight: 1.0, isActive: true },
              { id: "p3", text: "weathered skin texture", weight: 1.15, isActive: true }
            ]
          }
        ]
      },
      {
        id: "cam",
        name: "Camera & Lighting",
        isActive: true,
        isNegative: false,
        color: "cyan",
        activePatternIndex: 0,
        patterns: [
          {
            patternName: "Pattern 1",
            tokens: [
              { id: "p4", text: "shot on 85mm lens", weight: 1.0, isActive: true },
              { id: "p5", text: "f/1.4 aperture", weight: 1.1, isActive: true },
              { id: "p6", text: "dramatic side lighting", weight: 1.2, isActive: true },
              { id: "p7", text: "photorealistic", weight: 1.0, isActive: true }
            ]
          }
        ]
      },
      {
        id: "neg",
        name: "Negative Tags",
        isActive: true,
        isNegative: true,
        color: "rose",
        tokens: [
          { id: "p8", text: "illustration", weight: 1.0, isActive: true },
          { id: "p9", text: "3d render", weight: 1.0, isActive: true },
          { id: "p10", text: "smooth skin", weight: 1.0, isActive: true },
          { id: "p11", text: "bad lighting", weight: 1.0, isActive: true }
        ]
      }
    ]
  },
  {
    id: "preset_anime",
    name: "✨ Cyberpunk Anime",
    isBuiltIn: true,
    phases: [
      {
        id: "subj",
        name: "Subject",
        isActive: true,
        isNegative: false,
        color: "fuchsia",
        activePatternIndex: 0,
        patterns: [
          {
            patternName: "Pattern 1",
            tokens: [
              { id: "a1", text: "anime girl with pastel pink hair", weight: 1.1, isActive: true },
              { id: "a2", text: "oversized hoodie", weight: 1.0, isActive: true },
              { id: "a3", text: "headphones", weight: 1.0, isActive: true }
            ]
          }
        ]
      },
      {
        id: "art",
        name: "Art Style & Environment",
        isActive: true,
        isNegative: false,
        color: "cyan",
        activePatternIndex: 0,
        patterns: [
          {
            patternName: "Pattern 1",
            tokens: [
              { id: "a4", text: "makoto shinkai style", weight: 1.25, isActive: true },
              { id: "a5", text: "vibrant colors", weight: 1.1, isActive: true },
              { id: "a6", text: "shibuya backdrop at night", weight: 1.05, isActive: true },
              { id: "a7", text: "starry sky", weight: 1.0, isActive: true }
            ]
          }
        ]
      },
      {
        id: "neg",
        name: "Negative",
        isActive: true,
        isNegative: true,
        color: "rose",
        tokens: [
          { id: "a8", text: "realistic", weight: 1.0, isActive: true },
          { id: "a9", text: "monochrome", weight: 1.0, isActive: true },
          { id: "a10", text: "blurry", weight: 1.0, isActive: true }
        ]
      }
    ]
  },
  {
    id: "preset_fantasy",
    name: "🏰 Fantasy Landscape",
    isBuiltIn: true,
    phases: [
      {
        id: "subj",
        name: "Core Subject",
        isActive: true,
        isNegative: false,
        color: "emerald",
        activePatternIndex: 0,
        patterns: [
          {
            patternName: "Pattern 1",
            tokens: [
              { id: "f1", text: "majestic medieval castle built into a cliffside", weight: 1.25, isActive: true },
              { id: "f2", text: "cascading waterfalls below", weight: 1.1, isActive: true },
              { id: "f3", text: "ancient stone bridge", weight: 1.0, isActive: true }
            ]
          }
        ]
      },
      {
        id: "mood",
        name: "Atmosphere & Styling",
        isActive: true,
        isNegative: false,
        color: "purple",
        activePatternIndex: 0,
        patterns: [
          {
            patternName: "Pattern 1",
            tokens: [
              { id: "f4", text: "golden hour light", weight: 1.2, isActive: true },
              { id: "f5", text: "misty valley", weight: 1.1, isActive: true },
              { id: "f6", text: "fantasy concept art", weight: 1.0, isActive: true },
              { id: "f7", text: "trending on artstation", weight: 1.05, isActive: true }
            ]
          }
        ]
      },
      {
        id: "neg",
        name: "Negative Tags",
        isActive: true,
        isNegative: true,
        color: "rose",
        tokens: [
          { id: "f8", text: "cars", weight: 1.0, isActive: true },
          { id: "f9", text: "modern buildings", weight: 1.0, isActive: true },
          { id: "f10", text: "lowres", weight: 1.0, isActive: true }
        ]
      }
    ]
  }
];

// Color Maps for Tailwind
const COLOR_CLASSES = {
  purple: {
    border: "border-purple-500/30",
    borderFocus: "focus-within:border-purple-500",
    bg: "bg-purple-950/20",
    badgeBg: "bg-purple-900/40 text-purple-200 border-purple-500/30",
    badgeGlow: "shadow-[0_0_8px_rgba(168,85,247,0.2)]",
    slider: "slider-purple",
    accent: "text-purple-400",
    fill: "bg-purple-500"
  },
  cyan: {
    border: "border-cyan-500/30",
    borderFocus: "focus-within:border-cyan-500",
    bg: "bg-cyan-950/20",
    badgeBg: "bg-cyan-900/40 text-cyan-200 border-cyan-500/30",
    badgeGlow: "shadow-[0_0_8px_rgba(6,182,212,0.2)]",
    slider: "slider-cyan",
    accent: "text-cyan-400",
    fill: "bg-cyan-500"
  },
  emerald: {
    border: "border-emerald-500/30",
    borderFocus: "focus-within:border-emerald-500",
    bg: "bg-emerald-950/20",
    badgeBg: "bg-emerald-900/40 text-emerald-200 border-emerald-500/30",
    badgeGlow: "shadow-[0_0_8px_rgba(16,185,129,0.2)]",
    slider: "slider-cyan",
    accent: "text-emerald-400",
    fill: "bg-emerald-500"
  },
  fuchsia: {
    border: "border-fuchsia-500/30",
    borderFocus: "focus-within:border-fuchsia-500",
    bg: "bg-fuchsia-950/20",
    badgeBg: "bg-fuchsia-900/40 text-fuchsia-200 border-fuchsia-500/30",
    badgeGlow: "shadow-[0_0_8px_rgba(217,70,239,0.2)]",
    slider: "slider-purple",
    accent: "text-fuchsia-400",
    fill: "bg-fuchsia-500"
  },
  rose: {
    border: "border-rose-500/30",
    borderFocus: "focus-within:border-rose-500",
    bg: "bg-rose-950/20",
    badgeBg: "bg-rose-900/40 text-rose-200 border-rose-500/30",
    badgeGlow: "shadow-[0_0_8px_rgba(244,63,94,0.2)]",
    slider: "slider-rose",
    accent: "text-rose-400",
    fill: "bg-rose-500"
  },
  blue: {
    border: "border-blue-500/30",
    borderFocus: "focus-within:border-blue-500",
    bg: "bg-blue-950/20",
    badgeBg: "bg-blue-900/40 text-blue-200 border-blue-500/30",
    badgeGlow: "shadow-[0_0_8px_rgba(59,130,246,0.2)]",
    slider: "slider-cyan",
    accent: "text-blue-400",
    fill: "bg-blue-500"
  }
};

const PHASE_COLORS = ["purple", "cyan", "emerald", "fuchsia", "blue", "rose"];

// Semantic Conflict Warning Rules
const SEMANTIC_CONFLICT_RULES = [
  {
    category: "Watercolor",
    coreKeywords: ["watercolor", "chromatic-wash", "transparent", "water color"],
    posConflicts: ["metallic edge lighting", "glossy surface", "plastic", "octane render", "unreal engine", "3d render"],
    negDangers: ["grain over-equalization bias", "tonal smoothing tendency", "brushstroke", "paint bleed"]
  },
  {
    category: "Rococo Fashion",
    coreKeywords: ["rococo", "18th century", "18th-rococo", "ladies fashion", "marie antoinette"],
    posConflicts: ["ebony-embroidered attire", "yin-yang embrem", "cyberpunk", "modern clothing", "t-shirt"],
    negDangers: ["layered fashion", "lace", "ruffles", "frills", "ornate", "corset"]
  },
  {
    category: "Golden Hour",
    coreKeywords: ["golden hour", "diffused light rays", "warm golden", "sunset lighting", "golden lighting"],
    posConflicts: ["cool dusk-colored atmosphere", "muted color", "cold lighting", "blue hour", "harsh lighting"],
    negDangers: ["luminance over-amplification bias", "warm tone", "orange glow", "sunlight", "rays"]
  },
  {
    category: "Anime",
    coreKeywords: ["anime", "cel-shading", "anime style", "manga", "studio ghibli"],
    posConflicts: ["photorealistic", "3d render", "hyper-realistic", "photography"],
    negDangers: ["flat color", "outline", "2d", "illustration", "drawing"]
  },
  {
    category: "Photorealistic",
    coreKeywords: ["photorealistic", "shot on", "photography", "raw photo", "8k resolution", "dslr"],
    posConflicts: ["anime style", "watercolor style", "oil painting", "illustration", "drawing", "cartoon"],
    negDangers: ["film grain", "bokeh", "depth of field", "lens flare", "photographic"]
  },
  {
    category: "Oil Painting",
    coreKeywords: ["oil painting", "impasto", "old master", "canvas painting", "classic painting"],
    posConflicts: ["digital art", "vector art", "low poly", "pixel art"],
    negDangers: ["brushstroke", "canvas texture", "oil paint", "thick paint", "texture"]
  },
  {
    category: "Cyberpunk",
    coreKeywords: ["cyberpunk", "neon lit", "synthwave", "neon glow", "futuristic city"],
    posConflicts: ["natural lighting", "soft pastel", "rustic", "medieval", "vintage"],
    negDangers: ["neon", "glow", "rain", "fog", "city lights", "vibrant colors"]
  },
  {
    category: "Fantasy",
    coreKeywords: ["fantasy", "ethereal", "mystical", "magical", "fantasy concept art"],
    posConflicts: ["industrial", "brutalist", "modern", "sci-fi", "cyberpunk"],
    negDangers: ["sparkle", "mist", "ambient glow", "magic", "fantasy elements"]
  }
];

// (Duplicate ASSESSMENT_TARGETS removed)

function computeTokenConflicts() {
  const conflictMap = new Map();
  const coreTokens = [];

  // 1. Collect all active core tokens from positive phases
  state.phases.forEach(phase => {
    if (!phase.isActive || phase.isNegative) return;
    const tokens = getPhaseTokens(phase);
    tokens.forEach(tok => {
      if (tok.isActive && tok.isCore) {
        coreTokens.push(tok.text.toLowerCase());
      }
    });
  });

  if (coreTokens.length === 0) return conflictMap;

  // 2. Find matching rules for the core tokens
  const activeRules = [];
  coreTokens.forEach(coreText => {
    SEMANTIC_CONFLICT_RULES.forEach(rule => {
      if (rule.coreKeywords.some(kw => coreText.includes(kw.toLowerCase()))) {
        activeRules.push({ coreText, rule });
      }
    });
  });

  if (activeRules.length === 0) return conflictMap;

  // 3. Scan all tokens for conflicts based on active rules
  state.phases.forEach(phase => {
    if (!phase.isActive) return;
    const tokens = getPhaseTokens(phase);
    tokens.forEach(tok => {
      if (!tok.isActive) return;

      const tokText = tok.text.toLowerCase();

      activeRules.forEach(({ coreText, rule }) => {
        if (!phase.isNegative) {
          // Check posConflicts
          const conflict = rule.posConflicts.find(kw => tokText.includes(kw.toLowerCase()));
          if (conflict) {
            conflictMap.set(tok.id, {
              type: 'pos',
              reason: `Semantically conflicts with Core Token "${coreText}" (Category: ${rule.category})`,
              coreText,
              ruleName: rule.category
            });
          }
        } else {
          // Check negDangers
          const danger = rule.negDangers.find(kw => tokText.includes(kw.toLowerCase()));
          if (danger) {
            conflictMap.set(tok.id, {
              type: 'neg',
              reason: `Dangerous suppression: Overlaps with Core Token "${coreText}" (Category: ${rule.category})`,
              coreText,
              ruleName: rule.category
            });
          }
        }
      });
    });
  });

  return conflictMap;
}
function parseTokenWeightIfNeeded(token) {
  if (!token || !token.text) return;
  let term = token.text.trim();
  let weight = token.weight !== undefined && token.weight !== null ? token.weight : 1.0;
  let cleanText = term;

  // Pattern: (text:1.23)
  let explicitWeightMatch = term.match(/^[\(\[]*(.*?)\s*:\s*([0-9.]+)\s*[\)\]]*$/);
  if (explicitWeightMatch) {
    cleanText = explicitWeightMatch[1].trim();
    weight = parseFloat(explicitWeightMatch[2]);
  } else {
    // Count leading/trailing parentheses or brackets
    let leadingP = 0;
    let trailingP = 0;
    while (term[leadingP] === '(') leadingP++;
    while (term[term.length - 1 - trailingP] === ')') trailingP++;

    let pCount = Math.min(leadingP, trailingP);
    if (pCount > 0) {
      cleanText = term.substring(pCount, term.length - pCount).trim();
      weight = Math.round(Math.pow(1.1, pCount) * 100) / 100;
    } else {
      // Brackets (reduce weight)
      let leadingB = 0;
      let trailingB = 0;
      while (term[leadingB] === '[') leadingB++;
      while (term[term.length - 1 - trailingB] === ']') trailingB++;

      let bCount = Math.min(leadingB, trailingB);
      if (bCount > 0) {
        cleanText = term.substring(bCount, term.length - bCount).trim();
        weight = Math.round(Math.pow(0.9, bCount) * 100) / 100;
      }
    }
  }

  // Clean up any remaining brackets/parentheses inside if they slipped through
  cleanText = cleanText.replace(/[()\[\]]/g, '').trim();
  cleanText = cleanText.replace(/:[0-9.]+$/, '').trim();

  token.text = cleanText;
  token.weight = weight;
}

function ensurePhaseStructure(phase) {
  if (phase.isNegative) {
    if (!phase.tokens) phase.tokens = [];
    phase.tokens.forEach(parseTokenWeightIfNeeded);
  } else {
    if (!phase.patterns || phase.patterns.length === 0) {
      phase.patterns = [
        {
          patternName: "Pattern 1",
          tokens: phase.tokens || []
        }
      ];
      delete phase.tokens;
    }
    if (phase.activePatternIndex === undefined || phase.activePatternIndex === null) {
      phase.activePatternIndex = 0;
    }
    phase.patterns.forEach(pat => {
      if (!pat.tokens) pat.tokens = [];
      pat.tokens.forEach(parseTokenWeightIfNeeded);
    });
  }
  return phase;
}


function getPhaseTokens(phase) {
  if (phase.isNegative) {
    return phase.tokens || [];
  } else {
    if (!phase.patterns || phase.patterns.length === 0) {
      ensurePhaseStructure(phase);
    }
    if (phase.activePatternIndex >= phase.patterns.length) {
      phase.activePatternIndex = phase.patterns.length - 1;
    }
    if (phase.activePatternIndex < 0) {
      phase.activePatternIndex = 0;
    }
    const currentPattern = phase.patterns[phase.activePatternIndex];
    if (!currentPattern) {
      phase.patterns[phase.activePatternIndex] = {
        patternName: `Pattern ${phase.activePatternIndex + 1}`,
        tokens: []
      };
    }
    return phase.patterns[phase.activePatternIndex].tokens;
  }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  await loadPresetsFromFirestore();
  state.phases.forEach(ensurePhaseStructure);
  renderApp();
  setupGlobalEvents();
  initTabControl();
});

// ============================================================
// Tab Control — Bottom Navigation Bar
// Manages page visibility and active button styling.
// Safe to call even if index.html inline script already ran
// (guarded by window.__tabControlInitialized flag).
// ============================================================
function initTabControl() {
  // Guard: if the inline <script> in index.html already set up listeners, skip.
  if (window.__tabControlInitialized) return;
  window.__tabControlInitialized = true;

  const PAGE_IDS = ['workspace', 'library', 'compile', 'generate', 'analysis'];

  const ACTIVE_COLORS = {
    library: 'text-purple-400',
    workspace: 'text-cyan-400',
    compile: 'text-cyan-400',
    generate: 'text-amber-400',
    analysis: 'text-indigo-400',
  };

  // 1. Initial state: show only page-workspace, hide all others.
  PAGE_IDS.forEach(function (pageId) {
    const el = document.getElementById('page-' + pageId);
    if (!el) return;
    if (pageId === 'workspace') {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // 2. Tab switch function.
  function switchTab(tab) {
    // Hide all pages.
    PAGE_IDS.forEach(function (pageId) {
      const el = document.getElementById('page-' + pageId);
      if (el) el.classList.add('hidden');
    });
    // Show the target page.
    const target = document.getElementById('page-' + tab);
    if (target) target.classList.remove('hidden');

    // Update button active/default colours.
    document.querySelectorAll('.nav-tab-btn').forEach(function (btn) {
      const btnTab = btn.getAttribute('data-tab');
      const icon = btn.querySelector('i');
      const span = btn.querySelector('span');

      // Reset to default colour.
      btn.classList.remove(
        'text-cyan-400', 'text-purple-400', 'text-amber-400', 'text-indigo-400',
        'bg-slate-800/60'
      );
      btn.classList.add('text-slate-400');
      if (icon) { icon.classList.remove('text-cyan-400', 'text-purple-400', 'text-amber-400', 'text-indigo-400'); icon.classList.add('text-slate-400'); }
      if (span) { span.classList.remove('text-cyan-400', 'text-purple-400', 'text-amber-400', 'text-indigo-400'); span.classList.add('text-slate-400'); }

      if (btnTab === tab) {
        // Apply active colour.
        const activeColor = ACTIVE_COLORS[tab] || 'text-cyan-400';
        btn.classList.remove('text-slate-400');
        btn.classList.add(activeColor, 'bg-slate-800/60');
        if (icon) { icon.classList.remove('text-slate-400'); icon.classList.add(activeColor); }
        if (span) { span.classList.remove('text-slate-400'); span.classList.add(activeColor); }
      }
    });
  }

  // 3. Attach click listeners to all nav buttons.
  document.querySelectorAll('.nav-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // 4. Set initial active tab to workspace.
  switchTab('workspace');
}

// Load presets from Firestore presets collection
async function loadPresetsFromFirestore() {
  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Falling back to empty presets.");
      state.presets = [];
      return;
    }
    const { collection, getDocs } = window.firestore;
    const db = window.db;

    const presetsCol = collection(db, "presets");
    const snapshot = await getDocs(presetsCol);
    state.presets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("Presets successfully loaded from Firestore:", state.presets);
  } catch (e) {
    console.error("Failed to load presets from Firestore:", e);
    state.presets = [];
  }
}

// Save presets to Firestore presets collection
async function savePresetsToFirestore() {
  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Cannot save presets.");
      return;
    }
    const { doc, setDoc, deleteDoc, collection, getDocs } = window.firestore;
    const db = window.db;

    // 1. Retrieve all existing presets in Firestore to find deleted ones
    const presetsCol = collection(db, "presets");
    const snapshot = await getDocs(presetsCol);
    const existingIds = snapshot.docs.map(d => d.id);

    // 2. Identify and delete presets that are no longer in local state.presets
    const currentIds = state.presets.map(p => p.id);
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));
    for (const id of idsToDelete) {
      const presetRef = doc(db, "presets", id);
      await deleteDoc(presetRef);
    }

    // 3. Save / update all current presets from local state.presets in Firestore
    for (const preset of state.presets) {
      const presetId = preset.id || `preset_${Date.now()}`;
      const presetRef = doc(db, "presets", presetId);
      await setDoc(presetRef, preset);
    }

    console.log("Presets successfully saved/synced to Firestore.");
  } catch (error) {
    console.error("Error saving presets to Firestore: ", error);
  }
}

// Global Event Listeners
function setupGlobalEvents() {
  // Add Phase button
  document.getElementById("btn-add-phase").addEventListener("click", () => {
    const input = document.getElementById("input-new-phase-name");
    const name = input.value.trim();
    if (!name) return;

    const isNegative = document.getElementById("checkbox-new-phase-neg").checked;

    // Choose next color sequentially
    const color = PHASE_COLORS[state.phases.length % PHASE_COLORS.length];

    const newPhase = {
      id: "phase_" + Date.now(),
      name: name,
      isActive: true,
      isNegative: isNegative,
      color: color,
      tokens: [] // ensurePhaseStructure will migrate this to patterns[] for positive phases
    };
    ensurePhaseStructure(newPhase);
    state.phases.push(newPhase);

    input.value = "";
    document.getElementById("checkbox-new-phase-neg").checked = false;
    showToast(`Phase "${name}" created!`);
    renderApp();
  });

  // Import / Paste Area
  document.getElementById("btn-parse-prompt").addEventListener("click", () => {
    const inputArea = document.getElementById("textarea-raw-import");
    const text = inputArea.value.trim();
    if (!text) {
      showToast("Please paste a prompt first!", "warning");
      return;
    }

    const parsedPhases = parseRawPrompt(text);

    if (parsedPhases.length === 0) {
      showToast("Could not extract any tokens.", "error");
      return;
    }

    let tokenCount = 0;
    parsedPhases.forEach((phase, index) => {
      const importedPhase = {
        id: "phase_imported_" + Date.now() + "_" + index,
        name: phase.name,
        isActive: true,
        isNegative: phase.isNegative,
        color: phase.isNegative ? "rose" : "purple",
        tokens: phase.tokens // ensurePhaseStructure migrates to patterns[] if positive
      };
      ensurePhaseStructure(importedPhase);
      state.phases.push(importedPhase);
      tokenCount += phase.tokens.length;
    });

    inputArea.value = "";
    showToast(`Imported ${tokenCount} tokens into ${parsedPhases.length} phases!`);
    renderApp();
  });

  // Preset Save
  document.getElementById("btn-save-preset").addEventListener("click", async () => {
    const input = document.getElementById("input-preset-name");
    const name = input.value.trim();
    if (!name) {
      showToast("Please enter a preset name", "warning");
      return;
    }

    const newPreset = {
      id: "preset_" + Date.now(),
      name: name,
      isBuiltIn: false,
      phases: JSON.parse(JSON.stringify(state.phases)) // deep copy
    };

    state.presets.push(newPreset);
    await savePresetsToFirestore();
    input.value = "";
    showToast(`Preset "${name}" saved!`);
    renderApp();
  });

  // Copy Buttons
  document.getElementById("btn-copy-pos").addEventListener("click", () => {
    const val = document.getElementById("output-pos-prompt").value;
    copyToClipboard(val, "Positive Prompt copied!");
  });

  document.getElementById("btn-copy-neg").addEventListener("click", () => {
    const val = document.getElementById("output-neg-prompt").value;
    copyToClipboard(val, "Negative Prompt copied!");
  });

  document.getElementById("btn-copy-combined").addEventListener("click", () => {
    const pos = document.getElementById("output-pos-prompt").value;
    const neg = document.getElementById("output-neg-prompt").value;
    let combined = pos;
    if (neg) {
      combined += `\nNegative prompt: ${neg}`;
    }
    copyToClipboard(combined, "Full prompt bundle copied!");
  });

  // Export Presets JSON
  document.getElementById("btn-export-presets").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.presets));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `diffuprompt_presets_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Presets exported successfully!");
  });

  // Import Presets JSON Trigger
  document.getElementById("file-import-presets").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          state.presets = [...state.presets, ...imported];
          await savePresetsToFirestore();
          showToast(`Imported ${imported.length} presets!`);
          renderApp();
        } else {
          showToast("Invalid preset file format.", "error");
        }
      } catch (err) {
        showToast("Error parsing preset file.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  });

  // Clear All Prompt data
  document.getElementById("btn-clear-all").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all phases and tokens?")) {
      state.phases = [];
      state.activeConcept = null;
      updateCommitButton();
      showToast("Workspace cleared.");
      renderApp();
    }
  });

  // Reset to Default structure
  document.getElementById("btn-reset-default").addEventListener("click", () => {
    if (confirm("Reset layout to default starter setup?")) {
      state.phases = [
        {
          id: "subject",
          name: "Core Subject",
          isActive: true,
          isNegative: false,
          color: "purple",
          activePatternIndex: 0,
          patterns: [
            {
              patternName: "Pattern 1",
              tokens: [
                { id: "tok_1", text: "cyberpunk warrior cyborg girl", weight: 1.15, isActive: true, isCore: false },
                { id: "tok_2", text: "futuristic sleek armor", weight: 1.0, isActive: true, isCore: false },
                { id: "tok_3", text: "striking detailed neon eyes", weight: 1.25, isActive: true, isCore: false }
              ]
            }
          ]
        },
        {
          id: "medium",
          name: "Medium & Style",
          isActive: true,
          isNegative: false,
          color: "cyan",
          activePatternIndex: 0,
          patterns: [
            {
              patternName: "Pattern 1",
              tokens: [
                { id: "tok_4", text: "digital painting", weight: 1.0, isActive: true, isCore: false },
                { id: "tok_5", text: "highly detailed concept art", weight: 1.1, isActive: true, isCore: false }
              ]
            }
          ]
        },
        {
          id: "negative",
          name: "Negative Tags",
          isActive: true,
          isNegative: true,
          color: "rose",
          tokens: [
            { id: "tok_10", text: "blurry", weight: 1.0, isActive: true },
            { id: "tok_11", text: "low quality", weight: 1.0, isActive: true }
          ]
        }
      ];
      showToast("Workspace reset to starter layout.");
      renderApp();
    }
  });
}

// Toast System
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  let bg = "bg-slate-900/95 border-emerald-500/40 text-emerald-300";
  let icon = "fa-circle-check";

  if (type === "warning") {
    bg = "bg-slate-900/95 border-amber-500/40 text-amber-300";
    icon = "fa-circle-exclamation";
  } else if (type === "error") {
    bg = "bg-slate-900/95 border-rose-500/40 text-rose-400";
    icon = "fa-triangle-exclamation";
  }

  toast.className = `toast-notification glass-panel px-4 py-3 rounded-lg border flex items-center gap-3 shadow-2xl ${bg}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span class="text-sm font-medium">${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after animation completes (3s total)
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Copy to Clipboard
function copyToClipboard(text, successMsg) {
  if (!text) {
    showToast("Prompt is empty, nothing to copy!", "warning");
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast(successMsg);
    })
    .catch(err => {
      showToast("Copy failed, please copy manually.", "error");
    });
}

// Parse Raw Prompt
function parseRawPrompt(rawText) {
  const lines = rawText.split('\n');
  const phases = [];

  // Patterns to detect polarity at the beginning of a line
  const posRegex = /^(?:Positive|pos)[\:\;]\s*/i;
  const negRegex = /^(?:Negative|neg)[\:\;]\s*|^(?:Negative prompt:)\s*|^--n(?:o)?\s+/i;

  function blockToTokens(textBlock) {
    if (!textBlock.trim()) return [];

    // Split by commas, handling parenthetical chunks safely
    let rawParts = textBlock.split(',');
    let parsed = [];

    for (let part of rawParts) {
      let term = part.trim();
      if (!term) continue;

      let weight = 1.0;
      let cleanText = term;

      // Pattern: (text:1.23)
      let explicitWeightMatch = term.match(/^[\(\[]*(.*?)\s*:\s*([0-9.]+)\s*[\)\]]*$/);
      if (explicitWeightMatch) {
        cleanText = explicitWeightMatch[1].trim();
        weight = parseFloat(explicitWeightMatch[2]);
      } else {
        // Count leading/trailing parentheses or brackets
        let leadingP = 0;
        let trailingP = 0;
        while (term[leadingP] === '(') leadingP++;
        while (term[term.length - 1 - trailingP] === ')') trailingP++;

        let pCount = Math.min(leadingP, trailingP);
        if (pCount > 0) {
          cleanText = term.substring(pCount, term.length - pCount).trim();
          weight = Math.round(Math.pow(1.1, pCount) * 100) / 100;
        } else {
          // Brackets (reduce weight)
          let leadingB = 0;
          let trailingB = 0;
          while (term[leadingB] === '[') leadingB++;
          while (term[term.length - 1 - trailingB] === ']') trailingB++;

          let bCount = Math.min(leadingB, trailingB);
          if (bCount > 0) {
            cleanText = term.substring(bCount, term.length - bCount).trim();
            weight = Math.round(Math.pow(0.9, bCount) * 100) / 100;
          }
        }
      }

      // Fallback clean text: strip extra brackets/parentheses inside if they slipped through
      cleanText = cleanText.replace(/[()\[\]]/g, '').trim();
      cleanText = cleanText.replace(/:[0-9.]+$/, '').trim();
      if (!cleanText) continue;

      parsed.push({
        id: "tok_" + Math.random().toString(36).substr(2, 9),
        text: cleanText,
        weight: weight,
        isActive: true,
        isCore: false
      });
    }
    return parsed;
  }

  let phaseIndex = 1;
  let currentPolarityIsNegative = false; // Maintain polarity across lines

  lines.forEach(line => {
    let cleanLine = line.trim();
    if (!cleanLine) return;

    // Check if the line changes the polarity
    if (negRegex.test(cleanLine)) {
      currentPolarityIsNegative = true;
      cleanLine = cleanLine.replace(negRegex, '').trim();
    } else if (posRegex.test(cleanLine)) {
      currentPolarityIsNegative = false;
      cleanLine = cleanLine.replace(posRegex, '').trim();
    }

    if (!cleanLine) return;

    const tokens = blockToTokens(cleanLine);
    if (tokens.length > 0) {
      phases.push({
        name: `Imported ${currentPolarityIsNegative ? 'Negative' : 'Positive'} ${phaseIndex++}`,
        isNegative: currentPolarityIsNegative,
        tokens: tokens
      });
    }
  });

  return phases;
}

// Compile Final Prompt Strings
function compilePrompts() {
  let positiveStrings = [];
  let negativeStrings = [];

  state.phases.forEach(phase => {
    if (!phase.isActive) return;

    let phaseStrings = [];
    const tokens = getPhaseTokens(phase);
    tokens.forEach(tok => {
      if (!tok.isActive) return;

      let weight = parseFloat(tok.weight);
      let term = tok.text.trim();

      if (weight === 1.0) {
        phaseStrings.push(term);
      } else {
        let weightStr = weight.toFixed(3).replace(/\.?0+$/, "");
        phaseStrings.push(`(${term}:${weightStr})`);
      }
    });

    if (phaseStrings.length > 0) {
      let joined = phaseStrings.join(", ");
      if (phase.isNegative) {
        negativeStrings.push(joined);
      } else {
        positiveStrings.push(joined);
      }
    }
  });

  return {
    pos: positiveStrings.join(", \n"),
    neg: negativeStrings.join(", \n")
  };
}

// Re-render the whole interface
function renderApp() {
  renderPhases();
  renderPresets();
  updateOutput();
}

// Update outputs, characters count, approximate token count
function updateOutput() {
  const prompts = compilePrompts();

  const posTextarea = document.getElementById("output-pos-prompt");
  const negTextarea = document.getElementById("output-neg-prompt");

  posTextarea.value = prompts.pos;
  negTextarea.value = prompts.neg;

  // Update positive counts
  document.getElementById("pos-char-count").innerText = prompts.pos.length;
  // Estimate tokens (roughly 1 token = 4 characters as a rule of thumb, or word counts + weights)
  let posTokensEst = prompts.pos ? prompts.pos.split(/[\s,]+/).filter(Boolean).length : 0;
  document.getElementById("pos-token-count").innerText = posTokensEst;

  // Update negative counts
  document.getElementById("neg-char-count").innerText = prompts.neg.length;
  let negTokensEst = prompts.neg ? prompts.neg.split(/[\s,]+/).filter(Boolean).length : 0;
  document.getElementById("neg-token-count").innerText = negTokensEst;
}

// Render Preset lists
function renderPresets() {
  const container = document.getElementById("preset-list-container");
  container.innerHTML = "";

  const allPresets = [...DEFAULT_PRESETS, ...state.presets];

  if (allPresets.length === 0) {
    container.innerHTML = `<p class="text-slate-500 text-xs text-center py-4">No saved presets.</p>`;
    return;
  }

  allPresets.forEach(preset => {
    const card = document.createElement("div");
    card.className = "flex items-center justify-between p-2.5 rounded-lg border border-slate-700/40 bg-slate-800/20 hover:bg-slate-850 hover:border-slate-600 transition group";

    let actionsHtml = "";
    if (preset.isBuiltIn) {
      actionsHtml = `<span class="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">Built-in</span>`;
    } else {
      actionsHtml = `
        <button class="btn-delete-preset text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition p-1" data-id="${preset.id}">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      `;
    }

    card.innerHTML = `
      <button class="btn-load-preset text-left flex-grow text-sm font-medium text-slate-300 hover:text-cyan-400 transition" data-id="${preset.id}">
        ${preset.name}
      </button>
      <div class="flex items-center gap-2">
        ${actionsHtml}
      </div>
    `;

    container.appendChild(card);
  });

  // Add listeners to presets
  container.querySelectorAll(".btn-load-preset").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = btn.getAttribute("data-id");
      const targetPreset = allPresets.find(p => p.id === id);
      if (targetPreset) {
        state.phases = JSON.parse(JSON.stringify(targetPreset.phases)); // deep copy
        showToast(`Loaded preset "${targetPreset.name}"`);
        renderApp();
      }
    });
  });

  container.querySelectorAll(".btn-delete-preset").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const index = state.presets.findIndex(p => p.id === id);
      if (index !== -1) {
        const name = state.presets[index].name;
        state.presets.splice(index, 1);
        await savePresetsToFirestore();
        showToast(`Preset "${name}" deleted.`, "warning");
        renderApp();
      }
    });
  });
}

let animatingPhases = {};

window.switchPattern = function (phaseId, dir) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase || phase.isNegative) return;
  const newIndex = phase.activePatternIndex + dir;
  if (newIndex >= 0 && newIndex < phase.patterns.length) {
    const phaseEl = document.querySelector(`[data-phase-id="${phaseId}"]`);
    const tokenArea = phaseEl ? phaseEl.querySelector('.token-area-3d') : null;
    if (tokenArea) {
      // 1. Outward 3D flip effect
      tokenArea.style.transition = 'transform 0.18s ease-in, opacity 0.18s ease-in';
      tokenArea.style.transform = 'perspective(1000px) rotateY(-90deg)';
      tokenArea.style.opacity = '0';

      setTimeout(() => {
        // 2. Update status and render with flip-enter
        phase.activePatternIndex = newIndex;
        animatingPhases[phaseId] = true;
        renderApp();
      }, 180);
    } else {
      phase.activePatternIndex = newIndex;
      renderApp();
    }
  }
};

window.addPattern = function (phaseId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase || phase.isNegative) return;
  if (phase.patterns.length >= 10) {
    showToast("パターン数は最大10個までです。", "warning");
    return;
  }
  const nextNum = phase.patterns.length + 1;
  phase.patterns.push({
    patternName: `Pattern ${nextNum}`,
    tokens: []
  });
  phase.activePatternIndex = phase.patterns.length - 1;
  animatingPhases[phaseId] = true;
  showToast(`Pattern ${nextNum} created!`);
  renderApp();
};

window.startEditPhaseTitle = function (phaseId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const container = document.getElementById(`phase-title-container-${phaseId}`);
  if (!container) return;

  container.innerHTML = `
    <input type="text" 
           id="edit-phase-title-input-${phaseId}" 
           value="${phase.name}" 
           class="bg-slate-950/80 border border-slate-700 rounded px-2.5 py-0.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500 w-48"
           onkeydown="handleEditPhaseTitleKeydown(event, '${phaseId}')"
           onblur="savePhaseTitle('${phaseId}')"
    >
  `;

  const input = document.getElementById(`edit-phase-title-input-${phaseId}`);
  if (input) {
    input.focus();
    input.select();
  }
};

window.handleEditPhaseTitleKeydown = function (e, phaseId) {
  if (e.key === "Enter") {
    e.preventDefault();
    savePhaseTitle(phaseId);
  } else if (e.key === "Escape") {
    renderApp();
  }
};

window.savePhaseTitle = function (phaseId) {
  const input = document.getElementById(`edit-phase-title-input-${phaseId}`);
  if (!input) return;

  const newName = input.value.trim();
  const phase = state.phases.find(p => p.id === phaseId);
  if (phase && newName) {
    phase.name = newName;
    showToast(`Phase renamed to "${newName}"`);
  }
  renderApp();
};

// ============================================================
// GEMINI ANALYSIS BINDINGS
// ============================================================

/**
 * _piaBindings
 * Gemini解析結果をトークンUIにバインドするための正規化ストア。
 * renderPhases() が参照し、バッジを付与する。
 *
 * 構造:
 *   tokenBadges : Map<tokenTextLower, { type, reason }[]>
 *     type: 'geminiConflict' | 'dangerPos' | 'dangerNeg' | 'layerOrderToken'
 *   phaseFlags  : Map<phaseNameLower, Set<'layerOrder'|'phaseHierarchy'>>
 */
window._piaBindings = {
  tokenBadges: new Map(), // key: token text (lowercase)
  phaseFlags: new Map(), // key: phase name (lowercase)
};

/**
 * applyGeminiAnalysisBindings
 * Gemini解析結果(result)を_piaBindingsに正規化して格納し、
 * renderPhases()を呼び出してUIを更新する。
 *
 * @param {Object} result - fetchGeminiPromptAnalysis() の戻り値
 */
function applyGeminiAnalysisBindings(result) {
  const tb = new Map();
  const pf = new Map();

  function addTokenBadge(textRaw, badge) {
    if (!textRaw) return;
    const key = String(textRaw).toLowerCase().trim();
    if (!tb.has(key)) tb.set(key, []);
    tb.get(key).push(badge);
  }

  function addPhaseFlag(phaseNameRaw, flag) {
    if (!phaseNameRaw) return;
    const key = String(phaseNameRaw).toLowerCase().trim();
    if (!pf.has(key)) pf.set(key, new Set());
    pf.get(key).add(flag);
  }

  // 1. Semantic Conflicts → geminiConflict バッジ
  (result.semanticConflicts || []).forEach(c => {
    const reason = c.description || '';
    if (c.tokenA) addTokenBadge(c.tokenA, { type: 'geminiConflict', reason });
    if (c.tokenB) addTokenBadge(c.tokenB, { type: 'geminiConflict', reason });
  });

  // 2. Danger Positives → dangerPos バッジ
  (result.dangerPositives || []).forEach(d => {
    addTokenBadge(d.text || d.token, { type: 'dangerPos', reason: d.reason || '' });
  });

  // 3. Danger Negatives → dangerNeg バッジ
  (result.dangerNegatives || []).forEach(d => {
    addTokenBadge(d.text || d.token, { type: 'dangerNeg', reason: d.reason || '' });
  });

  // 4. Layer Order — Token Ordering → layerOrderToken バッジ
  (result.incorrectTokenOrdering || []).forEach(o => {
    addTokenBadge(o.token, { type: 'layerOrderToken', reason: `Move: ${o.currentPhase} → ${o.suggestedPhase}. ${o.reason || ''}` });
    // 現在のフェーズにもフラグ
    if (o.currentPhase) addPhaseFlag(o.currentPhase, 'layerOrder');
  });

  // 5. Layer Order — Phase Hierarchy → phaseHierarchy フラグ
  (result.phaseHierarchyProblems || []).forEach(p => {
    if (p.phase) addPhaseFlag(p.phase, 'phaseHierarchy');
  });

  window._piaBindings.tokenBadges = tb;
  window._piaBindings.phaseFlags = pf;

  // UIを再描画して反映
  renderPhases();
}
window.applyGeminiAnalysisBindings = applyGeminiAnalysisBindings;

// Render Phases & Tokens
function renderPhases() {
  // ENFORCE STRICT ORDER: Positive phases always above Negative phases
  const posPhases = state.phases.filter(p => !p.isNegative);
  const negPhases = state.phases.filter(p => p.isNegative);
  state.phases = [...posPhases, ...negPhases];

  const container = document.getElementById("phases-container");
  container.innerHTML = "";

  if (state.phases.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-700/50 rounded-xl bg-slate-900/20">
        <i class="fa-solid fa-folder-open text-slate-600 text-4xl mb-4"></i>
        <h3 class="text-lg font-semibold text-slate-400 mb-1">Your prompt board is empty</h3>
        <p class="text-sm text-slate-500 mb-4 max-w-sm">Add a new phase above, parse a raw prompt, or load a preset to start building your layout.</p>
        <button id="btn-quick-init" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-500 hover:to-cyan-500 transition text-sm font-semibold shadow-lg shadow-purple-500/20">
          Load Starter Layout
        </button>
      </div>
    `;

    // Add quick start button listener
    const quickInit = document.getElementById("btn-quick-init");
    if (quickInit) {
      quickInit.addEventListener("click", () => {
        document.getElementById("btn-reset-default").click();
      });
    }
    return;
  }

  const conflictMap = computeTokenConflicts();
  const piaBindings = window._piaBindings || { tokenBadges: new Map(), phaseFlags: new Map() };

  state.phases.forEach((phase, phaseIndex) => {
    const cMap = COLOR_CLASSES[phase.color] || COLOR_CLASSES.purple;
    const isFirst = phaseIndex === 0 || (phase.isNegative && phaseIndex > 0 && !state.phases[phaseIndex - 1].isNegative);
    const isLast = phaseIndex === state.phases.length - 1 || (!phase.isNegative && phaseIndex + 1 < state.phases.length && state.phases[phaseIndex + 1].isNegative);

    // Phase-level layer order / hierarchy flags from Gemini
    const phaseNameKey = phase.name.toLowerCase().trim();
    const phaseGeminiFlags = piaBindings.phaseFlags.get(phaseNameKey) || new Set();
    const phaseLayerOrderBadgeHtml = phaseGeminiFlags.size > 0
      ? `<span class="pia-phase-badge-layer" title="Gemini: Layer Order / Phase Hierarchy issue detected">
           <i class="fa-solid fa-layer-group text-[9px]"></i> Layer Issue
         </span>`
      : '';

    const phaseEl = document.createElement("div");
    phaseEl.className = `glass-panel rounded-xl overflow-hidden border ${cMap.border} ${phase.isActive ? '' : 'opacity-60'} transition-all duration-300`;
    phaseEl.setAttribute("data-phase-id", phase.id);

    // Compile token badges list
    let tokensHtml = "";
    const tokens = getPhaseTokens(phase);
    if (tokens.length === 0) {
      tokensHtml = `<p class="text-slate-500 text-xs py-4 text-center select-none">No tokens inside this phase yet. Type above and press Enter!</p>`;
    } else {
      tokensHtml = tokens.map((tok, tokIndex) => {
        // Calculate weight glow strength & border accent
        let bgStyle = "";
        let borderStyle = "border-slate-800";
        let glowStyle = "";
        const isCore = !!tok.isCore;
        const conflictInfo = conflictMap.get(tok.id);

        // ── Gemini binding lookup (by token text, case-insensitive) ──────
        const tokKey = tok.text.toLowerCase().trim();
        const geminiEntries = piaBindings.tokenBadges.get(tokKey) || [];
        // Priority: Core blocks geminiConflict; dangerPos only on positive phase; dangerNeg only on negative
        const effectiveGeminiEntries = geminiEntries.filter(e => {
          if (e.type === 'geminiConflict' && isCore) return false; // Coreがある場合は競合バッジを出さない
          if (e.type === 'dangerPos' && phase.isNegative) return false;
          if (e.type === 'dangerNeg' && !phase.isNegative) return false;
          return true;
        });
        // 最高優先度のGeminiバッジを決定
        const hasGeminiConflict = effectiveGeminiEntries.some(e => e.type === 'geminiConflict');
        const hasGeminiDangerPos = effectiveGeminiEntries.some(e => e.type === 'dangerPos');
        const hasGeminiDangerNeg = effectiveGeminiEntries.some(e => e.type === 'dangerNeg');
        const hasGeminiLayerOrder = effectiveGeminiEntries.some(e => e.type === 'layerOrderToken');
        const hasAnyGeminiBadge = hasGeminiConflict || hasGeminiDangerPos || hasGeminiDangerNeg || hasGeminiLayerOrder;

        if (tok.isActive) {
          if (conflictInfo) {
            // Override with warning styles (local conflict map)
            if (conflictInfo.type === 'pos') {
              bgStyle = `background: rgba(234, 179, 8, 0.15)`;
              borderStyle = `border-amber-400/80`;
              glowStyle = `token-conflict-warn-glow`;
            } else {
              bgStyle = `background: rgba(249, 115, 22, 0.15)`;
              borderStyle = `border-orange-500/80`;
              glowStyle = `token-conflict-danger-glow`;
            }
          } else if (hasGeminiConflict) {
            bgStyle = `background: rgba(234, 179, 8, 0.12)`;
            borderStyle = `border-amber-500/70`;
            glowStyle = `token-conflict-warn-glow`;
          } else if (hasGeminiDangerPos) {
            bgStyle = `background: rgba(249, 115, 22, 0.12)`;
            borderStyle = `border-orange-500/70`;
            glowStyle = `token-conflict-danger-glow`;
          } else if (hasGeminiDangerNeg) {
            bgStyle = `background: rgba(239, 68, 68, 0.12)`;
            borderStyle = `border-red-500/70`;
            glowStyle = `shadow-[0_0_8px_rgba(239,68,68,0.25)]`;
          } else if (hasGeminiLayerOrder) {
            bgStyle = `background: rgba(168, 85, 247, 0.10)`;
            borderStyle = `border-purple-400/60`;
            glowStyle = `shadow-[0_0_8px_rgba(168,85,247,0.2)]`;
          } else if (isCore) {
            // Core token — golden priority style overrides weight coloring
            bgStyle = `background: rgba(234, 179, 8, 0.08)`;
            borderStyle = `border-amber-400/50`;
            glowStyle = `token-core-glow`;
          } else {
            const w = parseFloat(tok.weight);
            if (w > 1.0) {
              // Stronger visual weight
              const intensity = Math.min((w - 1.0) / 1.0, 1.0); // 0 to 1
              bgStyle = `background: rgba(168, 85, 247, ${0.1 + intensity * 0.15})`;
              borderStyle = `border-purple-500/${Math.round((0.2 + intensity * 0.6) * 100)}`;
              glowStyle = `shadow-[0_0_8px_rgba(168,85,247,${intensity * 0.3})]`;
            } else if (w < 1.0) {
              // Faded visual weight
              const dimness = Math.min((1.0 - w) / 0.9, 1.0); // 0 to 1
              bgStyle = `background: rgba(244, 63, 94, ${0.05 + dimness * 0.08})`;
              borderStyle = `border-rose-500/${Math.round((0.15 + dimness * 0.4) * 100)}`;
            } else {
              // Neutral active weight (1.0)
              bgStyle = `background: rgba(255, 255, 255, 0.04)`;
              borderStyle = `border-slate-700/60`;
            }
          }
        } else {
          // Inactive
          bgStyle = `background: rgba(255, 255, 255, 0.01)`;
          borderStyle = `border-slate-800/40`;
        }

        const isTokFirst = tokIndex === 0;
        const isTokLast = tokIndex === tokens.length - 1;

        // ── Badge HTML assembly ─────────────────────────────────────────
        // 1. Local conflict badge (static SEMANTIC_CONFLICT_RULES ベース)
        let conflictBadgeHtml = '';
        if (conflictInfo && !isCore) {
          const badgeClass = conflictInfo.type === 'pos' ? 'token-conflict-badge' : 'token-conflict-badge is-danger';
          conflictBadgeHtml = `<span class="${badgeClass}" title="${conflictInfo.reason}">⚠ ${conflictInfo.type === 'pos' ? '競合' : '危険'}</span>`;
        }

        // 2. Gemini: ⚠競合 (Semantic Conflict) — Coreには付与しない
        let geminiConflictBadgeHtml = '';
        if (hasGeminiConflict && !conflictInfo) {
          const r = effectiveGeminiEntries.find(e => e.type === 'geminiConflict')?.reason || '';
          geminiConflictBadgeHtml = `<span class="token-conflict-badge" title="Gemini: ${r}">⚠ 競合</span>`;
        }

        // 3. Gemini: ⚠不安定 (Danger Positive)
        let geminiDangerPosBadgeHtml = '';
        if (hasGeminiDangerPos) {
          const r = effectiveGeminiEntries.find(e => e.type === 'dangerPos')?.reason || '';
          geminiDangerPosBadgeHtml = `<span class="pia-badge-danger-pos" title="Gemini: ${r}">⚠ 不安定</span>`;
        }

        // 4. Gemini: ⚠危険 (Danger Negative)
        let geminiDangerNegBadgeHtml = '';
        if (hasGeminiDangerNeg) {
          const r = effectiveGeminiEntries.find(e => e.type === 'dangerNeg')?.reason || '';
          geminiDangerNegBadgeHtml = `<span class="pia-badge-danger-neg" title="Gemini: ${r}">⚠ 危険</span>`;
        }

        // 5. Gemini: ⬆Layer (Layer Order Token)
        let geminiLayerBadgeHtml = '';
        if (hasGeminiLayerOrder) {
          const r = effectiveGeminiEntries.find(e => e.type === 'layerOrderToken')?.reason || '';
          geminiLayerBadgeHtml = `<span class="pia-badge-layer-token" title="Gemini: ${r}"><i class="fa-solid fa-layer-group text-[8px]"></i> Layer</span>`;
        }

        // Core mark button (only for positive phases)
        const coreButtonHtml = !phase.isNegative ? `
          <button class="token-core-btn ${isCore ? 'is-core' : ''}" 
                  onclick="toggleTokenCore('${phase.id}', '${tok.id}')"
                  title="${isCore ? 'Core Token (クリックで解除)' : 'Mark as Core Token (テーマの中心語に設定)'}"
          >
            <i class="fa-solid fa-star"></i>
          </button>
        ` : '';

        return `
          <div class="token-badge flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border ${borderStyle} ${glowStyle} transition-all duration-200 gap-3" style="${bgStyle}">
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Active toggle -->
              <input type="checkbox" 
                     class="checkbox-cyber w-4.5 h-4.5" 
                     ${tok.isActive ? 'checked' : ''} 
                     onchange="toggleTokenActive('${phase.id}', '${tok.id}')"
                     title="Enable/Disable Token"
              >
              
              <!-- Core mark indicator -->
              ${isCore && !phase.isNegative ? '<span class="token-core-badge"><i class="fa-solid fa-star"></i> CORE</span>' : ''}

              <!-- Local conflict badge (SEMANTIC_CONFLICT_RULES ベース) -->
              ${conflictBadgeHtml}

              <!-- Gemini badges -->
              ${geminiConflictBadgeHtml}
              ${geminiDangerPosBadgeHtml}
              ${geminiDangerNegBadgeHtml}
              ${geminiLayerBadgeHtml}

              <!-- Token name -->
              <span class="text-sm font-medium ${tok.isActive ? (isCore ? 'text-amber-100' : (hasAnyGeminiBadge ? 'text-slate-100' : 'text-slate-200')) : 'text-slate-500 line-through'} break-all select-all">
                ${tok.text}
              </span>
            </div>
            
            <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <!-- Slider + Weight Label -->
              <div class="flex items-center gap-3 flex-grow md:flex-grow-0">
                <input type="text" 
                       value="${parseFloat(tok.weight).toFixed(3).replace(/\.?0+$/, '')}" 
                       class="token-weight-input mono-font text-xs text-center rounded bg-slate-950/60 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-cyan-500 w-12 py-0.5"
                       oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
                       onkeydown="if(event.key === 'Enter') { updateTokenWeightFromText('${phase.id}', '${tok.id}', this.value); this.blur(); }"
                       onblur="updateTokenWeightFromText('${phase.id}', '${tok.id}', this.value)"
                       id="input-weight-${phase.id}-${tok.id}"
                       ${tok.isActive ? '' : 'disabled'}
                >
                
                <input type="range" 
                       min="0.1" 
                       max="2.0" 
                       step="0.05" 
                       value="${tok.weight}" 
                       class="custom-slider ${cMap.slider} w-24 md:w-28" 
                       id="slider-${phase.id}-${tok.id}"
                       ${tok.isActive ? '' : 'disabled'}
                       oninput="updateTokenWeight('${phase.id}', '${tok.id}', this.value)"
                >
                
                <span class="mono-font text-xs font-semibold w-12 text-left ${tok.isActive ? cMap.accent : 'text-slate-600'}"
                      id="weight-label-${phase.id}-${tok.id}">
                  ${parseFloat(tok.weight).toFixed(3).replace(/\.?0+$/, '')}x
                </span>
                
                <button class="text-[10px] px-1.5 py-0.5 rounded border border-slate-700/60 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition tooltip" 
                        data-tooltip="Reset to 1.0"
                        onclick="resetTokenWeight('${phase.id}', '${tok.id}')"
                        ${tok.isActive ? '' : 'disabled'}
                >
                  1.0
                </button>
              </div>
              
              <!-- Order, Core mark, and Delete tools -->
              <div class="flex items-center gap-1.5">
                <button class="text-slate-500 hover:text-slate-300 p-1 disabled:opacity-30" 
                        onclick="reorderToken('${phase.id}', '${tok.id}', -1)"
                        ${isTokFirst ? 'disabled' : ''}
                        title="Move Up"
                >
                  <i class="fa-solid fa-chevron-up text-xs"></i>
                </button>
                <button class="text-slate-500 hover:text-slate-300 p-1 disabled:opacity-30" 
                        onclick="reorderToken('${phase.id}', '${tok.id}', 1)"
                        ${isTokLast ? 'disabled' : ''}
                        title="Move Down"
                >
                  <i class="fa-solid fa-chevron-down text-xs"></i>
                </button>
                
                <div class="w-px h-4 bg-slate-700/60 mx-1"></div>

                ${coreButtonHtml}
                
                <button class="text-slate-500 hover:text-rose-400 transition p-1" 
                        onclick="deleteToken('${phase.id}', '${tok.id}')"
                        title="Delete Token"
                >
                  <i class="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    let patternSelectorHtml = "";
    if (!phase.isNegative) {
      if (!phase.patterns) {
        ensurePhaseStructure(phase);
      }
      patternSelectorHtml = `
        <!-- Pattern Selector Bar -->
        <div class="flex items-center justify-between px-4 py-2 bg-slate-900/30 border-b border-slate-800/60 text-xs">
          <div class="flex items-center gap-2">
            <button onclick="switchPattern('${phase.id}', -1)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-slate-100 rounded text-slate-400 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 transition" ${phase.activePatternIndex === 0 ? 'disabled' : ''}>
              ◀
            </button>
            <span class="font-bold text-slate-300">Pattern ${phase.activePatternIndex + 1} / ${phase.patterns.length}</span>
            <button onclick="switchPattern('${phase.id}', 1)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-slate-100 rounded text-slate-400 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 transition" ${phase.activePatternIndex === phase.patterns.length - 1 ? 'disabled' : ''}>
              ▶
            </button>
          </div>
          <button onclick="addPattern('${phase.id}')" class="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition rounded font-semibold flex items-center gap-1.5" ${phase.patterns.length >= 10 ? 'disabled' : ''}>
            <i class="fa-solid fa-plus text-[10px]"></i> Add Pattern (Max 10)
          </button>
        </div>
      `;
    }

    const isAnimating = animatingPhases[phase.id];
    if (isAnimating) {
      delete animatingPhases[phase.id];
    }

    phaseEl.innerHTML = `
      <!-- Phase Header -->
      <div class="flex flex-wrap items-center justify-between p-4 border-b border-slate-800/70 bg-slate-900/40 gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Active checkbox -->
          <input type="checkbox" 
                 class="checkbox-cyber w-4.5 h-4.5" 
                 ${phase.isActive ? 'checked' : ''} 
                 onchange="togglePhaseActive('${phase.id}')"
                 title="Toggle Phase"
          >
          
          <!-- Phase Title -->
          <div class="flex items-center gap-1.5" id="phase-title-container-${phase.id}">
            <span class="text-base font-bold text-slate-100">${phase.name}</span>
            <button onclick="startEditPhaseTitle('${phase.id}')" class="text-slate-400 hover:text-slate-200 transition" title="Rename Phase">
              <i class="fa-solid fa-pen-to-square text-[10px]"></i>
            </button>
          </div>
          
          <!-- Positive / Negative Tag badge -->
          <button onclick="togglePhaseType('${phase.id}')" 
                  class="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded border transition-all duration-200 ${phase.isNegative
        ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 hover:bg-rose-900/40'
        : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40'
      }"
                  title="Click to toggle Positive/Negative"
          >
            ${phase.isNegative ? 'Negative' : 'Positive'}
          </button>

          <!-- Gemini Phase-level Layer Order badge -->
          ${phaseLayerOrderBadgeHtml}
        </div>
        
        <!-- Controls -->
        <div class="flex items-center gap-2">
          <!-- Phase Color Picker -->
          <div class="flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80 mr-2">
            ${PHASE_COLORS.map(c => `
              <button onclick="setPhaseColor('${phase.id}', '${c}')" 
                      class="w-3 h-3 rounded-full hover:scale-125 transition-transform duration-100 ${COLOR_CLASSES[c].fill} ${phase.color === c ? 'ring-2 ring-white scale-110' : 'opacity-65 hover:opacity-100'}"
              ></button>
            `).join("")}
          </div>
          
          <!-- Reorder Phase -->
          <button class="text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 p-1.5 rounded border border-slate-700/30 disabled:opacity-20 disabled:pointer-events-none" 
                  onclick="reorderPhase('${phase.id}', -1)"
                  ${isFirst ? 'disabled' : ''}
                  title="Move Phase Up"
          >
            <i class="fa-solid fa-arrow-up-long text-xs"></i>
          </button>
          <button class="text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 p-1.5 rounded border border-slate-700/30 disabled:opacity-20 disabled:pointer-events-none" 
                  onclick="reorderPhase('${phase.id}', 1)"
                  ${isLast ? 'disabled' : ''}
                  title="Move Phase Down"
          >
            <i class="fa-solid fa-arrow-down-long text-xs"></i>
          </button>
          
          <!-- Delete Phase -->
          <button class="text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-slate-800 p-1.5 rounded border border-slate-700/30" 
                  onclick="deletePhase('${phase.id}')"
                  title="Delete Phase"
          >
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
      
      ${patternSelectorHtml}
      
      <!-- Phase Content / Token list -->
      <div class="p-4 bg-slate-900/10 token-area-3d ${isAnimating ? 'flip-enter' : ''}">
        <!-- Add Token box -->
        <div class="flex items-center gap-2 mb-4 bg-slate-900/40 border border-slate-800/80 rounded-lg p-1.5 ${cMap.borderFocus} transition duration-200">
          <input type="text" 
                 placeholder="Add tokens (separate by comma)..." 
                 class="bg-transparent text-sm text-slate-100 w-full focus:outline-none px-2 py-1"
                 onkeydown="handleTokenInputKeydown(event, '${phase.id}')"
                 id="input-token-${phase.id}"
          >
          <button class="px-3 py-1 bg-slate-800 hover:bg-slate-700 hover:text-slate-100 rounded text-slate-400 text-xs font-semibold border border-slate-700/50 transition whitespace-nowrap"
                  onclick="handleAddTokenButton('${phase.id}')"
          >
            Add Token
          </button>
        </div>
        
        <!-- Tokens Grid -->
        <div class="flex flex-col gap-2">
          ${tokensHtml}
        </div>
      </div>
    `;

    container.appendChild(phaseEl);
  });
}

// Handler for token text input keydown
window.handleTokenInputKeydown = function (e, phaseId) {
  if (e.key === "Enter") {
    handleAddTokenButton(phaseId);
  }
};

// Add token logic
window.handleAddTokenButton = function (phaseId) {
  const input = document.getElementById(`input-token-${phaseId}`);
  const val = input.value.trim();
  if (!val) return;

  // Support comma-separated tokens
  const newTokensText = val.split(",").map(t => t.trim()).filter(Boolean);
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const tokens = getPhaseTokens(phase);
  newTokensText.forEach(text => {
    const tok = {
      id: "tok_" + Math.random().toString(36).substr(2, 9),
      text: text,
      weight: 1.0,
      isActive: true,
      isCore: false
    };
    parseTokenWeightIfNeeded(tok);
    tokens.push(tok);
  });

  input.value = "";
  showToast(`Added ${newTokensText.length} token(s) to "${phase.name}"`);
  renderApp();

  // Re-focus input
  input.focus();
};

// Phase Controls
window.togglePhaseActive = function (phaseId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (phase) {
    phase.isActive = !phase.isActive;
    renderApp();
  }
};

window.togglePhaseType = function (phaseId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (phase) {
    phase.isNegative = !phase.isNegative;
    // Swap default colors to signal the swap
    phase.color = phase.isNegative ? "rose" : "purple";
    showToast(`Phase changed to ${phase.isNegative ? 'Negative' : 'Positive'}!`);
    renderApp();
  }
};

window.setPhaseColor = function (phaseId, color) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (phase) {
    phase.color = color;
    renderApp();
  }
};

window.deletePhase = function (phaseId) {
  const index = state.phases.findIndex(p => p.id === phaseId);
  if (index !== -1) {
    const name = state.phases[index].name;
    if (confirm(`Are you sure you want to delete the phase "${name}"?`)) {
      state.phases.splice(index, 1);
      showToast(`Phase "${name}" deleted.`, "warning");
      renderApp();
    }
  }
};

window.reorderPhase = function (phaseId, direction) {
  const index = state.phases.findIndex(p => p.id === phaseId);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.phases.length) return;

  // Swap elements
  const temp = state.phases[index];
  state.phases[index] = state.phases[targetIndex];
  state.phases[targetIndex] = temp;

  renderApp();
};

// Token Controls
window.toggleTokenActive = function (phaseId, tokenId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const tokens = getPhaseTokens(phase);
  const token = tokens.find(t => t.id === tokenId);
  if (token) {
    token.isActive = !token.isActive;
    renderApp();
  }
};

function syncActiveConceptLayers() {
  if (state.activeConcept) {
    const concept = state.concepts.find(c => c.id === state.activeConcept);
    if (concept) {
      const layersMap = {};
      let phaseIndexCounter = 0;
      state.phases.forEach(ph => {
        const layerName = ph._layerName || "medium";
        if (!layersMap[layerName]) layersMap[layerName] = [];

        let phaseCopy = JSON.parse(JSON.stringify(ph));
        ensurePhaseStructure(phaseCopy);
        phaseCopy._originalIndex = phaseIndexCounter++;
        layersMap[layerName].push(phaseCopy);
      });
      concept.layers = layersMap;
      saveConceptsToStorage();
    }
  }
}

window.updateTokenWeight = function (phaseId, tokenId, newWeight) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const tokens = getPhaseTokens(phase);
  const token = tokens.find(t => t.id === tokenId);
  if (token) {
    const valFloat = parseFloat(newWeight);
    token.weight = valFloat;
    updateOutput();

    const weightStr = valFloat.toFixed(3).replace(/\.?0+$/, "");

    const label = document.getElementById(`weight-label-${phaseId}-${tokenId}`);
    if (label) {
      label.innerText = weightStr + "x";
    }

    const input = document.getElementById(`input-weight-${phaseId}-${tokenId}`);
    if (input) {
      input.value = weightStr;
    }
    syncActiveConceptLayers();
  }
};

window.updateTokenWeightFromText = function (phaseId, tokenId, textValue) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const tokens = getPhaseTokens(phase);
  const token = tokens.find(t => t.id === tokenId);
  if (token) {
    let parsed = parseFloat(textValue);
    if (isNaN(parsed)) {
      parsed = token.weight;
    }

    const clamped = Math.max(0.1, Math.min(2.0, parsed));
    token.weight = clamped;

    const weightStr = clamped.toFixed(3).replace(/\.?0+$/, "");

    const slider = document.getElementById(`slider-${phaseId}-${tokenId}`);
    if (slider) {
      slider.value = clamped;
    }

    const label = document.getElementById(`weight-label-${phaseId}-${tokenId}`);
    if (label) {
      label.innerText = weightStr + "x";
    }

    const input = document.getElementById(`input-weight-${phaseId}-${tokenId}`);
    if (input) {
      input.value = weightStr;
    }

    updateOutput();
    syncActiveConceptLayers();
  }
};

window.resetTokenWeight = function (phaseId, tokenId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const tokens = getPhaseTokens(phase);
  const token = tokens.find(t => t.id === tokenId);
  if (token) {
    token.weight = 1.0;
    syncActiveConceptLayers();
    renderApp();
  }
};

window.deleteToken = function (phaseId, tokenId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const tokens = getPhaseTokens(phase);
  const index = tokens.findIndex(t => t.id === tokenId);
  if (index !== -1) {
    tokens.splice(index, 1);
    renderApp();
  }
};

// Toggle Core mark on a token (positive phases only)
window.toggleTokenCore = function (phaseId, tokenId) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase || phase.isNegative) return;

  const tokens = getPhaseTokens(phase);
  const token = tokens.find(t => t.id === tokenId);
  if (!token) return;

  token.isCore = !token.isCore;

  // Coreをセットした場合、そのトークンのGemini「⚠競合」バインディングを削除する
  if (token.isCore) {
    const tb = window._piaBindings?.tokenBadges;
    if (tb) {
      const key = token.text.toLowerCase().trim();
      const entries = tb.get(key);
      if (entries) {
        const filtered = entries.filter(e => e.type !== 'geminiConflict');
        if (filtered.length > 0) {
          tb.set(key, filtered);
        } else {
          tb.delete(key);
        }
      }
    }
  }

  const action = token.isCore ? 'Core に設定' : 'Core を解除';
  showToast(`"${token.text}" を ${action}しました`, token.isCore ? 'success' : 'warning');
  renderApp();
};

window.reorderToken = function (phaseId, tokenId, direction) {
  const phase = state.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const tokens = getPhaseTokens(phase);
  const index = tokens.findIndex(t => t.id === tokenId);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= tokens.length) return;

  // Swap elements
  const temp = tokens[index];
  tokens[index] = tokens[targetIndex];
  tokens[targetIndex] = temp;

  renderApp();
};

// ============================================================
//  STABILITY AI API INTEGRATION
// ============================================================

const STABILITY_API_URL = "https://api.stability.ai/v2beta/stable-image/generate/ultra";
const LS_API_KEY = "diffu_stability_api_key";

// Holds the current generated image blob URL for download
let _generatedImageBlobUrl = null;
let _generatedImageFormat = "png";

// ---------- Initialise API panel ----------
function initApiPanel() {
  // Restore saved API key
  const savedKey = localStorage.getItem(LS_API_KEY) || "";
  const keyInput = document.getElementById("input-api-key");
  if (keyInput) keyInput.value = savedKey;

  // Save Key button
  document.getElementById("btn-save-api-key").addEventListener("click", () => {
    const key = document.getElementById("input-api-key").value.trim();
    localStorage.setItem(LS_API_KEY, key);
    showToast("API Key saved to localStorage!", "success");
  });

  // Show / Hide API key toggle
  document.getElementById("btn-toggle-api-key").addEventListener("click", () => {
    const input = document.getElementById("input-api-key");
    const icon = document.getElementById("icon-eye");
    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.replace("fa-eye-slash", "fa-eye");
    }
  });

  // Generate button
  document.getElementById("btn-generate-image").addEventListener("click", generateImage);

  // Download button
  document.getElementById("btn-download-image").addEventListener("click", downloadGeneratedImage);

  // Expand / Lightbox buttons
  document.getElementById("btn-expand-image").addEventListener("click", openLightbox);
  document.getElementById("image-click-expand").addEventListener("click", openLightbox);

  // Update prompt preview whenever output changes
  updateApiPromptPreview();

  // ---- NEW: Sampling Steps slider in API panel ----
  const stepsSlider = document.getElementById('input-sampling-steps');
  const stepsLabel = document.getElementById('label-sampling-steps');
  if (stepsSlider && stepsLabel) {
    stepsSlider.addEventListener('input', () => {
      stepsLabel.textContent = stepsSlider.value;
    });
  }

  // ---- NEW: CFG Scale slider in API panel ----
  const cfgSlider = document.getElementById('input-cfg-scale');
  const cfgLabel = document.getElementById('label-cfg-scale');
  if (cfgSlider && cfgLabel) {
    cfgSlider.addEventListener('input', () => {
      cfgLabel.textContent = parseFloat(cfgSlider.value).toFixed(1);
    });
  }
}

// ---------- Keep prompt preview in sync ----------
function updateApiPromptPreview() {
  const previewEl = document.getElementById("api-prompt-preview");
  if (!previewEl) return;
  const prompts = compilePrompts();
  if (prompts.pos) {
    previewEl.textContent = prompts.pos.length > 120
      ? prompts.pos.substring(0, 120) + "…"
      : prompts.pos;
  } else {
    previewEl.textContent = "— (no positive tokens yet)";
  }
}

// Patch updateOutput to also refresh the API preview
const _originalUpdateOutput = updateOutput;
updateOutput = function () {
  _originalUpdateOutput();
  updateApiPromptPreview();
};

// ---------- Main generate function ----------
async function generateImage() {
  const apiKey = (localStorage.getItem(LS_API_KEY) || "").trim();
  if (!apiKey) {
    showToast("Please enter and save your Stability AI API key first.", "warning");
    document.getElementById("input-api-key").focus();
    return;
  }

  const prompts = compilePrompts();
  if (!prompts.pos.trim()) {
    showToast("Positive prompt is empty — add some tokens first!", "warning");
    return;
  }

  const aspectRatio = document.getElementById("select-aspect-ratio").value;
  const outputFormat = document.getElementById("select-output-format").value;
  const seedRaw = parseInt(document.getElementById("input-seed").value, 10);
  const seed = isNaN(seedRaw) || seedRaw <= 0 ? 0 : seedRaw;

  // Retrieve sampling steps, CFG scale, and sampler values
  const steps = parseInt(document.getElementById("input-sampling-steps").value, 10);
  const cfgScale = parseFloat(document.getElementById("input-cfg-scale").value);
  const sampler = document.getElementById("select-sampler").value;

  _generatedImageFormat = outputFormat;

  // Show loading state
  setApiLoading(true, "Sending request to Stability AI…");

  try {
    const formData = new FormData();
    formData.append("prompt", prompts.pos);
    formData.append("aspect_ratio", aspectRatio);
    formData.append("output_format", outputFormat);
    if (seed > 0) formData.append("seed", String(seed));
    if (prompts.neg.trim()) {
      formData.append("negative_prompt", prompts.neg);
    }
    formData.append("steps", String(steps));
    formData.append("cfg_scale", String(cfgScale));
    formData.append("sampler", sampler);

    setApiLoading(true, "Waiting for generation (this may take ~10–30s)…");

    const response = await fetch(STABILITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      body: formData
    });

    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        errMsg = errJson.errors?.[0] || errJson.message || errMsg;
      } catch (_) { /* ignore */ }
      throw new Error(errMsg);
    }

    setApiLoading(true, "Processing response…");

    const data = await response.json();
    // data: { image: base64, finish_reason: string, seed: number }

    if (!data.image) {
      throw new Error("No image data in response.");
    }

    // Convert base64 to Blob URL
    const mimeType = outputFormat === "jpeg" ? "image/jpeg"
      : outputFormat === "webp" ? "image/webp"
        : "image/png";
    const byteString = atob(data.image);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // Revoke previous blob URL if any
    if (_generatedImageBlobUrl) URL.revokeObjectURL(_generatedImageBlobUrl);
    _generatedImageBlobUrl = blobUrl;

    // Display image
    const imgEl = document.getElementById("generated-image");
    imgEl.src = blobUrl;

    // Update lightbox source too
    document.getElementById("lightbox-img").src = blobUrl;

    // Metadata
    document.getElementById("image-seed-info").textContent =
      `Seed: ${data.seed ?? "—"}`;
    document.getElementById("image-finish-info").textContent =
      `Finish: ${data.finish_reason ?? "SUCCESS"}`;

    // Show result area
    document.getElementById("api-image-result").classList.remove("hidden");

    setApiLoading(false);
    showToast("Image generated successfully! 🎨");

  } catch (err) {
    setApiLoading(false);
    console.error("Stability AI error:", err);
    showToast(`Generation failed: ${err.message}`, "error");
  }
}

// ---------- UI helpers ----------
function setApiLoading(isLoading, statusText = "") {
  const btn = document.getElementById("btn-generate-image");
  const status = document.getElementById("api-status");
  const txtEl = document.getElementById("api-status-text");

  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner-ring-sm"></div> Generating…`;
    status.classList.remove("hidden");
    if (txtEl) txtEl.textContent = statusText;
  } else {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-wand-sparkles"></i> Generate Image`;
    status.classList.add("hidden");
  }
}

function downloadGeneratedImage() {
  if (!_generatedImageBlobUrl) return;
  const a = document.createElement("a");
  a.href = _generatedImageBlobUrl;
  a.download = `diffuprompt_${Date.now()}.${_generatedImageFormat}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Image downloaded!");
}

// ---------- Lightbox ----------
function openLightbox() {
  const modal = document.getElementById("lightbox-modal");
  const imgSrc = document.getElementById("generated-image").src;
  if (!imgSrc) return;
  document.getElementById("lightbox-img").src = imgSrc;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

window.closeLightbox = function () {
  const modal = document.getElementById("lightbox-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
};

// Close lightbox on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.closeLightbox();
});

// ---------- Boot API panel after DOM ready ----------
document.addEventListener("DOMContentLoaded", () => {
  initApiPanel();
});

// ============================================================
//  STYLE CONCEPT LIBRARY
// ============================================================

// Extend state with concepts
state.concepts = [];

// localStorage key
const LS_CONCEPTS_KEY = "diffu_style_concepts";

// Default layer names (used to populate dropdowns)
const DEFAULT_LAYER_NAMES = ["medium", "tonal", "atmosphere", "subject", "style"];

// Currently active category filter (null = All)
let _conceptActiveCat = null;

// Load concepts from localStorage
// Load concepts from Firestore concepts collection
async function loadConceptsFromStorage() {
  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Falling back to empty concepts.");
      state.concepts = [];
      return;
    }
    const { collection, getDocs } = window.firestore;
    const db = window.db;

    const conceptsCol = collection(db, "concepts");
    const snapshot = await getDocs(conceptsCol);
    const loaded = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    state.concepts = loaded.map(c => ({
      isPinned: false,
      isBookmarked: false,
      ...c
    }));
    console.log("Concepts successfully loaded from Firestore:", state.concepts);
  } catch (e) {
    console.error("Failed to load concepts from Firestore:", e);
    state.concepts = [];
  }
}

// Save concepts to Firestore concepts collection
async function saveConceptsToStorage() {
  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Cannot save concepts.");
      return;
    }
    const { doc, setDoc, deleteDoc, collection, getDocs } = window.firestore;
    const db = window.db;

    // 1. Retrieve all existing concepts in Firestore to find deleted ones
    const conceptsCol = collection(db, "concepts");
    const snapshot = await getDocs(conceptsCol);
    const existingIds = snapshot.docs.map(d => d.id);

    // 2. Identify and delete concepts that are no longer in local state.concepts
    const currentIds = state.concepts.map(c => c.id);
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));
    for (const id of idsToDelete) {
      const conceptRef = doc(db, "concepts", id);
      await deleteDoc(conceptRef);
    }

    // 3. Save / update all current concepts from local state.concepts in Firestore
    for (const concept of state.concepts) {
      const conceptId = concept.id || `concept_${Date.now()}`;
      const conceptRef = doc(db, "concepts", conceptId);
      await setDoc(conceptRef, concept);
    }

    console.log("Concepts successfully saved/synced to Firestore.");
  } catch (error) {
    console.error("Error saving concepts to Firestore: ", error);
  }
}

// ---- RENDER: Concept Library ----
function renderConceptLibrary() {
  renderConceptCategoryTabs();
  renderConceptCards();
  renderConceptArchive();
}

// Collect all unique categories from saved concepts
function getAllCategories() {
  const cats = new Set();
  state.concepts.forEach(c => { if (c.category) cats.add(c.category); });
  return Array.from(cats).sort();
}

// Render category filter tabs
function renderConceptCategoryTabs() {
  const tabBar = document.getElementById("concept-category-tabs");
  if (!tabBar) return;

  const cats = getAllCategories();
  tabBar.innerHTML = "";

  // "All" tab
  const allTab = document.createElement("button");
  allTab.className = "category-tab" + (_conceptActiveCat === null ? " active" : "");
  allTab.textContent = "All";
  allTab.addEventListener("click", () => {
    _conceptActiveCat = null;
    renderConceptLibrary();
  });
  tabBar.appendChild(allTab);

  cats.forEach(cat => {
    const tab = document.createElement("button");
    tab.className = "category-tab" + (_conceptActiveCat === cat ? " active" : "");
    tab.textContent = cat;
    tab.addEventListener("click", () => {
      _conceptActiveCat = cat;
      renderConceptLibrary();
    });
    tabBar.appendChild(tab);
  });
}

// Get badge CSS class for a layer name
function getLayerBadgeClass(layerName) {
  const known = {
    medium: "layer-badge-medium", tonal: "layer-badge-tonal", atmosphere: "layer-badge-atmosphere",
    subject: "layer-badge-subject", style: "layer-badge-style"
  };
  return known[layerName.toLowerCase()] || "layer-badge-custom";
}

// Render concept cards
function renderConceptCards() {
  const container = document.getElementById("concept-list-container");
  if (!container) return;
  container.innerHTML = "";

  const filtered = _conceptActiveCat
    ? state.concepts.filter(c => c.category === _conceptActiveCat)
    : state.concepts;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="concept-empty-state">
        <i class="fa-solid fa-layer-group"></i>
        <p class="text-xs font-medium mb-1">${state.concepts.length === 0 ? 'No concepts saved yet' : 'No concepts in this category'}</p>
        <p class="text-[10px]">${state.concepts.length === 0 ? '"Save Current as Concept" でスタイルを保存しましょう' : '別のカテゴリを選択してください'}</p>
      </div>
    `;
    return;
  }

  // Sort: pinned first (max 5), then the rest — preserve original order within each group
  const pinned = filtered.filter(c => c.isPinned).slice(0, 5);
  const unpinned = filtered.filter(c => !c.isPinned);
  const sorted = [...pinned, ...unpinned];

  sorted.forEach(concept => {
    const card = document.createElement("div");
    card.className = "concept-card" + (concept.isPinned ? " concept-card--pinned" : "");
    card.setAttribute("data-concept-id", concept.id);

    // Build layer badges
    const layerNames = Object.keys(concept.layers || {});
    const badgesHtml = layerNames.map(ln =>
      `<span class="layer-badge ${getLayerBadgeClass(ln)}">${ln}</span>`
    ).join("");

    const categoryHtml = concept.category
      ? `<span class="concept-category-chip">${concept.category}</span>`
      : "";

    // Calculate commit count (initial value is 1 minimum for display)
    const commitCount = Math.max(1, concept.commitCount || 0);

    // Calculate positive and negative phases
    let posCount = 0;
    let negCount = 0;
    Object.values(concept.layers || {}).forEach(phases => {
      (phases || []).forEach(phase => {
        if (phase.isNegative) negCount++;
        else posCount++;
      });
    });

    // Is this the active concept?
    const isActive = state.activeConcept === concept.id;
    const isPinned = !!concept.isPinned;
    const isBookmarked = !!concept.isBookmarked;

    card.innerHTML = `
      <!-- Delete button (absolute top-right) -->
      <button class="concept-card-delete" data-delete-id="${concept.id}" title="Delete Concept">
        <i class="fa-solid fa-trash-can text-[10px]"></i>
      </button>

      <!-- Title row: name + pen edit + pin + bookmark -->
      <div class="flex items-center gap-1.5 pr-6 mb-1.5 select-none" onclick="event.stopPropagation()">
        <div class="concept-card-name flex-grow" id="concept-title-${concept.id}">${concept.name}</div>
        <button onclick="startEditConceptTitle('${concept.id}', event)"
                class="text-slate-600 hover:text-slate-300 transition shrink-0 p-1"
                title="Rename Concept">
          <i class="fa-solid fa-pen text-[9px]"></i>
        </button>
        <!-- Pin button -->
        <button class="btn-concept-pin ${isPinned ? 'is-pinned' : ''}"
                title="${isPinned ? 'ピン留め解除' : 'ピン留め（最大5枚）'}"
                onclick="toggleConceptPin('${concept.id}', event)">
          <i class="fa-solid fa-thumbtack"></i>
        </button>
        <!-- Bookmark button -->
        <button class="btn-concept-bookmark ${isBookmarked ? 'is-bookmarked' : ''}"
                title="${isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}"
                onclick="toggleConceptBookmark('${concept.id}', event)">
          <i class="fa-solid fa-bookmark"></i>
        </button>
      </div>

      <!-- Category + layer badges -->
      <div class="concept-card-meta mb-3">
        ${categoryHtml}
        ${badgesHtml}
      </div>

      <!-- Action row: commit | export  +  pos/neg counts right-aligned -->
      <div class="concept-card-actions">
        <div class="concept-card-action-links">
          <button onclick="event.stopPropagation(); loadConcept('${concept.id}')"
                  class="concept-action-link ${isActive ? 'concept-action-link--active' : ''}"
                  title="${commitCount} commits — click to activate this concept">
            ${commitCount} commit${commitCount !== 1 ? 's' : ''}
          </button>
          <button onclick="exportSingleConcept('${concept.id}', event)"
                  class="concept-action-link"
                  title="Export this concept">
            export
          </button>
          <button onclick="toggleConceptTree('${concept.id}', event)"
                  class="concept-action-link"
                  title="Show commit timeline tree">
            tree
          </button>
        </div>
        <span class="concept-phase-count">
          <span class="concept-phase-count__pos">${posCount} pos</span><span class="concept-phase-count__sep">&nbsp;/&nbsp;</span><span class="concept-phase-count__neg">${negCount} neg</span>
        </span>
      </div>
    `;

    // Active card highlight
    if (isActive) {
      card.classList.add("concept-card--active");
    }

    // Click on card body → activate concept
    card.addEventListener("click", (e) => {
      if (e.target.closest(".concept-card-delete") || e.target.closest("button") || e.target.closest("input")) return;
      loadConcept(concept.id);
    });

    // Delete button
    card.querySelector(".concept-card-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConcept(concept.id);
    });

    container.appendChild(card);
  });
} // end renderConceptCards

// ---- PIN & BOOKMARK TOGGLES ----

window.toggleConceptPin = function (conceptId, event) {
  if (event) event.stopPropagation();
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;

  if (!concept.isPinned) {
    // Check pin limit
    const pinnedCount = state.concepts.filter(c => c.isPinned).length;
    if (pinnedCount >= 5) {
      showToast("ピン留めは最大5枚までです。", "warning");
      return;
    }
  }

  concept.isPinned = !concept.isPinned;
  saveConceptsToStorage();
  renderConceptCards();
};

window.toggleConceptBookmark = function (conceptId, event) {
  if (event) event.stopPropagation();
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;

  concept.isBookmarked = !concept.isBookmarked;
  saveConceptsToStorage();
  renderConceptCards();
};


// ---- FETCH: Firestoreサブコレクションからコミット一覧を取得 ----
async function fetchConceptCommits(conceptId) {
  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Cannot fetch concept commits.");
      return [];
    }
    const { collection, getDocs, query, orderBy } = window.firestore;

    const commitsCol = collection(window.db, "concepts", conceptId, "commits");
    const q = query(commitsCol, orderBy("timestamp", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Failed to fetch concept commits:", error);
    return [];
  }
}

// ---- LOAD: Apply concept to workspace ----
async function loadConcept(conceptId) {
  const concept = state.concepts.find(c => c.id === conceptId);

  if (!concept) return;

  if (!confirm(`Load concept "${concept.name}"?\n現在のワークスペースは上書きされます。`)) return;

  let restoredPhases;
  const commits = await fetchConceptCommits(conceptId);
  if (commits.length > 0) {
    // 最新のコミット (末尾) を使用
    const latestCommit = commits[commits.length - 1];
    restoredPhases = JSON.parse(JSON.stringify(latestCommit.phases));
  } else {
    // Flatten all layer phases into state.phases (preserving order: layer order)
    const allPhases = [];
    Object.entries(concept.layers || {}).forEach(([layerName, phases]) => {
      (phases || []).forEach(phase => {
        // Tag phase with layer info for display
        allPhases.push({ ...phase, _layerName: layerName });
      });
    });

    // Restore the exact original phase order when saved, fallback to current behavior if old concept
    allPhases.sort((a, b) => {
      const idxA = a._originalIndex !== undefined ? a._originalIndex : Number.MAX_SAFE_INTEGER;
      const idxB = b._originalIndex !== undefined ? b._originalIndex : Number.MAX_SAFE_INTEGER;
      return idxA - idxB;
    });

    restoredPhases = JSON.parse(JSON.stringify(allPhases));
  }

  restoredPhases.forEach(ensurePhaseStructure);
  state.phases = restoredPhases;

  // アクティブコンセプトを設定してコミットボタンを有効化
  state.activeConcept = conceptId;
  updateCommitButton();

  showToast(`Loaded concept "${concept.name}"`, "success");
  renderApp();
  renderConceptLibrary(); // カードのアクティブ状態を更新
}


// ---- DELETE ----
async function deleteConcept(conceptId) {
  const idx = state.concepts.findIndex(c => c.id === conceptId);
  if (idx === -1) return;
  const name = state.concepts[idx].name;
  if (!confirm(`Delete concept "${name}"?`)) return;

  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Cannot delete concept commits.");
      return;
    }
    const { collection, getDocs, deleteDoc, doc } = window.firestore;
    const commitsCol = collection(window.db, "concepts", conceptId, "commits");
    const snapshot = await getDocs(commitsCol);
    for (const commitDoc of snapshot.docs) {
      await deleteDoc(doc(window.db, "concepts", conceptId, "commits", commitDoc.id));
    }
  } catch (error) {
    console.error("Error cleaning up concept commits:", error);
  }

  state.concepts.splice(idx, 1);
  saveConceptsToStorage();
  // アクティブコンセプトが削除された場合はボタンを無効化
  if (state.activeConcept === conceptId) {
    state.activeConcept = null;
    updateCommitButton();
  }
  showToast(`Concept "${name}" deleted.`, "warning");
  renderConceptLibrary();
}

// ---- EXPORT / IMPORT ----
function exportConcepts() {
  if (state.concepts.length === 0) {
    showToast("No concepts to export.", "warning");
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(state.concepts, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `diffuprompt_concepts_${Date.now()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Concepts exported!");
}

function importConcepts(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      state.concepts = [...state.concepts, ...imported];
      saveConceptsToStorage();
      showToast(`Imported ${imported.length} concept(s)!`);
      renderConceptLibrary();
    } catch (err) {
      showToast("Error parsing concept file.", "error");
    }
  };
  reader.readAsText(file);
}

// ============================================================
//  SAVE CONCEPT MODAL
// ============================================================

// Current custom layer names added during this modal session
let _modalCustomLayers = [];

function openSaveConceptModal() {
  if (state.phases.length === 0) {
    showToast("No phases to save. Add some phases first!", "warning");
    return;
  }

  // Reset modal state
  _modalCustomLayers = [...DEFAULT_LAYER_NAMES];
  document.getElementById("input-concept-name").value = "";
  document.getElementById("select-concept-category").value = "";
  document.getElementById("input-concept-category-custom").value = "";
  document.getElementById("input-new-layer-name").value = "";

  // SAFETY: Ensure all phases have the correct data structure before reading them
  state.phases.forEach(ensurePhaseStructure);

  // Build phase-to-layer assignment rows
  buildPhaseLayerRows();

  // Open modal
  document.getElementById("save-concept-modal").classList.add("open");
  document.body.style.overflow = "hidden";

  // Focus name input
  setTimeout(() => document.getElementById("input-concept-name").focus(), 100);
}

function closeConceptModal() {
  document.getElementById("save-concept-modal").classList.remove("open");
  document.body.style.overflow = "";
}

window.handleConceptModalOverlayClick = function (e) {
  if (e.target.id === "save-concept-modal") closeConceptModal();
};

// Build the phase→layer assignment rows
function buildPhaseLayerRows() {
  const container = document.getElementById("modal-phase-layer-rows");
  container.innerHTML = "";

  state.phases.forEach(phase => {
    const row = document.createElement("div");
    row.className = "layer-assign-row";
    row.setAttribute("data-phase-id", phase.id);

    // Phase label
    const phaseLabel = document.createElement("div");
    phaseLabel.className = "flex items-center gap-2 flex-grow min-w-0";

    const typeTag = phase.isNegative
      ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-400 uppercase">NEG</span>`
      : `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 uppercase">POS</span>`;

    phaseLabel.innerHTML = `
      ${typeTag}
      <span class="text-xs font-semibold text-slate-200 truncate">${phase.name}</span>
      <span class="text-[10px] text-slate-600 shrink-0">${getPhaseTokens(phase).length} tok</span>
    `;

    // Layer select
    const layerSelectWrap = document.createElement("div");
    layerSelectWrap.className = "shrink-0";

    const select = document.createElement("select");
    select.className = "layer-select";
    select.setAttribute("data-phase-id", phase.id);

    buildLayerSelectOptions(select, phase._layerName || "medium");
    layerSelectWrap.appendChild(select);

    row.appendChild(phaseLabel);
    row.appendChild(layerSelectWrap);
    container.appendChild(row);
  });
}

// Build <option> list for a layer <select>
function buildLayerSelectOptions(selectEl, selectedValue) {
  selectEl.innerHTML = "";
  _modalCustomLayers.forEach(ln => {
    const opt = document.createElement("option");
    opt.value = ln;
    opt.textContent = ln;
    if (ln === selectedValue) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

// Rebuild all select dropdowns when a new layer is added
function rebuildAllLayerSelects() {
  document.querySelectorAll(".layer-select").forEach(sel => {
    const current = sel.value;
    buildLayerSelectOptions(sel, current);
  });
}

// Add a new custom layer name
function addCustomLayer(name) {
  const clean = name.trim().toLowerCase().replace(/\s+/g, "_");
  if (!clean) return;
  if (_modalCustomLayers.includes(clean)) {
    showToast(`Layer "${clean}" already exists.`, "warning");
    return;
  }
  _modalCustomLayers.push(clean);
  rebuildAllLayerSelects();
  showToast(`Layer "${clean}" added!`);
}

// Save concept from modal data
function saveConceptFromModal() {
  const nameInput = document.getElementById("input-concept-name").value.trim();
  if (!nameInput) {
    showToast("Please enter a concept name.", "warning");
    document.getElementById("input-concept-name").focus();
    return;
  }

  // Category: custom input takes priority over select
  const customCat = document.getElementById("input-concept-category-custom").value.trim();
  const selectCat = document.getElementById("select-concept-category").value;
  const category = customCat || selectCat || "Uncategorized";

  // Build layers map from select values
  const layersMap = {};
  let phaseIndexCounter = 0;
  document.querySelectorAll(".layer-select").forEach(sel => {
    const phaseId = sel.getAttribute("data-phase-id");
    const layerName = sel.value;
    const phase = state.phases.find(p => p.id === phaseId);
    if (!phase) return;
    if (!layersMap[layerName]) layersMap[layerName] = [];

    let phaseCopy = JSON.parse(JSON.stringify(phase));
    ensurePhaseStructure(phaseCopy);
    phaseCopy._originalIndex = phaseIndexCounter++;
    layersMap[layerName].push(phaseCopy);
  });

  if (Object.keys(layersMap).length === 0) {
    showToast("No phases assigned to layers.", "warning");
    return;
  }

  const concept = {
    id: "concept_" + Date.now(),
    name: nameInput,
    category: category,
    layers: layersMap,
    createdAt: new Date().toISOString(),
    isPinned: false,
    isBookmarked: false
  };

  state.concepts.push(concept);
  saveConceptsToStorage();

  // 新しく作成されたコンセプトをアクティブ化し、コミット可能にする
  state.activeConcept = concept.id;
  updateCommitButton();

  // If new custom category, update active filter to show it
  _conceptActiveCat = null;

  closeConceptModal();
  showToast(`Concept "${nameInput}" saved!`);
  renderConceptLibrary();
}

// ---- Wire up all Concept Library events ----
async function initConceptLibrary() {
  await loadConceptsFromStorage();
  renderConceptLibrary();

  // Open save modal
  document.getElementById("btn-open-save-concept").addEventListener("click", openSaveConceptModal);

  // Close modal buttons
  document.getElementById("btn-close-concept-modal").addEventListener("click", closeConceptModal);
  document.getElementById("btn-cancel-concept-modal").addEventListener("click", closeConceptModal);

  // Confirm save
  document.getElementById("btn-confirm-save-concept").addEventListener("click", saveConceptFromModal);

  // Add custom layer button
  document.getElementById("btn-add-custom-layer").addEventListener("click", () => {
    const inp = document.getElementById("input-new-layer-name");
    addCustomLayer(inp.value);
    inp.value = "";
  });

  // Custom layer via Enter key
  document.getElementById("input-new-layer-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addCustomLayer(e.target.value);
      e.target.value = "";
    }
  });

  // BOOKMARK modal
  const btnOpenBM = document.getElementById("btn-open-bookmark-modal");
  if (btnOpenBM) btnOpenBM.addEventListener("click", openBookmarkModal);

  const btnCloseBM = document.getElementById("btn-close-bookmark-modal");
  if (btnCloseBM) btnCloseBM.addEventListener("click", closeBookmarkModal);

  // Close modal on Escape (add to existing escape handler)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeConceptModal();
      closeBookmarkModal();
    }
  });

  // ---- コミットボタン ----
  document.getElementById("btn-commit-to-concept").addEventListener("click", commitToConceptHistory);

  // 起動時にボタン状態を同期
  updateCommitButton();
}

// ============================================================
//  BOOKMARK MODAL
// ============================================================

function openBookmarkModal() {
  const modal = document.getElementById("bookmark-list-modal");
  if (!modal) return;

  const listEl = document.getElementById("bookmark-modal-list");
  listEl.innerHTML = "";

  const bookmarked = state.concepts.filter(c => c.isBookmarked);

  if (bookmarked.length === 0) {
    listEl.innerHTML = `
      <div class="concept-empty-state">
        <i class="fa-solid fa-bookmark"></i>
        <p class="text-xs font-medium mb-1">ブックマークがありません</p>
        <p class="text-[10px]">カードの <i class="fa-solid fa-bookmark text-cyan-400"></i> アイコンでブックマークできます</p>
      </div>
    `;
  } else {
    bookmarked.forEach(concept => {
      const commitCount = Math.max(1, (concept.commits || []).length);

      // Count pos/neg
      let posCount = 0;
      let negCount = 0;
      Object.values(concept.layers || {}).forEach(phases => {
        (phases || []).forEach(phase => {
          if (phase.isNegative) negCount++;
          else posCount++;
        });
      });

      const isActive = state.activeConcept === concept.id;

      const card = document.createElement("div");
      card.className = "bookmark-card mb-2";
      card.style.cursor = "pointer";

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex-grow min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-slate-100 truncate">${concept.name}</span>
              ${concept.category ? `<span class="concept-category-chip shrink-0">${concept.category}</span>` : ''}
            </div>
            <div class="flex items-center gap-3">
              <span class="concept-action-link ${isActive ? 'concept-action-link--active' : ''}">
                ${commitCount} commit${commitCount !== 1 ? 's' : ''}
              </span>
              <span class="concept-phase-count">
                <span class="concept-phase-count__pos">${posCount} pos</span>
                <span class="concept-phase-count__sep">&nbsp;/&nbsp;</span>
                <span class="concept-phase-count__neg">${negCount} neg</span>
              </span>
            </div>
          </div>
          <button onclick="toggleConceptBookmark('${concept.id}', event); openBookmarkModal();"
                  class="btn-concept-bookmark is-bookmarked shrink-0 mt-0.5"
                  title="ブックマーク解除">
            <i class="fa-solid fa-bookmark"></i>
          </button>
        </div>
      `;

      // カードクリック → Workspace復元確認
      card.addEventListener("click", (e) => {
        // ブックマーク解除ボタンのクリックは無視
        if (e.target.closest(".btn-concept-bookmark")) return;

        if (!confirm("このカードに含まれる構成をWorkspaceに復元しますか？")) return;

        // 最新のCommit状態を取得（commitがあればその最新、なければlayers）
        const targetConcept = state.concepts.find(c => c.id === concept.id);
        if (!targetConcept) return;

        let restoredPhases;
        const commits = targetConcept.commits || [];
        if (commits.length > 0) {
          // 最新のコミット (末尾) を使用
          const latestCommit = commits[commits.length - 1];
          restoredPhases = JSON.parse(JSON.stringify(latestCommit.phases));
        } else {
          // コミットがない場合は layers から復元
          const allPhases = [];
          Object.entries(targetConcept.layers || {}).forEach(([layerName, phases]) => {
            (phases || []).forEach(phase => {
              allPhases.push({ ...phase, _layerName: layerName });
            });
          });
          allPhases.sort((a, b) => {
            const idxA = a._originalIndex !== undefined ? a._originalIndex : Number.MAX_SAFE_INTEGER;
            const idxB = b._originalIndex !== undefined ? b._originalIndex : Number.MAX_SAFE_INTEGER;
            return idxA - idxB;
          });
          restoredPhases = JSON.parse(JSON.stringify(allPhases));
        }

        restoredPhases.forEach(ensurePhaseStructure);
        state.phases = restoredPhases;
        state.activeConcept = targetConcept.id;

        // layers も同期する
        const layersMap = {};
        let phaseIndexCounter = 0;
        state.phases.forEach(phase => {
          const layerName = phase._layerName || "medium";
          if (!layersMap[layerName]) layersMap[layerName] = [];

          let phaseCopy = JSON.parse(JSON.stringify(phase));
          ensurePhaseStructure(phaseCopy);
          phaseCopy._originalIndex = phaseIndexCounter++;
          layersMap[layerName].push(phaseCopy);
        });
        targetConcept.layers = layersMap;
        saveConceptsToStorage();

        updateCommitButton();

        renderApp();
        closeBookmarkModal();
        showToast(`Workspace を "${targetConcept.name}" の最新状態に復元しました！`, "success");
      });

      listEl.appendChild(card);
    });
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeBookmarkModal() {
  const modal = document.getElementById("bookmark-list-modal");
  if (modal) modal.classList.remove("open");
  document.body.style.overflow = "";
}

window.handleBookmarkModalOverlayClick = function (e) {
  if (e.target.id === "bookmark-list-modal") closeBookmarkModal();
};


// ============================================================
//  CONCEPT GIT-LIKE COMMIT HISTORY
// ============================================================

/**
 * コミットボタンの有効/無効・ラベルを更新する。
 * state.activeConcept が設定されているときのみ有効化する。
 */
function updateCommitButton() {
  const btn = document.getElementById("btn-commit-to-concept");
  const label = document.getElementById("btn-commit-label");
  if (!btn) return;

  const concept = state.activeConcept
    ? state.concepts.find(c => c.id === state.activeConcept)
    : null;

  if (concept) {
    btn.disabled = false;
    const commitCount = concept.commitCount || 0;
    if (label) label.textContent = `Commit → ${concept.name} (${commitCount})`;
  } else {
    btn.disabled = true;
    if (label) label.textContent = "Commit";
  }
}

/**
 * 現在の state.phases をディープコピーして、
 * Firestore の concepts/{id}/commits サブコレクションに新しいコミットとして保存する。
 * concept.commits 配列は廃止し、commitCount フィールドでカウントを管理する。
 *
 * データ構造 (Firestoreサブコレクション):
 *   concepts/{conceptId}/commits/{commitId}
 *     id: "commit_<timestamp>",
 *     message: "Commit #N",
 *     timestamp: ISO string,
 *     phases: [ ...deep copy of state.phases ]
 */
async function commitToConceptHistory() {
  if (!state.activeConcept) {
    showToast("コンセプトが選択されていません。Libraryからコンセプトをロードしてください。", "warning");
    return;
  }

  const concept = state.concepts.find(c => c.id === state.activeConcept);
  if (!concept) {
    showToast("選択中のコンセプトが見つかりません。", "error");
    state.activeConcept = null;
    updateCommitButton();
    return;
  }

  // コミット前に現在のワークスペースの全フェーズ構造を強制的に確定・保証する
  state.phases.forEach(ensurePhaseStructure);

  const commitIndex = (concept.commitCount || 0) + 1;
  const newCommit = {
    id: "commit_" + Date.now(),
    message: `Commit #${commitIndex}`,
    timestamp: new Date().toISOString(),
    phases: JSON.parse(JSON.stringify(state.phases)) // 完全に構造が保証されたオブジェクトをディープコピー
  };

  // layers も最新コミット（state.phases）のディープコピーで同期する
  const layersMap = {};
  let phaseIndexCounter = 0;
  state.phases.forEach(phase => {
    const layerName = phase._layerName || "medium";
    if (!layersMap[layerName]) layersMap[layerName] = [];

    let phaseCopy = JSON.parse(JSON.stringify(phase));
    ensurePhaseStructure(phaseCopy);
    phaseCopy._originalIndex = phaseIndexCounter++;
    layersMap[layerName].push(phaseCopy);
  });
  concept.layers = layersMap;
  concept.commitCount = commitIndex;

  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Cannot commit to concept history.");
      return;
    }
    const { doc, setDoc, collection } = window.firestore;
    // コミットをサブコレクションの個別ドキュメントとして保存
    const commitRef = doc(collection(window.db, "concepts", concept.id, "commits"), newCommit.id);
    await setDoc(commitRef, newCommit);

    if (!concept.commits) concept.commits = [];
    concept.commits.push(newCommit);

    saveConceptsToStorage();
    updateCommitButton();

    // 保存後にWORKSPACEを再レンダリングし、保持しているすべてのPatternデータ配列をそのまま維持
    renderApp();

    showToast(`✔ Commit #${commitIndex} を "${concept.name}" に保存しました（計 ${commitIndex} commits）`);
  } catch (error) {
    console.error("Error saving commit to Firestore: ", error);
    showToast("コミットの保存に失敗しました", "error");
  }
}

// ---- CONCEPT ARCHIVE & EXTRA ACTIONS ----

window.renderConceptArchive = function () {
  const container = document.getElementById("concept-archive-list-container");
  if (!container) return;
  container.innerHTML = "";

  // 全てのコンセプトからアーカイブ（退避データ）を横断的に集約して永続表示化
  let allArchived = [];
  state.concepts.forEach(c => {
    if (Array.isArray(c.archivedCommits)) {
      c.archivedCommits.forEach(a => {
        allArchived.push(a);
      });
    }
  });

  if (allArchived.length === 0) {
    container.innerHTML = `<p class="text-slate-500 text-xs text-center py-4">TIME-LINE TREE内の「○」ボタンをクリックすると、ここに選択したCommitデータが最大5件まで永続保存・表示されます。</p>`;
    return;
  }

  // タイムスタンプ順に降順（新しい退避データが上）にソートして最大5件を描画
  allArchived.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  allArchived = allArchived.slice(0, 5);

  allArchived.forEach(arch => {
    const card = document.createElement("div");
    card.className = "flex items-center justify-between p-2.5 rounded-lg border border-slate-700/40 bg-slate-800/20 hover:bg-slate-850 hover:border-slate-600 transition group text-xs";
    const dateStr = new Date(arch.timestamp).toLocaleString();

    card.innerHTML = `
      <div class="flex-grow text-left pr-2">
        <div class="font-bold text-slate-300">${arch.sourceMessage} <span class="text-purple-400 font-normal ml-1">[${arch.conceptName}]</span></div>
        <div class="text-[9px] text-slate-500 font-mono mt-0.5">${dateStr}</div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="restoreArchivedCardDirectly('${arch.conceptId}', '${arch.sourceCommitId}')" class="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition rounded text-[10px] font-semibold">
          Restore
        </button>
        <button onclick="deleteArchivedCommitDirectly('${arch.conceptId}', '${arch.id}')" class="text-rose-400 hover:text-rose-300">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
};

window.restoreCommit = function (conceptId, commitId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;

  const commit = (concept.commits || []).find(c => c.id === commitId);
  if (!commit) return;

  if (!confirm(`Restore to "${commit.message}"?\n現在のワークスペースは上書きされます。`)) return;

  const restoredPhases = JSON.parse(JSON.stringify(commit.phases));
  restoredPhases.forEach(ensurePhaseStructure);
  state.phases = restoredPhases;

  // layers も復元した状態のディープコピーで同期する
  const layersMap = {};
  let phaseIndexCounter = 0;
  state.phases.forEach(phase => {
    const layerName = phase._layerName || "medium";
    if (!layersMap[layerName]) layersMap[layerName] = [];

    let phaseCopy = JSON.parse(JSON.stringify(phase));
    ensurePhaseStructure(phaseCopy);
    phaseCopy._originalIndex = phaseIndexCounter++;
    layersMap[layerName].push(phaseCopy);
  });
  concept.layers = layersMap;
  saveConceptsToStorage();

  showToast(`Restored to commit "${commit.message}"`, "success");
  renderApp();
};

window.deleteCommit = async function (conceptId, commitId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;

  const idx = (concept.commits || []).findIndex(c => c.id === commitId);
  if (idx === -1) return;

  if (!confirm(`Delete commit "${concept.commits[idx].message}"?`)) return;

  try {
    if (!window.firestore || !window.db) {
      console.warn("Firestore or db is not initialized. Cannot delete commit.");
      return;
    }
    const { doc, deleteDoc } = window.firestore;
    await deleteDoc(doc(window.db, "concepts", conceptId, "commits", commitId));
    concept.commits.splice(idx, 1);
    saveConceptsToStorage();
    updateCommitButton();
    renderConceptLibrary();
    if (_timelineConceptId === conceptId) {
      renderTimelineTree(conceptId);
    }
    showToast("Commit deleted.", "warning");
  } catch (error) {
    console.error("Error deleting commit:", error);
    showToast("Failed to delete commit.", "error");
  }
};

window.startEditConceptTitle = function (conceptId, event) {
  if (event) event.stopPropagation();
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;

  const titleEl = document.getElementById(`concept-title-${conceptId}`);
  if (!titleEl) return;

  titleEl.innerHTML = `
    <input type="text" 
           id="edit-concept-title-input-${conceptId}" 
           value="${concept.name}" 
           class="bg-slate-950/80 border border-slate-700 rounded px-2 py-0.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-500 w-36"
           onkeydown="handleEditConceptTitleKeydown(event, '${conceptId}')"
           onblur="saveConceptTitle('${conceptId}')"
           onclick="event.stopPropagation()"
    >
  `;

  const input = document.getElementById(`edit-concept-title-input-${conceptId}`);
  if (input) {
    input.focus();
    input.select();
  }
};

window.handleEditConceptTitleKeydown = function (e, conceptId) {
  if (e.key === "Enter") {
    e.preventDefault();
    saveConceptTitle(conceptId);
  } else if (e.key === "Escape") {
    renderConceptLibrary();
  }
};

window.saveConceptTitle = function (conceptId) {
  const input = document.getElementById(`edit-concept-title-input-${conceptId}`);
  if (!input) return;

  const newName = input.value.trim();
  const concept = state.concepts.find(c => c.id === conceptId);
  if (concept && newName) {
    concept.name = newName;
    saveConceptsToStorage();
    showToast(`Concept renamed to "${newName}"`);
  }
  renderConceptLibrary();
};

// ============================================================
//  TIME-LINE TREE  &  DIFF ENGINE
// ============================================================

// State for the currently open timeline
let _timelineConceptId = null;   // which concept's tree is open
let _activeDiffIndex = null;   // index in commits[] of the OLDER commit in the selected diff pair
let _activeDiffTab = 'note'; // currently selected diff tab

/**
 * Called from the card's "tree" button.
 * Shows the TIME-LINE TREE panel for the given concept.
 */
window.toggleConceptTree = async function (conceptId, event) {
  if (event) event.stopPropagation();

  const panel = document.getElementById('timeline-tree-panel');
  if (!panel) return;

  // If the same concept is already open, toggle closed
  if (_timelineConceptId === conceptId && !panel.classList.contains('hidden')) {
    closeTimelineTree();
    return;
  }

  _timelineConceptId = conceptId;
  _activeDiffIndex = null;
  _activeDiffTab = 'note';

  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;

  if (!concept.commits || concept.commits.length === 0) {
    concept.commits = await fetchConceptCommits(conceptId);
  }

  // Update header name
  const nameEl = document.getElementById('timeline-concept-name');
  if (nameEl) nameEl.textContent = concept.name;

  // Show panel
  panel.classList.remove('hidden');

  // Scroll panel into view smoothly
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);

  renderTimelineTree(conceptId);

  // Auto-select the newest diff (between last two commits) if ≥2 commits
  const commits = concept.commits || [];
  if (commits.length >= 2) {
    // newest diff = between commits[length-2] and commits[length-1]
    openDiff(conceptId, commits.length - 2);
  } else {
    const diffArea = document.getElementById('diff-content-area');
    if (diffArea) diffArea.innerHTML = '<p class="text-slate-600 text-center py-6">コミットが2件以上必要です。</p>';
  }
};

/**
 * Close the timeline panel.
 */
window.closeTimelineTree = function () {
  const panel = document.getElementById('timeline-tree-panel');
  if (panel) panel.classList.add('hidden');
  _timelineConceptId = null;
  _activeDiffIndex = null;
};

/**
 * Scroll the timeline list up (-1) or down (+1) by one page step.
 */
window.scrollTimeline = function (dir) {
  const list = document.getElementById('timeline-list');
  if (!list) return;
  list.scrollBy({ top: dir * 80, behavior: 'smooth' });
};

/**
 * Render the vertical dashed timeline for a concept.
 */
function renderTimelineTree(conceptId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  const list = document.getElementById('timeline-list');
  if (!concept || !list) return;

  list.innerHTML = '';
  const commits = concept.commits || [];

  if (commits.length === 0) {
    list.innerHTML = '<p class="text-slate-600 text-xs text-center py-6">コミット履歴がありません。</p>';
    return;
  }

  // Build from newest to oldest (visual top = most recent)
  [...commits].reverse().forEach((commit, revIdx) => {
    const realIdx = commits.length - 1 - revIdx; // index in commits[] (oldest=0)
    const dateStr = formatTimestampFull(commit.timestamp);

    /* ○ Commit row */
    const commitRow = document.createElement('div');
    commitRow.className = 'tl-row items-center mb-0';
    commitRow.innerHTML = `
      <div class="tl-connector">
        ${revIdx === 0 ? '' : '<div class="tl-connector-line" style="min-height:8px"></div>'}
        <button class="tl-node-commit ${_activeDiffIndex === realIdx ? 'active' : ''}"
                title="このコミットをARCHIVEに復元"
                onclick="restoreCommitToArchive('${conceptId}','${commit.id}')">
          ○
        </button>
        <div class="tl-connector-line"></div>
      </div>
      <div class="tl-label tl-label-commit">
        <button class="tl-commit-btn" onclick="openCommitDetailOverlay('${conceptId}', '${commit.id}')">${commit.message}</button><br>
        <span class="font-mono text-[9px] text-slate-500">${dateStr}</span>
      </div>
    `;
    list.appendChild(commitRow);

    /* × Diff row (between this commit and the next older one) */
    if (realIdx > 0) {
      const olderCommit = commits[realIdx - 1];
      const diffRow = document.createElement('div');
      diffRow.className = 'tl-row items-center mb-0';
      diffRow.innerHTML = `
        <div class="tl-connector">
          <div class="tl-connector-line"></div>
          <button class="tl-node-diff ${_activeDiffIndex === realIdx - 1 ? 'active' : ''}"
                  title="${olderCommit.message} → ${commit.message} の差分"
                  onclick="openDiff('${conceptId}', ${realIdx - 1})">
            ×
          </button>
          <div class="tl-connector-line"></div>
        </div>
        <div class="tl-label tl-label-diff">${olderCommit.message} → ${commit.message} change</div>
      `;
      list.appendChild(diffRow);
    }
  });
}

/**
 * Format timestamp as YYYY/MM/DD/hh:mm:ss
 */
function formatTimestampFull(isoStr) {
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Restore a specific commit's phases to the ARCHIVE panel
 * (does NOT touch current workspace).
 */
window.restoreCommitToArchive = function (conceptId, commitId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;
  const commit = (concept.commits || []).find(c => c.id === commitId);
  if (!commit) return;

  if (!confirm(`「${commit.message}」の構成をSTYLE CONCEPT ARCHIVEに退避・保存しますか？\n（ワークスペースは変更されません）`)) return;

  if (!Array.isArray(concept.archivedCommits)) concept.archivedCommits = [];

  const alreadyArchived = concept.archivedCommits.some(a => a.sourceCommitId === commitId);
  if (alreadyArchived) {
    showToast(`「${commit.message}」は既にARCHIVEに存在します。`, 'warning');
    return;
  }

  // 最大5件制限：上限に達している場合は最も古いアーカイブ（先頭）を削除
  if (concept.archivedCommits.length >= 5) {
    concept.archivedCommits.shift();
  }

  concept.archivedCommits.push({
    id: 'arch_' + Date.now(),
    conceptId: conceptId,         // コンセプトIDを保持
    conceptName: concept.name,     // コンセプトタイトル（テーマ名）を保持
    sourceCommitId: commitId,
    sourceMessage: commit.message,
    timestamp: commit.timestamp,
    phases: JSON.parse(JSON.stringify(commit.phases))
  });

  saveConceptsToStorage();
  renderConceptArchive();
  showToast(`「${commit.message}」をARCHIVEに保存しました（最大5件）。`, 'success');
};

// アーカイブカード専用の復元・削除ヘルパー関数を追記
window.restoreArchivedCardDirectly = function (conceptId, commitId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;
  const commit = (concept.commits || []).find(c => c.id === commitId);
  if (!commit) return;
  if (!confirm(`このアーカイブから「${commit.message}」の状態をWORKSPACEに復元しますか？`)) return;

  const restoredPhases = JSON.parse(JSON.stringify(commit.phases));
  restoredPhases.forEach(ensurePhaseStructure);
  state.phases = restoredPhases;
  state.activeConcept = conceptId;

  // layers も復元した状態のディープコピーで同期する
  const layersMap = {};
  let phaseIndexCounter = 0;
  state.phases.forEach(phase => {
    const layerName = phase._layerName || "medium";
    if (!layersMap[layerName]) layersMap[layerName] = [];

    let phaseCopy = JSON.parse(JSON.stringify(phase));
    ensurePhaseStructure(phaseCopy);
    phaseCopy._originalIndex = phaseIndexCounter++;
    layersMap[layerName].push(phaseCopy);
  });
  concept.layers = layersMap;
  saveConceptsToStorage();

  if (typeof updateCommitButton === "function") updateCommitButton();
  renderApp();
  showToast(`アーカイブから「${commit.message}」を復元しました`);
};

window.deleteArchivedCommitDirectly = function (conceptId, archId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept || !Array.isArray(concept.archivedCommits)) return;
  const idx = concept.archivedCommits.findIndex(a => a.id === archId);
  if (idx === -1) return;
  if (!confirm("このアーカイブカードを削除しますか？")) return;

  concept.archivedCommits.splice(idx, 1);
  saveConceptsToStorage();
  renderConceptArchive();
  showToast("アーカイブカードを削除しました", "warning");
};

/**
 * Open the diff panel for the gap between commits[idx] and commits[idx+1].
 */
window.openDiff = function (conceptId, olderIdx) {
  _timelineConceptId = conceptId;
  _activeDiffIndex = olderIdx;
  _activeDiffTab = 'note';

  // Re-render timeline to reflect active state
  renderTimelineTree(conceptId);

  // Render the current tab
  renderDiffTab(_activeDiffTab);

  // Ensure Note tab is visually active
  switchDiffTab('note', false);
};

/**
 * Switch which diff tab is shown.
 * @param {string} tab
 * @param {boolean} [updateState=true]
 */
window.switchDiffTab = function (tab, updateState = true) {
  if (updateState) _activeDiffTab = tab;

  // Update tab button styles
  document.querySelectorAll('.diff-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });

  renderDiffTab(tab);
};

/**
 * Dispatch to the correct diff renderer based on tab name.
 */
function renderDiffTab(tab) {
  const area = document.getElementById('diff-content-area');
  if (!area) return;

  if (_activeDiffIndex === null || _timelineConceptId === null) {
    area.innerHTML = '<p class="text-slate-600 text-center py-6">← コミット行の × をクリックして差分を表示</p>';
    return;
  }

  const concept = state.concepts.find(c => c.id === _timelineConceptId);
  if (!concept) return;

  const commits = concept.commits || [];
  const olderCommit = commits[_activeDiffIndex];
  const newerCommit = commits[_activeDiffIndex + 1];
  if (!olderCommit || !newerCommit) return;

  const label = `${olderCommit.message} → ${newerCommit.message}`;

  switch (tab) {
    case 'note': area.innerHTML = renderDiffNote(concept, olderCommit, newerCommit); break;
    case 'weight': area.innerHTML = renderDiffWeight(olderCommit, newerCommit, label); break;
    case 'token': area.innerHTML = renderDiffToken(olderCommit, newerCommit, label); break;
    case 'core': area.innerHTML = renderDiffCore(olderCommit, newerCommit, label); break;
    case 'pattern': area.innerHTML = renderDiffPattern(olderCommit, newerCommit, label); break;
    case 'phase': area.innerHTML = renderDiffPhase(olderCommit, newerCommit, label); break;
    default: area.innerHTML = '';
  }

  // Wire up note save button after render
  if (tab === 'note') {
    const saveBtn = document.getElementById('btn-save-diff-note');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const ta = document.getElementById('diff-note-input');
        if (!ta) return;
        // Store note on the NEWER commit (the one that introduces the change)
        newerCommit.note = ta.value;
        saveConceptsToStorage();
        showToast('Note saved!');
      });
    }
  }
}

/* ---------------------------------------------------------------
   NOTE TAB
--------------------------------------------------------------- */
function renderDiffNote(concept, olderCommit, newerCommit, label) {
  const existingNote = newerCommit.note || '';
  return `
    <div class="diff-section-title">Note — ${newerCommit.message}</div>
    <p class="text-slate-500 mb-2 text-[10px]">このコミットに関するメモを自由に記録できます。</p>
    <textarea id="diff-note-input" class="diff-note-textarea" placeholder="日本語でメモを入力…">${existingNote}</textarea>
    <button id="btn-save-diff-note" class="mt-2 px-3 py-1.5 bg-cyan-900/40 hover:bg-cyan-800/50 border border-cyan-600/30 text-cyan-300 hover:text-cyan-200 rounded text-[10px] font-semibold transition flex items-center gap-1.5">
      <i class="fa-solid fa-floppy-disk text-[9px]"></i> Save Note
    </button>
  `;
}

/* ---------------------------------------------------------------
   WEIGHT TAB
--------------------------------------------------------------- */
function renderDiffWeight(olderCommit, newerCommit, label) {
  const changes = [];

  newerCommit.phases.forEach((newPhase, pi) => {
    const oldPhase = olderCommit.phases.find(p => p.id === newPhase.id);
    if (!oldPhase) return;

    const newTokens = getAllPhaseTokens(newPhase);
    const oldTokens = getAllPhaseTokens(oldPhase);

    newTokens.forEach(newTok => {
      const oldTok = oldTokens.find(t => t.id === newTok.id);
      if (!oldTok) return;

      const oldWVal = (oldTok.weight !== undefined && oldTok.weight !== null && !isNaN(parseFloat(oldTok.weight))) ? parseFloat(oldTok.weight) : 1.0;
      const newWVal = (newTok.weight !== undefined && newTok.weight !== null && !isNaN(parseFloat(newTok.weight))) ? parseFloat(newTok.weight) : 1.0;

      if (Math.abs(newWVal - oldWVal) > 0.001) {
        // find pattern context
        const patternCtx = getTokenPatternContext(newPhase, newTok.id);
        changes.push({
          text: newTok.text,
          oldW: oldWVal.toFixed(2),
          newW: newWVal.toFixed(2),
          phase: newPhase.name,
          ctx: patternCtx
        });
      }
    });
  });

  if (changes.length === 0) {
    return `<div class="diff-section-title">Weight Changes — ${label}</div><p class="text-slate-600 py-4 text-center">変更なし</p>`;
  }

  let html = `<div class="diff-section-title">Weight Changes — ${label}</div>`;
  changes.forEach(c => {
    const dir = parseFloat(c.newW) > parseFloat(c.oldW) ? '↑' : '↓';
    html += `<div class="diff-mod font-mono">(${c.text}:${c.oldW}) → (${c.text}:${c.newW}) ${dir} <span class="text-slate-500 text-[9px]">[${c.phase}${c.ctx}]</span></div>`;
  });
  return html;
}

/* ---------------------------------------------------------------
   TOKEN TAB
--------------------------------------------------------------- */
function renderDiffToken(olderCommit, newerCommit, label) {
  let html = `<div class="diff-section-title">Token Changes — ${label}</div>`;

  // 【修正②】 サブタブ（FLUCTUATION / REARRANGEMENT）の追加
  html += `
    <div class="flex flex-row mt-2 mb-3">
      <button id="btn-diff-fluctuation" class="flex-1 py-1.5 text-center text-xs font-bold text-white bg-amber-500 transition" onclick="switchTokenSubTab('fluctuation')">FLUCTUATION</button>
      <button id="btn-diff-rearrangement" class="flex-1 py-1.5 text-center text-xs font-bold text-white bg-emerald-500 opacity-50 hover:opacity-100 transition" onclick="switchTokenSubTab('rearrangement')">REARRANGEMENT</button>
    </div>
  `;

  // --- FLUCTUATION 画面 (初期状態) ---
  html += `<div id="token-diff-fluctuation-view">`;
  let hasChange = false;
  let fluctHtml = '';

  newerCommit.phases.forEach(newPhase => {
    const oldPhase = olderCommit.phases.find(p => p.id === newPhase.id);

    const newTokens = getAllPhaseTokens(newPhase);
    const oldTokens = oldPhase ? getAllPhaseTokens(oldPhase) : [];

    const addedIds = newTokens.filter(t => !oldTokens.find(o => o.id === t.id));
    const removedIds = oldTokens.filter(t => !newTokens.find(n => n.id === t.id));

    if (addedIds.length === 0 && removedIds.length === 0) return;
    hasChange = true;

    fluctHtml += `<div class="text-[10px] font-bold text-slate-400 mt-2 mb-1 uppercase">${newPhase.name}</div>`;

    // 【修正①】 トークン増減の文字列横に [Pattern x] を併記
    addedIds.forEach(t => {
      let ctx = getTokenPatternContext(newPhase, t.id);
      let patternStr = ctx ? ` <span class="text-slate-500 text-[9px] font-mono">[${ctx.replace(', ', '')}]</span>` : '';
      fluctHtml += `<div class="diff-add">+ ${t.text}${patternStr}</div>`;
    });
    removedIds.forEach(t => {
      let ctx = getTokenPatternContext(oldPhase, t.id);
      let patternStr = ctx ? ` <span class="text-slate-500 text-[9px] font-mono">[${ctx.replace(', ', '')}]</span>` : '';
      fluctHtml += `<div class="diff-del">- <em>${t.text}</em>${patternStr}</div>`;
    });
  });

  // 古いコミットにしか存在しないPhase（Phase自体が削除された場合）の処理
  olderCommit.phases.forEach(oldPhase => {
    if (!newerCommit.phases.find(p => p.id === oldPhase.id)) {
      const toks = getAllPhaseTokens(oldPhase);
      if (toks.length > 0) {
        hasChange = true;
        fluctHtml += `<div class="text-[10px] font-bold text-slate-400 mt-2 mb-1 uppercase">${oldPhase.name} (Phase削除)</div>`;
        toks.forEach(t => {
          let ctx = getTokenPatternContext(oldPhase, t.id);
          let patternStr = ctx ? ` <span class="text-slate-500 text-[9px] font-mono">[${ctx.replace(', ', '')}]</span>` : '';
          fluctHtml += `<div class="diff-del">- <em>${t.text}</em>${patternStr}</div>`;
        });
      }
    }
  });

  if (!hasChange) fluctHtml += '<p class="text-slate-600 py-4 text-center">変更なし</p>';
  html += fluctHtml;
  html += `</div>`; // FLUCTUATION view 終了

  // --- REARRANGEMENT 画面 ---
  html += `<div id="token-diff-rearrangement-view" class="hidden">`;
  html += renderRearrangementView(olderCommit, newerCommit);
  html += `</div>`; // REARRANGEMENT view 終了

  return html;
}

// =========================================================
// 以下、新規追加関数群
// =========================================================

// サブタブ切り替え制御
window.switchTokenSubTab = function (subTab) {
  const fluctBtn = document.getElementById('btn-diff-fluctuation');
  const rearrBtn = document.getElementById('btn-diff-rearrangement');
  const fluctView = document.getElementById('token-diff-fluctuation-view');
  const rearrView = document.getElementById('token-diff-rearrangement-view');

  if (!fluctBtn || !rearrBtn || !fluctView || !rearrView) return;

  if (subTab === 'fluctuation') {
    fluctBtn.classList.remove('opacity-50');
    rearrBtn.classList.add('opacity-50');
    fluctView.classList.remove('hidden');
    rearrView.classList.add('hidden');
  } else {
    rearrBtn.classList.remove('opacity-50');
    fluctBtn.classList.add('opacity-50');
    rearrView.classList.remove('hidden');
    fluctView.classList.add('hidden');
  }
};

// パターン単位の変更検知
function isPatternChanged(oldPat, newPat) {
  if (!oldPat && !newPat) return false;
  if (!oldPat || !newPat) return true;
  const oldToks = oldPat.tokens || [];
  const newToks = newPat.tokens || [];
  if (oldToks.length !== newToks.length) return true; // 増減あり
  for (let i = 0; i < oldToks.length; i++) {
    if (oldToks[i].id !== newToks[i].id ||
      oldToks[i].text !== newToks[i].text ||
      parseFloat(oldToks[i].weight) !== parseFloat(newToks[i].weight) ||
      oldToks[i].isActive !== newToks[i].isActive) {
      return true; // 順序、文字、ウェイト、アクティブ状態のいずれかが変更
    }
  }
  return false;
}

// REARRANGEMENT画面のレンダリング
function renderRearrangementView(olderCommit, newerCommit) {
  let html = '';
  let hasAnyChange = false;

  // 両方のCommitから対象となる全PhaseIDを抽出
  const allPhaseIds = new Set([
    ...olderCommit.phases.map(p => p.id),
    ...newerCommit.phases.map(p => p.id)
  ]);

  allPhaseIds.forEach(phaseId => {
    const oldPhase = olderCommit.phases.find(p => p.id === phaseId);
    const newPhase = newerCommit.phases.find(p => p.id === phaseId);
    let phaseChangesHtml = '';
    const phaseName = newPhase ? newPhase.name : (oldPhase ? oldPhase.name : '');
    const isNeg = newPhase ? newPhase.isNegative : (oldPhase ? oldPhase.isNegative : false);

    if (isNeg) {
      const oldToks = oldPhase ? (oldPhase.tokens || []) : [];
      const newToks = newPhase ? (newPhase.tokens || []) : [];
      if (isPatternChanged({ tokens: oldToks }, { tokens: newToks })) {
        phaseChangesHtml += `<button class="rearrangement-pat-btn block text-left text-pink-400 font-bold text-xs py-1 hover:text-pink-300 transition uppercase tracking-wide" onclick="openRearrangementModal('${phaseId}', null)">TOKENS</button>`;
      }
    } else {
      const oldPats = oldPhase ? (oldPhase.patterns || []) : [];
      const newPats = newPhase ? (newPhase.patterns || []) : [];
      const maxLen = Math.max(oldPats.length, newPats.length);
      for (let i = 0; i < maxLen; i++) {
        if (isPatternChanged(oldPats[i], newPats[i])) {
          phaseChangesHtml += `<button class="rearrangement-pat-btn block text-left text-pink-400 font-bold text-xs py-1 hover:text-pink-300 transition uppercase tracking-wide" onclick="openRearrangementModal('${phaseId}', ${i})">PATTERN ${i + 1}</button>`;
        }
      }
    }

    if (phaseChangesHtml) {
      hasAnyChange = true;
      html += `<div class="mb-3">`;
      html += `<div class="text-white font-bold text-sm mb-1">PHASE/${phaseName}</div>`;
      html += phaseChangesHtml;
      html += `</div>`;
    }
  });

  if (!hasAnyChange) return '<p class="text-slate-600 py-4 text-center">変更なし</p>';
  return html;
}

// 【修正③】 REARRANGEMENT モーダルの展開ロジック
window.openRearrangementModal = function (phaseId, patternIndex) {
  if (_activeDiffIndex === null || _timelineConceptId === null) return;
  const concept = state.concepts.find(c => c.id === _timelineConceptId);
  if (!concept || !concept.commits) return;

  const olderCommit = concept.commits[_activeDiffIndex];
  const newerCommit = concept.commits[_activeDiffIndex + 1];
  if (!olderCommit || !newerCommit) return;

  const oldPhase = olderCommit.phases.find(p => p.id === phaseId);
  const newPhase = newerCommit.phases.find(p => p.id === phaseId);
  const phaseName = newPhase ? newPhase.name : (oldPhase ? oldPhase.name : '');

  // プロンプトをテキスト並列形式（COMPILE画面形式）に整形するヘルパー
  const formatTokens = (tokens) => {
    if (!tokens || tokens.length === 0) return '';
    return tokens.filter(t => t.isActive !== false).map(t => {
      let weight = parseFloat(t.weight);
      let term = t.text.trim();
      if (weight === 1.0) return term;
      let weightStr = weight.toFixed(3).replace(/\.?0+$/, "");
      return `(${term}:${weightStr})`;
    }).join(", ");
  };

  let oldPrompt = '';
  let newPrompt = '';
  let titleStr = `PHASE/ ${phaseName}`;

  if (patternIndex === null) {
    const oldToks = oldPhase ? (oldPhase.tokens || []) : [];
    const newToks = newPhase ? (newPhase.tokens || []) : [];
    oldPrompt = formatTokens(oldToks);
    newPrompt = formatTokens(newToks);
  } else {
    titleStr += `, Pattern ${patternIndex + 1}`;
    const oldPat = oldPhase && oldPhase.patterns ? oldPhase.patterns[patternIndex] : null;
    const newPat = newPhase && newPhase.patterns ? newPhase.patterns[patternIndex] : null;
    oldPrompt = formatTokens(oldPat ? oldPat.tokens : []);
    newPrompt = formatTokens(newPat ? newPat.tokens : []);
  }

  // モーダルへ内容を注入
  document.getElementById('rearrangement-modal-title').innerText = titleStr;
  document.getElementById('rearrangement-old-commit-label').innerText = `${olderCommit.message}`;
  document.getElementById('rearrangement-old-text').value = oldPrompt || '(なし)';
  document.getElementById('rearrangement-new-commit-label').innerText = `${newerCommit.message}`;
  document.getElementById('rearrangement-new-text').value = newPrompt || '(なし)';

  // モーダル表示アクション
  const modal = document.getElementById('rearrangement-modal');
  const content = document.getElementById('rearrangement-modal-content');
  modal.classList.remove('hidden');
  setTimeout(() => {
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
  }, 10);
};

// モーダルを閉じるアクション
window.closeRearrangementModal = function () {
  const modal = document.getElementById('rearrangement-modal');
  const content = document.getElementById('rearrangement-modal-content');
  if (modal && !modal.classList.contains('hidden')) {
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 150);
  }
};

// Escapeキー押下でモーダルを閉じる対応
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (typeof window.closeRearrangementModal === 'function') {
      window.closeRearrangementModal();
    }
  }
});

/* ---------------------------------------------------------------
   CORE TAB
--------------------------------------------------------------- */
function renderDiffCore(olderCommit, newerCommit, label) {
  let html = `<div class="diff-section-title">Core Mark Changes — ${label}</div>`;
  let hasChange = false;

  newerCommit.phases.forEach(newPhase => {
    if (newPhase.isNegative) return;
    const oldPhase = olderCommit.phases.find(p => p.id === newPhase.id);
    const newTokens = getAllPhaseTokens(newPhase);
    const oldTokens = oldPhase ? getAllPhaseTokens(oldPhase) : [];

    newTokens.forEach(newTok => {
      const oldTok = oldTokens.find(t => t.id === newTok.id);
      const wasCore = oldTok ? !!oldTok.isCore : false;
      const isCore = !!newTok.isCore;
      if (wasCore !== isCore) {
        hasChange = true;
        if (isCore) {
          html += `<div class="diff-add">★ Core 付与: ${newTok.text} <span class="text-[9px] text-slate-500">[${newPhase.name}]</span></div>`;
        } else {
          html += `<div class="diff-del">☆ Core 解除: <em>${newTok.text}</em> <span class="text-[9px] text-slate-500">[${newPhase.name}]</span></div>`;
        }
      }
    });
  });

  if (!hasChange) html += '<p class="text-slate-600 py-4 text-center">Core変更なし</p>';
  return html;
}

/* ---------------------------------------------------------------
   PATTERN TAB
--------------------------------------------------------------- */
function renderDiffPattern(olderCommit, newerCommit, label) {
  let html = `<div class="diff-section-title">Pattern Changes — ${label}</div>`;
  let hasChange = false;

  newerCommit.phases.forEach(newPhase => {
    if (newPhase.isNegative) return;
    const oldPhase = olderCommit.phases.find(p => p.id === newPhase.id);
    const newPats = newPhase.patterns || [];
    const oldPats = oldPhase ? (oldPhase.patterns || []) : [];

    const added = newPats.length - oldPats.length;
    if (added === 0) return;
    hasChange = true;

    const dir = added > 0 ? 'diff-add' : 'diff-del';
    const sign = added > 0 ? `+${added} Pattern追加` : `${added} Pattern削除`;
    html += `<div class="${dir}">${sign}: [${newPhase.name}] (${oldPats.length} → ${newPats.length})</div>`;
  });

  if (!hasChange) html += '<p class="text-slate-600 py-4 text-center">Pattern変更なし</p>';
  return html;
}

/* ---------------------------------------------------------------
   PHASE TAB
--------------------------------------------------------------- */
function renderDiffPhase(olderCommit, newerCommit, label) {
  let html = `<div class="diff-section-title">Phase Changes — ${label}</div>`;

  const oldIds = olderCommit.phases.map(p => p.id);
  const newIds = newerCommit.phases.map(p => p.id);

  // Added
  const addedPhases = newerCommit.phases.filter(p => !oldIds.includes(p.id));
  // Removed
  const removedPhases = olderCommit.phases.filter(p => !newIds.includes(p.id));

  addedPhases.forEach(p => {
    html += `<div class="diff-add">+ <em>${p.name}</em> (${p.isNegative ? 'Negative' : 'Positive'})</div>`;
  });
  removedPhases.forEach(p => {
    html += `<div class="diff-del">- <em>${p.name}</em> (${p.isNegative ? 'Negative' : 'Positive'})</div>`;
  });

  // Order changes (for phases present in both)
  const commonNewPhases = newerCommit.phases.filter(p => oldIds.includes(p.id));
  const commonOldPhases = olderCommit.phases.filter(p => newIds.includes(p.id));

  const orderChanged = commonNewPhases.some((p, i) => p.id !== commonOldPhases[i]?.id);

  if (orderChanged) {
    html += `<div class="diff-section-title mt-3">Phase Order</div>`;
    html += `<div class="flex flex-row flex-wrap items-center gap-1.5 mb-1"><div class="text-[9px] text-slate-500 mb-1">Before:</div>`;
    html += commonOldPhases.map(p =>
      `<span class="phase-order-bar ${p.isNegative ? 'neg' : 'pos'}">${p.name}</span>`
    ).join('<span class="text-slate-600 mx-1 text-xs">→</span>');
    html += `</div><div class="flex flex-row flex-wrap items-center gap-1.5 mt-1"><div class="text-[9px] text-slate-500 mb-1">After:</div>`;
    html += commonNewPhases.map(p =>
      `<span class="phase-order-bar ${p.isNegative ? 'neg' : 'pos'}">${p.name}</span>`
    ).join('<span class="text-slate-600 mx-1 text-xs">→</span>');
    html += '</div>';
  }

  if (addedPhases.length === 0 && removedPhases.length === 0 && !orderChanged) {
    html += '<p class="text-slate-600 py-4 text-center">Phase変更なし</p>';
  }

  return html;
}

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */

/**
 * Get all tokens in a phase across all patterns (or direct tokens for neg).
 */
function getAllPhaseTokens(phase) {
  if (!phase) return [];
  if (phase.isNegative) return phase.tokens || [];
  const pats = phase.patterns || [];
  const all = [];
  pats.forEach(pat => { (pat.tokens || []).forEach(t => all.push(t)); });
  return all;
}

/**
 * Return a context string like ", Pattern 2" for token location.
 */
function getTokenPatternContext(phase, tokenId) {
  if (!phase || phase.isNegative) return '';
  const pats = phase.patterns || [];
  for (let i = 0; i < pats.length; i++) {
    if ((pats[i].tokens || []).find(t => t.id === tokenId)) {
      return `, Pattern ${i + 1}`;
    }
  }
  return '';
}

window.exportSingleConcept = function (conceptId, event) {
  if (event) event.stopPropagation();
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(concept, null, 2));
  const a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `concept_${concept.name.replace(/\s+/g, '_')}_${Date.now()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`Concept "${concept.name}" exported!`);
};

// Patch renderApp to also refresh Concept Library
const _originalRenderApp = renderApp;
renderApp = function () {
  _originalRenderApp();
  renderConceptLibrary();
};

// Boot Concept Library after DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  await initConceptLibrary();
});


// ============================================================
//  GEMINI API CONFIG & STATE
// ============================================================
const LS_GEMINI_API_KEY = "diffu_gemini_api_key";
let lastSemanticResult = null;

// ── Gemini API functions are defined in geminiPromptAnalyzer.js ──
// fetchGeminiModelList(), chooseBestGeminiModel(),
// validateGeminiApiKeyFormat(), fetchGeminiSemanticAnalysis()
// are all globally available via window.* exports from that module.

// ============================================================
//  SEMANTIC DOMINANCE ANALYSIS MODULE
// ============================================================

// ---- Topology keyword definitions ----
// Each entry: { type, keywords[] }
// type: 'constraint' | 'restraint' | 'condition'
const TOPO_RULES = [
  // --- CONSTRAINT (拘束系): structural/boundary/confinement terms ---
  {
    type: 'constraint', keywords: [
      'confined', 'boundary', 'structure', 'hierarchy', 'structural', 'form-defin',
      'restrained', 'distribution', 'conditioned', 'constraint', 'constrain',
      'pressure-coherent', 'layered structure', 'density-coherent', 'value-structure',
      'form continuity', 'identity-preserving', 'identity preservation',
      'density-stratified', 'particulate aggregation', 'dispersion field restraint',
      'primary form', 'morphology preserved', 'curvature-driven', 'stereomaticy',
      'sediment grouping', 'coherence', 'field restraint', 'field-conditioned',
      'structural drapery', 'garment flow', 'fold hierarchy', 'pressure-coherent layering',
      'architectural', 'spatial layering', 'structural rhythm', 'bamboo columns',
      'depth-guided', 'enclosure', 'ornamental variance', 'structural continuity',
      'form-defining', 'tonal hierarchy', 'value-stratified', 'luminance hierarchy',
      'stratification', 'stratified', 'density-linked', 'density-gradient',
      'density differentiation', 'multi-scale', 'spatial hierarchy', 'depth stratification',
      // Added general constraint keywords
      'sharp focus', 'detailed', 'highly detailed', 'anatomy', 'eyes', 'face', 'body', 'pose', 'character', 'intricate'
    ]
  },

  // --- RESTRAINT (抑制・減衰系): attenuation/suppression/moderation terms ---
  {
    type: 'restraint', keywords: [
      'restrain', 'attenuat', 'decay', 'reduction', 'suppression', 'subordinat',
      'modulated', 'muted', 'restrained distribution', 'restrained ornamental',
      'restrained particulate', 'restrained dispersion', 'moisture decay',
      'sedimentation attenuation', 'edge softness', 'density-gradient attenuation',
      'restrained migration', 'micro tonal variation', 'localized variance',
      'variance retention', 'low-intensity', 'diffused low-intensity',
      'passive', 'soft cloth', 'shallow depth', 'mid-key', 'gentle', 'subtle',
      'pigment strictly confined', 'liquid-paper interaction domain',
      'chroma constrained', 'chroma subordinated', 'chroma modulated',
      'grayscale regime', 'value-field dominance', 'global tonal condition',
      'field-level convergence', 'density-consistent', 'global field cohesion',
      'overall mixing bias', 'over-mixing', 'homogenization', 'over-articulated',
      'over-sharpening', 'pixel-level discretization', 'line-trace exaggeration',
      'manifold flattening', 'normalization preference', 'shape drift',
      // Added general restraint keywords
      'soft lighting', 'smooth', 'blurred background', 'depth of field', 'desaturated', 'pastel', 'dim', 'subdued'
    ]
  },

  // --- CONDITION (条件・相互作用系): field/interaction/emergence terms ---
  {
    type: 'condition', keywords: [
      'condition', 'interaction', 'driven by', 'induced', 'emerging', 'emergence',
      'governed by', 'governing', 'paper absorption', 'moisture', 'capillary',
      'pigment deposition', 'pigment migration', 'pigment density', 'pigment behavior',
      'granular aggregation', 'micro-turbulent', 'differential absorption',
      'sediment', 'sedimentation', 'particulate', 'accumulation front',
      'density grouping', 'tonal formation', 'pseudo-luminance', 'luminance bleed',
      'localized tonal', 'tonal continuity', 'tonal regime', 'mid-frequency',
      'global convergence', 'field cohesion', 'phase alignment', 'multi-phase',
      'pigment-density gradients', 'emergent', 'interferen', 'focal point',
      'edge-darkening', 'localized pigment', 'micro focal', 'edge integration',
      'depth-stratified', 'field-level', 'paper-bound', 'paper-surface',
      'heterogeneity', 'absorption heterogeneity', 'field harmony', 'field persistence',
      'environmental', 'ambient illumination', 'depth attenuation',
      'curvature-driven architectural', 'background depth', 'particulate-density falloff',
      // Added general condition keywords
      'lighting', 'illumination', 'fog', 'atmosphere', 'raytracing', 'cinematic', 'volumetric', 'ambient', 'environment', 'bloom'
    ]
  }
];

/**
 * Classify a single token text into topology types.
 * A token may match multiple types; returns array of matched types.
 */
function classifyTokenTopology(text) {
  const lower = text.toLowerCase();
  const matched = [];
  TOPO_RULES.forEach(rule => {
    if (rule.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      matched.push(rule.type);
    }
  });
  // Deduplicate
  return [...new Set(matched)];
}

// ---- Assessment keyword definitions ----
// Each target has: id, required keywords (any match → "detected"), reinforcers (boost stability)
// ① grisaille + wetonwet → mid-frequency に統合
// ③ composition / subject_core / optics_luminance / atmosphere_diffusion を新規追加
const ASSESSMENT_TARGETS = [
  {
    id: 'style',
    label: 'スタイル/メディア層',
    keywords: [
      'daniel-smith', 'pastel watercolor', 'pastel water', 'grisaille',
      'pigment migration', 'granular aggregation', 'pigment granulation', 'coarse pigment',
      'capillary-mediated', 'capillary', 'pigment deposition', 'granulation',
      'sediment', 'micro-turbulent', 'moisture-boundary', 'watercolor', 'simulated',
      // General style keywords
      'art', 'painting', 'drawing', 'sketch', 'oil', 'acrylic', 'illustration', 'concept art',
      'rendering', 'style', 'medium', 'digital', 'masterpiece', 'aesthetics', 'cyberpunk', 'anime',
      'oil painting', 'digital painting', 'photography', 'raw photo', 'cel-shading',
      'studio ghibli', 'impasto', 'ukiyo-e', 'pixel art', 'low poly', 'vector art',
      'pencil sketch', 'charcoal drawing', 'ink wash', 'gouache', 'pastel art'
    ],
    reinforcers: [
      'density-coherent', 'value-structure', 'moisture decay', 'pigment strictly confined',
      'paper absorption', 'particulate aggregation', 'dispersion field restraint',
      'highly detailed', 'sharp focus', 'intricate',
      'artstation', 'trending on artstation', 'award winning', 'professional', 'best quality'
    ],
    negDangers: [
      'tonal smoothing', 'over-mixing', 'pixel-level', 'manifold flattening',
      'homogenization', 'grain over-equalization', 'over-articulated',
      'low quality', 'jpeg artifacts', 'blurry', 'bad art',
      'out of style', 'wrong style', 'inconsistent style'
    ]
  },
  {
    // ① grisaille (中周波トーン構造層) + wetonwet (湿潤拡散層) を統合
    id: 'mid-frequency',
    label: '中間トーン調/中周波構造層',
    keywords: [
      // --- grisaille 由来 ---
      'grisaille', 'value-structure', 'value-stratified', 'midtone', 'mid-key',
      'tonal continuity', 'tonal hierarchy', 'grayscale', 'global midtone',
      'mid-frequency tonal', 'density-coherent tonal', 'luminance distribution',
      'tonal redistribution', 'global value-field', 'tonal field',
      'monochrome', 'black and white',
      'monochrome underpainting', 'grey underpainting', 'dead layer',
      'tonal value study', 'chiaroscuro', 'grayscale rendering', 'value mapping',
      'tonal gradation', 'mid-tone structure',
      // --- wetonwet 由来 ---
      'capillary-mediated', 'moisture-boundary', 'moisture decay', 'moisture',
      'pigment migration', 'edge definition via moisture', 'pigment strictly confined',
      'liquid-paper interaction', 'paper-surface-emergent', 'paper absorption',
      'paper-bound', 'edge-darkening', 'accumulation front', 'micro-turbulent',
      'wet', 'diffusion', 'pigment density grouping', 'capillary', 'fluid', 'ink wash',
      'wet-on-wet', 'wet on wet', 'soft blending', 'feathered edges', 'colour bleeding',
      'pigment diffusion', 'paint bleed', 'soft edge transition', 'colour blending',
      'watercolour bleed', 'glazing technique', 'impasto blending'
    ],
    reinforcers: [
      // --- grisaille 由来 ---
      'global convergence', 'density-coherent particulate', 'form continuity',
      'identity preservation', 'value-field continuity', 'density-explicit gradient',
      'tonal phase alignment', 'mid-key tonal', 'density-structured tonal',
      'contrast', 'cinematic lighting',
      // --- wetonwet 由来 ---
      'differential pigment absorption', 'sediment grouping', 'restrained particulate migration',
      'depth-aware sedimentation', 'edge softness', 'density-gradient attenuation',
      'paper-absorption heterogeneity', 'soft edges', 'blend',
      // --- 共通強化語 ---
      'subtle tonal shift', 'smooth gradient', 'soft shadow', 'mid-tone harmony',
      'tonal balance', 'value contrast', 'painterly blend', 'diffused transition'
    ],
    negDangers: [
      // --- grisaille 由来 ---
      'tonal smoothing', 'overall incline homogenization', 'sectional shape drift',
      'feature over-sharpening', 'line-based shape', 'pixel-level discretization',
      'colorful', 'flat colors',
      // --- wetonwet 由来 ---
      'over-mixing homogenization', 'fluid over-mixing',
      'grain over-equalization', 'brushstroke', 'paint bleed',
      'sharp edges', 'hard lines',
      // --- 共通危険語 ---
      'grain over-equalization bias', 'tonal smoothing tendency', 'over-blended',
      'muddy colors', 'flat tones', 'loss of texture', 'over-saturated',
      'harsh edge', 'abrupt transition', 'posterization'
    ]
  },
  {
    id: 'costume',
    keywords: [
      'ebony-embroidered', 'wuxia attire', 'sino-gothic', 'ornamental embroidery',
      'structural drapery', 'garment flow', 'fold hierarchy', 'garment structure',
      'layered garment', 'fabric micro-fold', 'fabric tonal', 'costume',
      'pressure-coherent layering', 'garment pressure',
      // NEW additions:
      'armor', 'clothes', 'clothing', 'attire', 'suit', 'dress', 'jacket', 'shirt', 'garment', 'outfit', 'wear', 'uniform', 'robe', 'fabric', 'kimono', 'sweater', 'shoes', 'gloves', 'hat', 'boots', 'pants', 'bag', 'backpack', 'belt', 'tie', 'skirt', 'mask', 'veil', 'cloak', 'cape', 'accessories', 'corset', 'hanfu', 'hanbok', 'victorian dress', 'jacket', 'dress pants', 'military uniform', 'tactical gear', 'leather', 'denim', 'silk', 'cotton', 'wool', 'linen', 'velvet', 'lace', 'nylon', 'polyester', 'spandex', 'rayon', 'tweed', 'plaid', 'scarf', 'velvet', 'corduroy', 'fur', 'satin', 'jewellery', 'ring', 'necklace', 'bracelet', 'earring', 'brooch', 'pin', 'buckle', 'tiara', 'crown', 'headband', 'monocle', 'glasses', 'goggles', 'hoodies', 'hoods', 'sweatshirts', 'shorts', 'jeans', 't-shirt', 'turban', 'helmet', 'headphones', 'headset', 'earbuds', 'earphones', 'watch', 'bracelet', 'bangle', 'anklet', 'necklace', 'bonnet', 'circlet', 'satchel', 'sash', 'shawl', 'suspender', 'headchain', 'headdress', 'headpiece', 'knit', 'sailor', 'beret', 'pierce', 'heel', 'stocking', 'cabbie', 'shoulder pads', 'shoulder straps', 'shoulder bag', 'shoulder harness', 'cap', 'bicorne', 'tricorne', 'haori', 'fedora', 'beanie', 'ribbon', 'checkered', 'striped', 'habit', 'overalls', 'jumper', 'overcoat', 'spacesuit', 'gakuseibou', 'swimsuit', 'bikini', 'sundress', 'yukata', 'panties', 'pantyhose', 'lingerie', 'tutu', 'gakuran', 'seifuku', 'hakama', 'obi', 'tailcoat', 'gown', 'ballgown', 'ballerina', 'tunic', 'camisole', 'blouse', 'bodysuit', 'tuxedo', 'bustier', 'bustle', 'frill', 'vest', 'toga', 'capelet', 'slippers', 'leotard', 'dalmatica', 'maestoso', 'kabadion', 'pendant', 'vestment', 'sleeves', 'pannier', 'drapery', 'tailoring',
    ],
    reinforcers: [
      'primary semantic component', 'identity hierarchy', 'particulate-density grouping',
      'fabric micro-fold retention', 'value-density interaction', 'particulate phase alignment',
      'chroma constrained', 'chroma subordinated', 'value-stratified luminance',
      'detailed texture', 'intricate design'
    ],
    negDangers: [
      'over-articulated feature', 'feature over-sharpening', 'line-trace exaggeration',
      'sectional pixel over-exaggeration', 'line-based shape over-dependence',
      'deformed anatomy', 'bad proportions'
    ]
  },
  {
    // ② 文言変更: 背景/建築空間構造層 → 背景/環境空間構造層
    id: 'background',
    label: '背景/環境空間構造層',
    keywords: [
      'sino-gothic temple', 'black bamboo', 'bamboo columns', 'temple corridor',
      'architectural enclosure', 'depth-guided spatial', 'bamboo structural rhythm',
      'repetitive bamboo', 'quiet architectural', 'background depth',
      'curvature-driven architectural', 'scene-level environmental', 'background treated',
      // General background/environment keywords
      'city', 'street', 'building', 'background', 'landscape', 'interior', 'room',
      'architecture', 'scene', 'environment', 'space', 'sky', 'forest', 'nature',
      'scenery', 'outdoors', 'indoors', 'castle', 'palace', 'dungeon', 'ruins',
      'cave', 'mountain', 'sea', 'desert', 'volcano', 'planet', 'galaxy', 'universe',
      'underwater', 'garden', 'flower', 'futuristic city', 'medieval town', 'village',
      'library', 'temple', 'shrine', 'cathedral', 'alleyway', 'rooftop', 'outer space'
    ],
    reinforcers: [
      'particulate-density falloff', 'value-stratified spatial', 'restrained particulate dispersion',
      'field-conditioned alignment', 'depth attenuation', 'density-coherent particulate aggregation',
      'secondary semantic phase', 'global background variance', 'localized structural retention',
      'volumetric fog', 'global illumination', 'depth of field',
      'detailed background', 'immersive environment', 'atmospheric', 'epic scenery',
      'cinematic backdrop', 'richly detailed setting', 'expansive vista'
    ],
    negDangers: [
      'sectional shape drift', 'overall incline homogenization', 'manifold-definition normalization',
      'premature manifold flattening', 'shape definition erosion',
      'flat background', 'white background', 'plain background', 'blank background',
      'no background', 'cluttered background', 'distracting background',
      'anachronistic environment', 'inconsistent architecture'
    ]
  },
  {
    // ③ 新規追加: 構図/レイアウト構造層
    id: 'composition',
    label: '構図/レイアウト構造層',
    keywords: [
      'camera angle', 'golden ratio', 'vertical split', 'diagonal split',
      'isometric 45°', 'circular vignette', 'triangle composition',
      'comic panel layout', 'tiny world encapsulation', 'side view inside glass',
      'rule of thirds', 'symmetrical composition', 'dynamic angle', "bird's eye view",
      "worm's eye view", 'dutch angle', 'centered composition', 'off-center framing',
      'foreground', 'midground', 'background layering', 'depth of field framing',
      'wide angle', 'close-up', 'macro shot', 'establishing shot', 'over the shoulder',
      'low angle', 'high angle', 'eye level', 'tilt shift', 'panoramic'
    ],
    reinforcers: [
      'well composed', 'balanced layout', 'strong focal point', 'cinematic framing',
      'visually dynamic', 'thoughtful composition', 'leading lines',
      'depth of field', 'bokeh background', 'shallow focus'
    ],
    negDangers: [
      'poor composition', 'unbalanced', 'cropped badly', 'off-frame subject',
      'confusing layout', 'no focal point', 'cluttered framing', 'wrong perspective',
      'bad framing', 'cut off', 'missing subject'
    ]
  },
  {
    // ③ 新規追加: 被写体/主体構造層
    id: 'subject_core',
    label: '被写体/主体構造層',
    keywords: [
      // 顔・キャラクター的特徴
      'face', 'portrait', 'close-up', 'detailed face', 'expressive eyes', 'sharp eyes',
      'beautiful face', 'young face', 'mature face', 'androgynous', 'humanoid',
      'character design', 'original character', 'anime character', 'fantasy character',
      'girl', 'boy', 'woman', 'man', 'elf', 'warrior', 'mage', 'knight', 'cyborg',
      // キャラクターの動作系
      'standing', 'sitting', 'running', 'jumping', 'flying', 'fighting', 'dancing',
      'looking at viewer', 'looking away', 'turned back', 'crouching', 'leaning',
      'reaching out', 'casting spell', 'wielding weapon', 'holding', 'embracing',
      'walking', 'posing', 'kneeling', 'lying down', 'action pose', 'dynamic pose'
    ],
    reinforcers: [
      'detailed character', 'expressive pose', 'dynamic action', 'lifelike',
      'well-proportioned', 'anatomically correct', 'full body', 'half body',
      'perfect anatomy', 'beautiful', 'elegant', 'heroic', 'intricate details'
    ],
    negDangers: [
      'bad anatomy', 'deformed', 'extra limbs', 'missing limbs', 'wrong hands',
      'bad hands', 'fused fingers', 'mutated', 'malformed', 'distorted face',
      'uncanny valley', 'stiff pose', 'unnatural posture', 'bad proportions',
      'deformed anatomy', 'extra fingers', 'missing fingers'
    ]
  },
  {
    // ③ 新規追加: 光学・レンズ/輝度拡散層
    id: 'optics_luminance',
    label: '光学・レンズ/輝度拡散層',
    keywords: [
      'golden-hour light rays', 'rim lighting', 'lens flare', 'iridescence',
      'reflection', 'caustics', 'refraction', 'chromatic aberration',
      'spectral dispersion', 'diffraction', 'bokeh', 'depth of field',
      'anamorphic flare', 'crepuscular rays', 'god rays', 'subsurface scattering',
      'specular highlight', 'fresnel effect', 'halo effect', 'light bloom',
      'over-exposure glow', 'bioluminescence', 'phosphorescence',
      'global illumination', 'raytracing', 'volumetric light', 'dramatic lighting',
      'cinematic light', 'rim light', 'backlight', 'key light', 'fill light'
    ],
    reinforcers: [
      'dramatic lighting', 'cinematic light', 'photorealistic lighting',
      'physically based rendering', 'global illumination', 'raytracing',
      'volumetric light', 'realistic shadows', 'light rays', 'soft light',
      'studio lighting', 'natural lighting', 'golden hour'
    ],
    negDangers: [
      'flat lighting', 'no shadows', 'overexposed', 'underexposed', 'blown out',
      'lens distortion artifact', 'unwanted flare', 'color fringing', 'harsh flash',
      'unnatural glow', 'luminance over-amplification bias',
      'bad lighting', 'wrong light direction', 'no lighting'
    ]
  },
  {
    // ③ 新規追加: 雰囲気/大気拡散層
    id: 'atmosphere_diffusion',
    label: '雰囲気/大気拡散層',
    keywords: [
      'mist', 'miasma', 'ember field', 'rain curtain', 'fog', 'pollen drift',
      'ash cloud', 'aurora veil', 'sand drift', 'smoke', 'haze', 'dust particles',
      'steam', 'snowfall', 'rainfall', 'petals falling', 'fireflies',
      'atmospheric perspective', 'aerial haze', 'morning mist', 'evening fog',
      'volumetric fog', 'particle effects', 'magic particles',
      'atmosphere', 'moody atmosphere', 'misty', 'foggy', 'rainy', 'stormy',
      'ethereal', 'dreamy', 'hazy'
    ],
    reinforcers: [
      'atmospheric', 'moody', 'evocative', 'immersive atmosphere',
      'environmental storytelling', 'ethereal ambiance', 'dreamy',
      'cinematic atmosphere', 'depth', 'layered atmosphere', 'soft focus',
      'painterly atmosphere'
    ],
    negDangers: [
      'clear sky only', 'no atmosphere', 'sterile environment', 'over-clean',
      'airless scene', 'atmosphere suppression', 'over-sharpened air',
      'fog removal', 'mist erasure', 'too sharp', 'clinical'
    ]
  }
];

/**
 * Main analysis function.
 * Collects all active tokens, classifies them, scores them, and produces results.
 */
function runSemanticAnalysis() {
  // Gather all active tokens
  const posTokens = [];
  const negTokens = [];

  state.phases.forEach(phase => {
    if (!phase.isActive) return;
    const tokens = getPhaseTokens(phase);
    tokens.forEach(tok => {
      if (!tok.isActive) return;
      if (phase.isNegative) {
        negTokens.push({ text: tok.text, weight: parseFloat(tok.weight) });
      } else {
        posTokens.push({ text: tok.text, weight: parseFloat(tok.weight) });
      }
    });
  });

  const totalTokens = posTokens.length + negTokens.length;

  // ---- Topology classification on positive tokens ----
  const classified = { constraint: [], restraint: [], condition: [] };

  posTokens.forEach(tok => {
    const types = classifyTokenTopology(tok.text);
    types.forEach(type => {
      if (classified[type]) {
        classified[type].push(tok);
      }
    });
  });

  // Weight sums
  const wtConstraint = classified.constraint.reduce((s, t) => s + t.weight, 0);
  const wtRestraint = classified.restraint.reduce((s, t) => s + t.weight, 0);
  const wtCondition = classified.condition.reduce((s, t) => s + t.weight, 0);
  const wtNeg = negTokens.reduce((s, t) => s + (2.0 - t.weight), 0); // inversion: lower weight = stronger suppression

  // ---- Dominance score ----
  // Diffusion Dominance: driven by Constraint+Condition (style enforcement, particle physics)
  // Structure Subordinate: driven by Restraint (moderation, attenuation, hierarchical structuring)
  const diffusionScore = wtConstraint * 0.5 + wtCondition * 0.5;
  const structureScore = wtRestraint * 1.0 + (wtConstraint * 0.5); // constraint also anchors structure
  const totalDomScore = diffusionScore + structureScore || 1;
  const pctDiffusion = Math.round((diffusionScore / totalDomScore) * 100);
  const pctStructure = 100 - pctDiffusion;

  // ---- Per-target assessment ----
  const assessments = {};

  ASSESSMENT_TARGETS.forEach(target => {
    // Search across all positive tokens
    const allPosText = posTokens.map(t => t.text.toLowerCase()).join(' ');
    const allNegText = negTokens.map(t => t.text.toLowerCase()).join(' ');

    const matchedKws = target.keywords.filter(kw => allPosText.includes(kw.toLowerCase()));
    const matchedReinf = target.reinforcers.filter(kw => allPosText.includes(kw.toLowerCase()));
    const matchedDanger = target.negDangers.filter(kw => allNegText.includes(kw.toLowerCase()));

    const detected = matchedKws.length > 0;

    // Compute a stability score:
    // base: (matchedKws / totalKeywords) * 100
    // bonus: reinforcers each add points
    // penalty: neg dangers detected in negative prompt reduce score
    const kwScore = detected ? (matchedKws.length / target.keywords.length) * 60 : 0;
    const reinfScore = matchedReinf.length * 5;      // each reinforcer +5
    const dangerPenalty = matchedDanger.length * 8;  // each danger -8

    const stabilityScore = Math.max(0, Math.min(100, kwScore + reinfScore - dangerPenalty));

    let status = 'inactive';
    if (!detected) {
      status = 'inactive';
    } else if (stabilityScore >= 65) {
      status = 'stable';
    } else if (stabilityScore >= 35) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    assessments[target.id] = {
      detected,
      matchedKws,
      matchedReinf,
      matchedDanger,
      stabilityScore: Math.round(stabilityScore),
      status
    };
  });

  const res = {
    posTokens,
    negTokens,
    totalTokens,
    classified,
    wtConstraint,
    wtRestraint,
    wtCondition,
    wtNeg,
    pctDiffusion,
    pctStructure,
    assessments
  };
  enrichSemanticDensityMetrics(res);
  return res;
}

function enrichSemanticDensityMetrics(result) {
  if (!result || result.totalTokens === 0) return;

  // 1. Resolve ideal values
  const ideal = result.idealValues || {
    pctConstraint: 40,
    pctRestraint: 30,
    pctCondition: 30,
    densityScore: 70
  };
  result.idealValues = ideal;

  // 2. Map tokens to categories
  const categoryMap = mapTokensToCategories(result.posTokens, result.tokenCategories || null);
  result.categoryMap = categoryMap;

  // Count active categories
  const activeCategories = Object.keys(categoryMap).filter(cat => categoryMap[cat].length > 0);
  const activeCategoriesCount = activeCategories.length;
  result.conceptCategories = activeCategoriesCount;

  // 3. Compute metric scores
  const categoryScore = calculateConceptCategoriesScore(activeCategoriesCount);

  const orderScore = calculateLayerOrderScore(state.phases);
  result.layerOrderScore = orderScore;

  const totalWt = result.wtConstraint + result.wtRestraint + result.wtCondition;
  const currConstraint = totalWt > 0 ? (result.wtConstraint / totalWt * 100) : 0;
  const currRestraint = totalWt > 0 ? (result.wtRestraint / totalWt * 100) : 0;
  const currCondition = totalWt > 0 ? (result.wtCondition / totalWt * 100) : 0;

  const balanceScore = calculateLayerBalanceScore(
    currConstraint, currRestraint, currCondition,
    ideal.pctConstraint, ideal.pctRestraint, ideal.pctCondition,
    orderScore
  );
  result.layerBalance = balanceScore;

  const redundancyScore = calculateRedundancyControl(result.posTokens);
  result.redundancyControl = redundancyScore;

  const infoEfficiency = calculateInformationEfficiency(result.posTokens, activeCategoriesCount);
  result.informationEfficiency = infoEfficiency;

  const diversityScore = calculateConceptDiversity(categoryMap, result.posTokens.length);
  result.conceptDiversity = diversityScore;

  // 4. Calculate semantic density score
  const scoreX = (categoryScore * 0.30) +
    (balanceScore * 0.25) +
    (infoEfficiency * 0.20) +
    (diversityScore * 0.15) +
    (redundancyScore * 0.10);

  result.densityScore = Math.max(0, Math.min(100, Math.round(scoreX)));
}

function computeSemanticOptimizationTips(result) {
  const tips = [];
  if (!result || result.totalTokens === 0) return tips;

  const ideal = result.idealValues || { pctConstraint: 40, pctRestraint: 30, pctCondition: 30, densityScore: 70 };
  const totalWt = result.wtConstraint + result.wtRestraint + result.wtCondition;
  const currConstraint = totalWt > 0 ? (result.wtConstraint / totalWt * 100) : 0;
  const currRestraint = totalWt > 0 ? (result.wtRestraint / totalWt * 100) : 0;
  const currCondition = totalWt > 0 ? (result.wtCondition / totalWt * 100) : 0;

  // 1. Concept categories count tips
  const categoryCount = result.conceptCategories || 0;
  if (categoryCount < 6) {
    tips.push(`<strong>コンセプトカテゴリ数が不足しています（現在 ${categoryCount}種類 / 理想 6〜9種類）。</strong>Subject, Style, Medium, Environment, Luminance などの異なる次元のトークンを追加して、プロンプトの多角的な密度を高めてください。`);
  } else if (categoryCount > 9) {
    tips.push(`<strong>コンセプトカテゴリが多すぎます（現在 ${categoryCount}種類 / 理想 6〜9種類）。</strong>プロンプトの焦点がぼやける可能性があります。不要な修飾トークンを削減するか、主要なカテゴリに絞り込んでください。`);
  } else {
    tips.push(`✓ <strong>コンセプトカテゴリ数は適切です（現在 ${categoryCount}種類）。</strong>現在の多様な意味次元のバランスを維持してください。`);
  }

  // 2. Layer Balance tips
  const conDiff = currConstraint - ideal.pctConstraint;
  const resDiff = currRestraint - ideal.pctRestraint;
  const condDiff = currCondition - ideal.pctCondition;

  if (Math.abs(conDiff) > 10) {
    if (conDiff > 0) {
      tips.push(`<strong>Constraint（構造・拘束）比率が理想より高いです（現在 ${Math.round(currConstraint)}% / 理想 ${ideal.pctConstraint}%）。</strong>詳細・解剖学等のトークンの重みを下げるか、環境やスタイル記述を追加してください。`);
    } else {
      tips.push(`<strong>Constraint（構造・拘束）比率が理想より低いです（現在 ${Math.round(currConstraint)}% / 理想 ${ideal.pctConstraint}%）。</strong>「sharp focus」「highly detailed」等の輪郭・構造を確定させるトークンを追加してください。`);
    }
  }

  if (Math.abs(resDiff) > 10) {
    if (resDiff > 0) {
      tips.push(`<strong>Restraint（抑制・減衰）比率が理想より高いです（現在 ${Math.round(currRestraint)}% / 理想 ${ideal.pctRestraint}%）。</strong>「soft」「muted」等の減衰トークンが過剰です。一部を削除するか重みを下げてください。`);
    } else {
      tips.push(`<strong>Restraint（抑制・減衰）比率が理想より低いです（現在 ${Math.round(currRestraint)}% / 理想 ${ideal.pctRestraint}%）。</strong>「subtle」「gentle」等のバランス調整・抑制トークンを追加して、過剰な拡散の飽和を防いでください。`);
    }
  }

  if (Math.abs(condDiff) > 10) {
    if (condDiff > 0) {
      tips.push(`<strong>Condition（相互作用・光・環境）比率が理想より高いです（現在 ${Math.round(currCondition)}% / 理想 ${ideal.pctCondition}%）。</strong>ライティングや環境光の記述が多すぎます。主題（Subject）のディテール記述を補強してください。`);
    } else {
      tips.push(`<strong>Condition（相互作用・光・環境）比率が理想より低いです（現在 ${Math.round(currCondition)}% / 理想 ${ideal.pctCondition}%）。</strong>「cinematic lighting」「volumetric fog」等の雰囲気・環境光の記述を追加してください。`);
    }
  }

  // 3. Layer Order tips
  const orderScore = result.layerOrderScore || 0;
  if (orderScore < 0.8) {
    tips.push(`<strong>フェーズの順序構造（LAYER ORDER）が最適ではありません。</strong>低周波構造（主題、構図）→中周波構造（衣装、媒体）→高周波ディテール（ライティング、環境）の順にフェーズを並べ替えることで、拡散の描画安定性が向上します。`);
  } else {
    tips.push(`✓ <strong>フェーズの順序構造（LAYER ORDER）は最適です。</strong>低周波から高周波への自然な描画流れが維持されています。`);
  }

  // 4. Redundancy tips
  if (result.redundancyControl < 70) {
    tips.push(`<strong>プロンプト内に重複または類似したトークンが多く検出されました（Redundancy Control: ${result.redundancyControl}/100）。</strong>過度な同義語の羅列はノイズになります。重複する意味のトークンを統合してください。`);
  }

  // 5. Information Efficiency tips
  if (result.informationEfficiency < 40) {
    tips.push(`<strong>トークン情報効率が低いです（Information Efficiency: ${Math.round(result.informationEfficiency)}/100）。</strong>総トークン数に対して固有の意味カテゴリが少ないため、無駄な記述が多い可能性があります。表現を簡潔にまとめてください。`);
  }

  return tips;
}

/**
 * Apply analysis results to the DOM.
 */
function renderAnalysisPanel(resultOverride = null) {
  const result = resultOverride || lastSemanticResult || runSemanticAnalysis();

  // Enrich metrics
  enrichSemanticDensityMetrics(result);

  // Show/Hide LLM explanation container
  const llmContainer = document.getElementById("da-llm-explanation");
  if (llmContainer) {
    if (result.causalExplanation) {
      llmContainer.innerHTML = `<strong>LLM Insights:</strong> ${result.causalExplanation}`;
      llmContainer.classList.remove("hidden");
    } else {
      llmContainer.classList.add("hidden");
    }
  }

  // Toggle empty state
  const isEmpty = result.totalTokens === 0;
  document.getElementById('da-empty-state').classList.toggle('hidden', !isEmpty);
  document.getElementById('da-content').style.display = isEmpty ? 'none' : '';

  // Update Semantic Density Meter DOM
  const sdmMeter = document.getElementById('da-semantic-density-meter');
  if (sdmMeter) {
    if (isEmpty) {
      sdmMeter.style.display = 'none';
    } else {
      sdmMeter.style.display = '';

      // Score
      const score = result.densityScore || 0;
      const scoreValueEl = document.getElementById('sdm-score-value');
      if (scoreValueEl) scoreValueEl.textContent = score;

      // Circular gauge
      const circle = document.getElementById('sdm-gauge-circle');
      if (circle) {
        const circumference = 301.6;
        const offset = circumference - (circumference * (score / 100));
        circle.style.strokeDashoffset = offset;
      }

      // Concept Categories count
      const activeCatsCount = result.conceptCategories || 0;
      const countEl = document.getElementById('sdm-categories-count');
      if (countEl) countEl.textContent = `${activeCatsCount} / 12 (Ideal: 6~9)`;

      // Category chips
      const chipsEl = document.getElementById('sdm-categories-chips');
      if (chipsEl && result.categoryMap) {
        chipsEl.innerHTML = CONCEPT_CATEGORIES.map(cat => {
          const count = result.categoryMap[cat] ? result.categoryMap[cat].length : 0;
          const isActive = count > 0;
          if (isActive) {
            const badgeClass = 'px-2 py-0.5 text-[9px] rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 cursor-pointer hover:bg-indigo-900/50 transition';
            return `<button class="${badgeClass}" onclick="window.openCategoryDetailModal('${cat}')">${cat} (${count})</button>`;
          } else {
            const badgeClass = 'px-2 py-0.5 text-[9px] rounded bg-slate-950/40 text-slate-600 border border-slate-900/60 opacity-50 cursor-default';
            return `<span class="${badgeClass}">${cat}</span>`;
          }
        }).join('');
      }

      // Layer Balance
      const totalWt = result.wtConstraint + result.wtRestraint + result.wtCondition;
      const currConstraint = totalWt > 0 ? Math.round((result.wtConstraint / totalWt) * 100) : 0;
      const currRestraint = totalWt > 0 ? Math.round((result.wtRestraint / totalWt) * 100) : 0;
      const currCondition = totalWt > 0 ? Math.round((result.wtCondition / totalWt) * 100) : 0;

      const ideal = result.idealValues || { pctConstraint: 40, pctRestraint: 30, pctCondition: 30, densityScore: 70 };

      // Current texts
      const curConEl = document.getElementById('sdm-curr-constraint');
      if (curConEl) curConEl.textContent = `${currConstraint}%`;
      const curResEl = document.getElementById('sdm-curr-restraint');
      if (curResEl) curResEl.textContent = `${currRestraint}%`;
      const curCondEl = document.getElementById('sdm-curr-condition');
      if (curCondEl) curCondEl.textContent = `${currCondition}%`;

      // Ideal texts
      const idConEl = document.getElementById('sdm-ideal-constraint');
      if (idConEl) idConEl.textContent = `/ ${ideal.pctConstraint}%`;
      const idResEl = document.getElementById('sdm-ideal-restraint');
      if (idResEl) idResEl.textContent = `/ ${ideal.pctRestraint}%`;
      const idCondEl = document.getElementById('sdm-ideal-condition');
      if (idCondEl) idCondEl.textContent = `/ ${ideal.pctCondition}%`;

      // Bar fills
      const barCon = document.getElementById('sdm-bar-constraint');
      if (barCon) barCon.style.width = `${currConstraint}%`;
      const barRes = document.getElementById('sdm-bar-restraint');
      if (barRes) barRes.style.width = `${currRestraint}%`;
      const barCond = document.getElementById('sdm-bar-condition');
      if (barCond) barCond.style.width = `${currCondition}%`;

      // Balance text
      const balanceTextEl = document.getElementById('sdm-balance-text');
      if (balanceTextEl) {
        balanceTextEl.textContent = `Score: ${result.layerBalance || 0} / 100`;
      }

      // Total density gap
      const totalDensityVal = Math.round(totalWt * 10);
      const idealDensityVal = ideal.densityScore || 70;

      const densTextEl = document.getElementById('sdm-density-text');
      if (densTextEl) densTextEl.textContent = `${totalDensityVal} / ${idealDensityVal}`;

      const idealBar = document.getElementById('sdm-density-ideal-bar');
      if (idealBar) idealBar.style.width = `${Math.min(100, idealDensityVal)}%`;

      const currBar = document.getElementById('sdm-density-current-bar');
      if (currBar) currBar.style.width = `${Math.min(100, totalDensityVal)}%`;
    }
  }

  if (isEmpty) return;

  // ---- Update topology counts & bars ----
  const maxWt = Math.max(result.wtConstraint, result.wtRestraint, result.wtCondition, result.wtNeg, 1);

  document.getElementById('da-count-constraint').textContent = result.classified.constraint.length;
  document.getElementById('da-count-restraint').textContent = result.classified.restraint.length;
  document.getElementById('da-count-condition').textContent = result.classified.condition.length;

  document.getElementById('da-wt-constraint').textContent = result.wtConstraint.toFixed(2);
  document.getElementById('da-wt-restraint').textContent = result.wtRestraint.toFixed(2);
  document.getElementById('da-wt-condition').textContent = result.wtCondition.toFixed(2);
  document.getElementById('da-wt-neg').textContent = result.wtNeg.toFixed(2);

  document.getElementById('da-bar-constraint').style.width = `${(result.wtConstraint / maxWt * 100).toFixed(1)}%`;
  document.getElementById('da-bar-restraint').style.width = `${(result.wtRestraint / maxWt * 100).toFixed(1)}%`;
  document.getElementById('da-bar-condition').style.width = `${(result.wtCondition / maxWt * 100).toFixed(1)}%`;
  document.getElementById('da-bar-neg').style.width = `${(result.wtNeg / maxWt * 100).toFixed(1)}%`;

  // ---- Dominance split meter ----
  document.getElementById('da-split-left').style.width = `${result.pctDiffusion}%`;
  document.getElementById('da-split-right').style.width = `${result.pctStructure}%`;
  document.getElementById('da-pct-diffusion').textContent = `${result.pctDiffusion}%`;
  document.getElementById('da-pct-structure').textContent = `${result.pctStructure}%`;

  // Dominance description
  let domDesc = '';
  if (result.pctDiffusion > 70) {
    domDesc = '⚡ Diffusion Dominance 優位。スタイル指令が拡散過程を強く支配しており、確率的テクスチャの生成が期待されますが、構造的な描画対象が拡散場に飲み込まれるリスクがあります。';
  } else if (result.pctDiffusion > 55) {
    domDesc = '🎨 やや Diffusion Dominance 寄り。スタイル層と構造層のバランスは取れていますが、スタイル記述の比重が高め。画風の再現は良好と推定されます。';
  } else if (result.pctStructure > 70) {
    domDesc = '🏗 Structure Subordinate 優位。構造・階層記述が支配的であり、描画対象の形状保全は強固ですが、スタイル（水彩・グリザイユ等）の発現が抑制される可能性があります。';
  } else {
    domDesc = '⚖ Diffusion と Structure のバランスが良好。スタイルと構造の双方が適切に描画に寄与する構成と推定されます。';
  }
  document.getElementById('da-dominance-desc').textContent = domDesc;

  // ---- Overall banner ----
  const allStatuses = Object.values(result.assessments).filter(a => a.detected).map(a => a.status);
  const hasCritical = allStatuses.includes('critical');
  const hasWarning = allStatuses.includes('warning');
  const hasStable = allStatuses.includes('stable');
  const noneDetected = allStatuses.length === 0;

  const banner = document.getElementById('da-overall-banner');
  const bannerIcon = document.getElementById('da-banner-icon');
  const bannerTitle = document.getElementById('da-banner-title');
  const bannerDesc = document.getElementById('da-banner-desc');

  // Remove all banner classes first
  banner.className = 'overall-status-banner';
  if (noneDetected) {
    banner.classList.add('banner-inactive');
    bannerIcon.className = 'fa-solid fa-circle-question overall-banner-icon';
    bannerTitle.textContent = '意味層未検出';
    bannerDesc.textContent = 'プロンプト内に既知の意味ターゲット(スタイル・衣装・背景等)が検出されませんでした。トークンを追加してください。';
  } else if (hasCritical) {
    banner.classList.add('banner-critical');
    bannerIcon.className = 'fa-solid fa-triangle-exclamation overall-banner-icon';
    bannerTitle.textContent = '描画崩壊リスク検出';
    bannerDesc.textContent = '一部の意味層でスタイル強度が不足または競合しており、意図した描画が崩れる可能性があります。該当カードの指摘を確認してください。';
  } else if (hasWarning) {
    banner.classList.add('banner-warning');
    bannerIcon.className = 'fa-solid fa-circle-exclamation overall-banner-icon';
    bannerTitle.textContent = '一部に描画安定性の懸念あり';
    bannerDesc.textContent = '主要な意味層は検出されていますが、強化トークンの不足または抑制リスクが一部で見られます。安定性を高めるには強化トークン(reinforcer)の追加を検討してください。';
  } else {
    banner.classList.add('banner-stable');
    bannerIcon.className = 'fa-solid fa-circle-check overall-banner-icon';
    bannerTitle.textContent = '描画構造は安定と推定';
    bannerDesc.textContent = '全ての検出された意味層において、意図した描画対象が正常に出力されると推定されます。トークン構成は良好です。';
  }

  // ---- Assessment cards ----
  // ① grisaille+wetonwet → mid-frequency 統合、③ 新規4層を追加
  const assessIds = [
    'style',
    'mid-frequency',
    'costume',
    'background',
    'composition',
    'subject_core',
    'optics_luminance',
    'atmosphere_diffusion'
  ];
  assessIds.forEach(id => {
    const a = result.assessments[id];
    if (a) applyAssessmentCard(id, a);
  });

  // ---- Token topology detail list ----
  const listEl = document.getElementById('da-topo-token-list');
  listEl.innerHTML = '';

  const allClassified = [
    ...result.classified.constraint.map(t => ({ tok: t, type: 'constraint' })),
    ...result.classified.restraint.map(t => ({ tok: t, type: 'restraint' })),
    ...result.classified.condition.map(t => ({ tok: t, type: 'condition' }))
  ];

  // Deduplicate by text+type to avoid repeats
  const seen = new Set();
  allClassified.forEach(({ tok, type }) => {
    const key = tok.text + '|' + type;
    if (seen.has(key)) return;
    seen.add(key);

    const pillClass = `topo-pill topo-pill-${type}`;
    const row = document.createElement('div');
    row.className = 'topo-token-row';
    row.innerHTML = `
      <span class="${pillClass}">${type}</span>
      <span class="topo-token-text">${tok.text}</span>
      <span class="topo-token-weight">${tok.weight.toFixed(2)}x</span>
    `;
    listEl.appendChild(row);
  });

  if (allClassified.length === 0) {
    listEl.innerHTML = '<p class="text-xs text-slate-600 text-center py-3">分類可能なトークンが見つかりませんでした。</p>';
  }

  // ---- Update Parameter Recommender ----
  renderParamRecommender();
}

/**
 * Apply results to a single assessment card in the DOM.
 */
function applyAssessmentCard(id, assessment) {
  const card = document.getElementById(`assess-${id}`);
  const iconEl = document.getElementById(`assess-${id}-icon`);
  const verdict = document.getElementById(`assess-${id}-verdict`);
  const badge = document.getElementById(`assess-${id}-badge`);

  if (!card) return;

  // Reset classes
  card.className = 'assessment-card';
  iconEl.className = 'assessment-icon';
  verdict.className = 'assessment-verdict';

  const s = assessment.status;
  card.classList.add(`status-${s}`);
  iconEl.classList.add(`assessment-icon-${s}`);
  verdict.classList.add(`verdict-${s}`);
  badge.className = `assessment-status-badge badge-${s}`;

  const statusLabels = { stable: '安定', warning: '注意', critical: '崩壊リスク', inactive: 'N/A' };
  badge.textContent = statusLabels[s] || 'N/A';

  if (!assessment.detected) {
    verdict.innerHTML = '<em class="text-slate-600">このカテゴリのトークンが検出されませんでした。</em>';
    return;
  }

  const scoreBar = `<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">${assessment.stabilityScore}/100</span>`;

  let verdictHtml = `安定性スコア: ${scoreBar}<br>`;
  verdictHtml += `検出キーワード: <strong>${assessment.matchedKws.slice(0, 4).join(', ')}${assessment.matchedKws.length > 4 ? ` 他${assessment.matchedKws.length - 4}件` : ''}</strong>。`;

  if (assessment.matchedReinf.length > 0) {
    verdictHtml += ` 強化トークン <strong>${assessment.matchedReinf.length}件</strong> が安定性を補強しています。`;
  } else {
    verdictHtml += ` 強化トークンが未検出のため、構造安定性が低下する可能性があります。`;
  }

  if (assessment.matchedDanger.length > 0) {
    verdictHtml += ` <strong>⚠ ネガティブ側で危険な抑制 ${assessment.matchedDanger.length}件</strong>（${assessment.matchedDanger.slice(0, 2).join(', ')}）が検出されました。この記述はスタイル層を意図せず抑制する可能性があります。`;
  }

  if (s === 'stable') {
    verdictHtml += ' → <strong>正常な描画出力が推定されます。</strong>';
  } else if (s === 'warning') {
    verdictHtml += ' → <strong>描画は概ね成立しますが、強化・調整を推奨します。</strong>';
  } else if (s === 'critical') {
    verdictHtml += ' → <strong>意図した描画が成立しない可能性があります。キーワード補強を強く推奨します。</strong>';
  }

  verdict.innerHTML = verdictHtml;
}

// ---- Wire up collapsible token detail ----

/**
 * Update the analysis source badge in the UI.
 * @param {'local'|'gemini'} source
 * @param {string} [modelName] - optional model name when source is 'gemini'
 */
function setAnalysisSourceBadge(source, modelName) {
  const badge = document.getElementById('da-analysis-source-badge');
  if (!badge) return;
  if (source === 'gemini') {
    const label = modelName ? modelName : 'Gemini API';
    badge.textContent = `\u2728 Gemini Analysis (${label})`;
    badge.className = 'da-source-badge da-source-gemini';
  } else {
    badge.textContent = '\uD83D\uDCBB Local Analysis';
    badge.className = 'da-source-badge da-source-local';
  }
}

function initAnalysisPanel() {
  // Restore saved Gemini API key
  const savedKey = localStorage.getItem(LS_GEMINI_API_KEY) || "";
  const keyInput = document.getElementById("input-gemini-api-key");
  if (keyInput) keyInput.value = savedKey;

  // Save Key button
  const btnSaveKey = document.getElementById("btn-save-gemini-key");
  if (btnSaveKey) {
    btnSaveKey.addEventListener("click", () => {
      const key = document.getElementById("input-gemini-api-key").value.trim();
      localStorage.setItem(LS_GEMINI_API_KEY, key);
      showToast("Gemini API Key saved to localStorage!", "success");
      if (typeof window._validateAndShowStatus === "function") {
        window._validateAndShowStatus();
      }
    });
  }

  // Show / Hide API key toggle
  const btnToggleKey = document.getElementById("btn-toggle-gemini-key");
  if (btnToggleKey) {
    btnToggleKey.addEventListener("click", () => {
      const input = document.getElementById("input-gemini-api-key");
      const icon = document.getElementById("icon-eye-gemini");
      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  }

  // Collapsible toggle
  const toggleBtn = document.getElementById('da-topo-toggle');
  const toggleBody = document.getElementById('da-topo-detail-body');
  if (toggleBtn && toggleBody) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = toggleBody.classList.contains('open');
      toggleBody.classList.toggle('open', !isOpen);
      toggleBtn.classList.toggle('open', !isOpen);
    });
  }

  // Manual re-analyze button
  const reBtn = document.getElementById('btn-run-analysis');
  if (reBtn) {
    reBtn.addEventListener('click', async () => {
      const localResult = runSemanticAnalysis();
      if (localResult.totalTokens === 0) {
        renderAnalysisPanel(localResult);
        setAnalysisSourceBadge('local');
        return;
      }

      // getApiKey() 共通関数を使用して最優先で localStorage から APIキーを取得する。
      const apiKey = (typeof window.getApiKey === "function")
        ? window.getApiKey()
        : (localStorage.getItem(LS_GEMINI_API_KEY) || (window.__geminiConfigApiKey || ""));
      if (!apiKey) {
        // No API key at all: fall back to local analysis silently
        lastSemanticResult = localResult;
        renderAnalysisPanel(localResult);
        setAnalysisSourceBadge('local');
        showToast('Gemini API Key が未設定のためローカル解析を実行しました。', 'warning');
        return;
      }

      const icon = document.getElementById("icon-run-analysis");
      const text = document.getElementById("text-run-analysis");

      const originalIconClass = icon.className;
      icon.className = "fa-solid fa-circle-notch fa-spin";
      text.textContent = "Analyzing...";
      reBtn.disabled = true;

      try {
        const daStepsSlider = document.getElementById('da-input-steps');
        const steps = daStepsSlider ? parseInt(daStepsSlider.value, 10) : 20;

        const geminiResult = await fetchGeminiSemanticAnalysis(localResult, steps);
        // Merge geminiResult with basic token info from local
        geminiResult.posTokens = localResult.posTokens;
        geminiResult.negTokens = localResult.negTokens;
        geminiResult.totalTokens = localResult.totalTokens;
        lastSemanticResult = geminiResult;

        renderAnalysisPanel(lastSemanticResult);
        // --- Requirement 7: show which engine was used ---
        setAnalysisSourceBadge('gemini', geminiResult._usedModel);
        showToast(`Gemini (${geminiResult._usedModel || 'API'}) による解析が完了しました。`, 'success');
      } catch (err) {
        console.error(err);
        // Fallback to local analysis on Gemini error
        lastSemanticResult = localResult;
        renderAnalysisPanel(localResult);
        setAnalysisSourceBadge('local');
        showToast(`Gemini API Error: ${err.message} → ローカル解析で代替実行しました。`, 'error');
      } finally {
        icon.className = originalIconClass;
        text.textContent = "Re-Analyze";
        reBtn.disabled = false;
      }
    });
  }

  // ---- NEW: Target Steps slider in Analysis panel ----
  const daStepsSlider = document.getElementById('da-input-steps');
  const daStepsLabel = document.getElementById('da-label-steps');
  if (daStepsSlider && daStepsLabel) {
    daStepsSlider.addEventListener('input', () => {
      daStepsLabel.textContent = daStepsSlider.value;
      renderParamRecommender(daStepsSlider.value);
    });
  }

  // Initial render with local heuristic
  renderAnalysisPanel();
  setAnalysisSourceBadge('local');
}

// ---- Hook into existing updateOutput ----
const _origUpdateOutputForDA = updateOutput;
updateOutput = function () {
  _origUpdateOutputForDA();
  // We no longer auto-render the Semantic Dominance panel here,
  // as it now requires a manual Re-Analyze click.
};

// Boot after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initAnalysisPanel();
});


// ============================================================
//  PARAMETER RECOMMENDATION ENGINE
// ============================================================

/**
 * Sampler metadata: which conditions each sampler is best suited for.
 * steps_range: [min, max], complexity: 'low' | 'medium' | 'high'
 */
const SAMPLER_PROFILES = [
  {
    id: 'euler_a',
    label: 'Euler a',
    stepsMin: 15, stepsMax: 30,
    cfgMin: 5, cfgMax: 9,
    note: '低ステップ・速度優先、ランダム性やや高め'
  },
  {
    id: 'dpm2m',
    label: 'DPM++ 2M',
    stepsMin: 20, stepsMax: 45,
    cfgMin: 6, cfgMax: 12,
    note: '汎用高品質・高ステップ向け'
  },
  {
    id: 'dpm2m_karras',
    label: 'DPM++ 2M Karras',
    stepsMin: 20, stepsMax: 40,
    cfgMin: 5, cfgMax: 10,
    note: 'Karras スケジューラで安定収束'
  },
  {
    id: 'dpm_sde_karras',
    label: 'DPM++ SDE Karras',
    stepsMin: 15, stepsMax: 30,
    cfgMin: 4, cfgMax: 8,
    note: '低CFGで有機的テクスチャを生成、水彩向き'
  },
  {
    id: 'unipc',
    label: 'UniPC',
    stepsMin: 20, stepsMax: 35,
    cfgMin: 6, cfgMax: 11,
    note: '少ステップでもコヒーレント、構造保全に強い'
  },
  {
    id: 'ddim',
    label: 'DDIM',
    stepsMin: 25, stepsMax: 45,
    cfgMin: 7, cfgMax: 13,
    note: '確定的サンプリング、再現性重視'
  }
];

/**
 * computeParamRecommendation(steps, analysisResult)
 *
 * Based on the user's desired sampling steps and the semantic analysis,
 * calculate the recommended CFG scale and suitable samplers.
 *
 * @param {number} steps  – target Sampling Steps (15-45)
 * @param {object} result – return value of runSemanticAnalysis()
 * @returns {{ cfg: number, samplers: string[], tips: string[], direction: string }}
 */
function computeParamRecommendation(steps, result) {
  const s = parseInt(steps, 10);

  // ---- Base CFG from steps ----
  // Lower steps → need slightly higher CFG to converge
  // Higher steps → can afford lower CFG
  let baseCfg = 7.0;
  if (s <= 18) baseCfg = 8.5;
  else if (s <= 22) baseCfg = 7.5;
  else if (s <= 28) baseCfg = 7.0;
  else if (s <= 35) baseCfg = 6.5;
  else baseCfg = 6.0;

  // ---- Prompt complexity adjustments ----
  const totalPosTokens = result.posTokens.length;
  const totalNegTokens = result.negTokens.length;

  // Many positive tokens (dense prompt) → raise CFG to enforce fidelity
  if (totalPosTokens > 60) baseCfg += 0.7;
  else if (totalPosTokens > 40) baseCfg += 0.4;
  else if (totalPosTokens < 15) baseCfg -= 0.3;

  // Many restraint tokens → very structured prompt, lower CFG is safer
  if (result.wtRestraint > 30) baseCfg -= 0.8;
  else if (result.wtRestraint > 18) baseCfg -= 0.4;

  // High constraint weight → strong structural enforcement → mild CFG boost
  if (result.wtConstraint > 30) baseCfg += 0.4;

  // High negative weight → tight suppression → ease CFG to avoid over-saturation
  if (result.wtNeg > 15) baseCfg -= 0.5;

  // Diffusion dominant (style-heavy) → slight CFG raise to maintain coherence
  if (result.pctDiffusion > 65) baseCfg += 0.5;
  else if (result.pctStructure > 70) baseCfg -= 0.3;

  // Clamp
  baseCfg = Math.max(3.0, Math.min(15.0, baseCfg));
  const rawCfg = Math.round(baseCfg * 10) / 10; // 1 decimal precision

  // ---- Sampler selection ----
  // Primary: samplers whose steps range covers our target steps AND cfg range covers rawCfg
  const primary = SAMPLER_PROFILES.filter(sp =>
    s >= sp.stepsMin && s <= sp.stepsMax &&
    rawCfg >= sp.cfgMin && rawCfg <= sp.cfgMax
  ).map(sp => sp.label);

  // Fallback: samplers whose steps range covers s (CFG constraint relaxed)
  const fallback = SAMPLER_PROFILES.filter(sp =>
    s >= sp.stepsMin && s <= sp.stepsMax &&
    !primary.includes(sp.label)
  ).map(sp => sp.label);

  const samplers = [...primary, ...fallback].slice(0, 4);
  if (samplers.length === 0) samplers.push('DPM++ 2M Karras', 'UniPC'); // safe default

  // ---- Tips for integer CFG ----
  const nearestInt = Math.round(rawCfg);
  const diff = nearestInt - rawCfg; // positive = need to go UP, negative = need to go DOWN
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'integer';

  const tips = [];

  if (direction === 'integer') {
    // Already integer — celebration tips
    tips.push(`<strong>現在の構成は既に整数CFG (${nearestInt}) に最適化されています。</strong>この状態を基準に微調整してみてください。`);
    tips.push(`<strong>Samplerの種類を変えて</strong>同じCFGで表現の差を確認することが、スタイル安定性の比較研究として有効です。`);
    tips.push(`<strong>Seedをランダムに複数回試し</strong>現在のトークン構成がCFG ${nearestInt} でどれほど安定した出力を生むかを確認してください。`);
    tips.push(`<strong>ネガティブプロンプトの重みを±0.01ずつ微調整</strong>し、表現的アーティファクト（マニフォールド崩壊など）が減少するかを観察してください。`);
    tips.push(`<strong>強化トークン（reinforcer）を1〜2件追加</strong>することで、さらなる描画安定性の向上が期待できます。`);
  } else if (direction === 'up') {
    // Need to raise effective CFG (i.e., make prompt simpler/reduce negative suppression)
    const delta = Math.abs(diff).toFixed(1);
    tips.push(`<strong>CFGを約 ${delta} 上げる</strong>ために、ポジティブプロンプトの密度を下げてください。過剰なConstraintトークンを2〜3件削除または重みを1.00に下げることが効果的です。`);
    tips.push(`<strong>ネガティブプロンプトの抑制強度を緩和</strong>するために、ネガティブ側トークンの重みを0.95→0.90に下げてみてください。これにより拡散の自由度が上がり、CFGの実効値が上昇します。`);
    tips.push(`<strong>Conditionトークン（moisture・capillary・pigment deposition系）を増量</strong>してください。拡散の収束特性が強まりCFGが実質的に上昇します。`);
    if (result.wtRestraint > 20) {
      tips.push(`<strong>Restraintトークン（attenuation・subordinated・muted系）が過剰</strong>です（累積強度${result.wtRestraint.toFixed(1)}）。3件程度削除またはweight 0.98→1.00に変更するとCFGバランスが改善されます。`);
    } else {
      tips.push(`<strong>グリザイユ・水彩スタイルの「条件トークン」を1〜2件強化</strong>（weight 1.04→1.06程度）することで、スタイルの拡散支配力を向上させCFGを上げやすくなります。`);
    }
    tips.push(`<strong>Sampling Stepsを2〜3ステップ下げる</strong>（現在${s}→${Math.max(15, s - 2)}程度）ことで、同CFG値でより鮮明な輪郭と強い発色が得られ、実質的にCFG感度を上げた効果を得られます。`);
    if (totalNegTokens > 12) {
      tips.push(`<strong>ネガティブプロンプトのトークン数が多い</strong>（${totalNegTokens}件）。意味的に重複する抑制語（例: 複数の「over-mixing」系）を統合・削除して5〜8件程度に絞るとCFGの整数化に近づきます。`);
    }
    tips.push(`<strong>衣装・背景フェーズのConstraintトークン重みを0.02ずつ上げて</strong>みてください。各構造フェーズの強化によりプロンプト全体のConstraint密度が増し、CFGが自然に上がります。`);
  } else {
    // Need to lower effective CFG (make prompt stronger, denser, add more restrictions)
    const delta = Math.abs(diff).toFixed(1);
    tips.push(`<strong>CFGを約 ${delta} 下げる</strong>ために、ポジティブプロンプトのConstraintトークンを追加してください。特にスタイル固定用の「density-stratified」「particulate-density」系を1〜2件追加することで、拡散が自律的に収束しCFG実効値が下がります。`);
    tips.push(`<strong>ネガティブプロンプトの抑制強度を高める</strong>ために、重みを0.94→0.92に下げてください。抑制力の増大により拡散の自由度が下がり、低CFGで安定出力が得られます。`);
    tips.push(`<strong>Restraintトークン（subordinated・constrained・modulated系）を2〜3件追加</strong>してください。構造の縛りが強まり、低いCFGでも形状崩壊が起きにくくなります。`);
    if (result.pctDiffusion > 55) {
      tips.push(`<strong>現在Diffusion Dominance ${result.pctDiffusion}%</strong>と高めです。ポジティブフェーズにStructure系トークン（form continuity・depth-stratified等）を追加するとDiffusion支配を抑えCFGを下げやすくなります。`);
    } else {
      tips.push(`<strong>各フェーズの先頭トークン（最も拡散に影響する）の重みを0.02下げ</strong>てみてください。プロンプト全体の拡散強度が緩み、推奨CFGが整数値に近づきます。`);
    }
    tips.push(`<strong>Sampling Stepsを2〜3増やす</strong>（現在${s}→${Math.min(45, s + 2)}程度）ことで、拡散プロセスがより細かく分解され同じプロンプト強度でも低CFGで安定した出力が得られます。`);
    if (totalPosTokens > 50) {
      tips.push(`<strong>ポジティブトークン数が多い</strong>（${totalPosTokens}件）。意味的に近接するトークンを統合・削除して35〜45件程度に絞ることで、CFGの整数値への調整が容易になります。`);
    }
    tips.push(`<strong>グリザイユ・トーン系フェーズのRestraintトークンを強化</strong>（weight 1.04→1.06）して、トーン構造の縛りを強くしてください。中間調が安定することで低CFGでも出力が崩壊しにくくなります。`);
  }

  return {
    cfg: rawCfg,
    nearestInt,
    direction,
    samplers,
    primarySamplers: primary,
    tips
  };
}

/**
 * Read current steps value from the Analysis panel slider,
 * run the recommendation engine, and update the DOM.
 * @param {number|string} [stepsOverride] – if passed, use this instead of reading the slider
 */
function renderParamRecommender(stepsOverride) {
  // Read steps from the analysis-panel slider (or override)
  const stepsEl = document.getElementById('da-input-steps');
  const steps = stepsOverride !== undefined ? parseInt(stepsOverride, 10)
    : (stepsEl ? parseInt(stepsEl.value, 10) : 20);

  // Run current semantic analysis to feed into the engine (always use local result for recommendation)
  const result = runSemanticAnalysis();

  // If no tokens exist, show a minimal placeholder and bail
  const cfgEl = document.getElementById('da-rec-cfg');
  const cfgNoteEl = document.getElementById('da-rec-cfg-note');
  const samplersEl = document.getElementById('da-rec-samplers');
  const tipsEl = document.getElementById('da-rec-tips');
  const dirEl = document.getElementById('da-tips-direction');

  if (!cfgEl) return;

  if (result.totalTokens === 0) {
    cfgEl.textContent = '—';
    cfgEl.className = 'param-rec-cfg-value';
    cfgNoteEl.textContent = 'トークンを追加すると解析が開始されます';
    samplersEl.innerHTML = '<span class="param-rec-tips-empty">—</span>';
    tipsEl.innerHTML = '<p class="param-rec-tips-empty">プロンプトを作成後に Tips が表示されます。</p>';
    if (dirEl) dirEl.textContent = '';

    const semanticTipsEl = document.getElementById('da-semantic-tips');
    if (semanticTipsEl) {
      semanticTipsEl.innerHTML = '<p class="param-rec-tips-empty">プロンプトを作成後に Tips が表示されます。</p>';
    }
    return;
  }

  const rec = computeParamRecommendation(steps, result);

  // ---- CFG Value display ----
  cfgEl.textContent = rec.cfg.toFixed(1);
  if (rec.direction === 'integer') {
    cfgEl.className = 'param-rec-cfg-value is-integer';
    cfgNoteEl.textContent = `✓ 既に整数値 (${rec.nearestInt}) に到達しています！`;
  } else {
    cfgEl.className = 'param-rec-cfg-value';
    const diff = Math.abs(rec.nearestInt - rec.cfg).toFixed(1);
    const intDir = rec.direction === 'up' ? '上' : '下';
    cfgNoteEl.textContent = `整数値 ${rec.nearestInt} まで約 ${diff} ${intDir}げる調整が推奨されます`;
  }

  // ---- Sampler badges ----
  samplersEl.innerHTML = rec.samplers.map((name, i) => {
    const isPrimary = rec.primarySamplers.includes(name);
    return `<span class="sampler-badge ${isPrimary ? 'is-primary' : ''}">${isPrimary ? '★ ' : ''}${name}</span>`;
  }).join('');

  // ---- Direction label ----
  if (dirEl) {
    if (rec.direction === 'integer') {
      dirEl.textContent = '✓ 整数CFG達成済み';
      dirEl.style.color = '#34d399';
    } else if (rec.direction === 'up') {
      dirEl.textContent = `↑ CFGをさらに上げるための調整`;
      dirEl.style.color = '#6ee7b7';
    } else {
      dirEl.textContent = `↓ CFGを下げるための調整`;
      dirEl.style.color = '#fda4af';
    }
  }

  // ---- Tips ----
  tipsEl.innerHTML = rec.tips.map((tip, i) => {
    const cls = rec.direction === 'up' ? 'tip-up' : rec.direction === 'down' ? 'tip-down' : '';
    return `<li class="${cls}" style="animation-delay:${i * 0.05}s">${tip}</li>`;
  }).join('');

  // ---- Semantic Optimization Tips ----
  const semanticTipsEl = document.getElementById('da-semantic-tips');
  if (semanticTipsEl) {
    // Ensure metrics are populated
    enrichSemanticDensityMetrics(result);
    const semanticTips = computeSemanticOptimizationTips(result);
    semanticTipsEl.innerHTML = semanticTips.map((tip, i) => {
      return `<li class="tip-semantic" style="animation-delay:${i * 0.05}s">${tip}</li>`;
    }).join('');
  }
}

// ============================================================
//  COMMIT DETAIL OVERLAY CONTROLLERS & ACTIONS
// ============================================================

window.openCommitDetailOverlay = function (conceptId, commitId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;
  const commit = (concept.commits || []).find(c => c.id === commitId);
  if (!commit) return;

  window._commitDetailOverlayState = {
    conceptId: conceptId,
    commitId: commitId,
    activePhaseId: null,
    activePatternIndex: 0
  };

  const nameEl = document.getElementById('commit-detail-concept-name');
  if (nameEl) nameEl.textContent = concept.name;

  const msgEl = document.getElementById('commit-detail-message');
  if (msgEl) msgEl.textContent = commit.message;

  const phasesContainer = document.getElementById('commit-detail-phases-container');
  if (phasesContainer) {
    phasesContainer.innerHTML = '';
    (commit.phases || []).forEach(phase => {
      const isNeg = !!phase.isNegative;
      const bar = document.createElement('button');
      bar.className = `detail-phase-bar ${isNeg ? 'neg' : 'pos'}`;
      bar.textContent = phase.name;
      bar.onclick = () => window.selectCommitDetailPhase(phase.id);
      bar.id = `detail-phase-bar-${phase.id}`;
      phasesContainer.appendChild(bar);
    });
  }

  const archiveBtn = document.getElementById('commit-detail-archive-btn');
  if (archiveBtn) {
    archiveBtn.onclick = () => {
      window.archiveCommitFromOverlay(conceptId, commitId);
    };
  }

  const expandedSection = document.getElementById('commit-detail-expanded-section');
  if (expandedSection) expandedSection.classList.add('hidden');

  const modal = document.getElementById('commit-detail-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = "hidden";
  }
};

window.closeCommitDetailOverlay = function () {
  const modal = document.getElementById('commit-detail-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = "";
  }
};

window.handleCommitDetailOverlayClick = function (e) {
  if (e.target.id === 'commit-detail-modal') {
    window.closeCommitDetailOverlay();
  }
};

window.selectCommitDetailPhase = function (phaseId) {
  const stateObj = window._commitDetailOverlayState;
  if (!stateObj) return;

  stateObj.activePhaseId = phaseId;
  stateObj.activePatternIndex = 0;

  document.querySelectorAll('.detail-phase-bar').forEach(bar => {
    bar.classList.remove('active');
  });
  const activeBar = document.getElementById(`detail-phase-bar-${phaseId}`);
  if (activeBar) {
    activeBar.classList.add('active');
  }

  const expandedSection = document.getElementById('commit-detail-expanded-section');
  if (expandedSection) expandedSection.classList.remove('hidden');

  window.renderCommitDetailExpandedContents();
};

window.renderCommitDetailExpandedContents = function () {
  const stateObj = window._commitDetailOverlayState;
  if (!stateObj) return;

  const concept = state.concepts.find(c => c.id === stateObj.conceptId);
  if (!concept) return;
  const commit = (concept.commits || []).find(c => c.id === stateObj.commitId);
  if (!commit) return;
  const phase = (commit.phases || []).find(p => p.id === stateObj.activePhaseId);
  if (!phase) return;

  const phaseNameEl = document.getElementById('commit-detail-active-phase-name');
  if (phaseNameEl) phaseNameEl.textContent = phase.name;

  const patternSelector = document.getElementById('commit-detail-pattern-selector');
  if (patternSelector) {
    if (phase.isNegative) {
      patternSelector.classList.add('hidden');
    } else {
      patternSelector.classList.remove('hidden');
      const patterns = phase.patterns || [];
      const total = patterns.length;
      const current = stateObj.activePatternIndex + 1;

      const labelEl = document.getElementById('commit-detail-pattern-label');
      if (labelEl) labelEl.textContent = `Pattern ${current} / ${total}`;

      const prevBtn = document.getElementById('commit-detail-prev-pattern-btn');
      const nextBtn = document.getElementById('commit-detail-next-pattern-btn');

      if (prevBtn) {
        prevBtn.disabled = current <= 1;
        prevBtn.onclick = () => {
          if (stateObj.activePatternIndex > 0) {
            stateObj.activePatternIndex--;
            window.renderCommitDetailExpandedContents();
          }
        };
      }
      if (nextBtn) {
        nextBtn.disabled = current >= total;
        nextBtn.onclick = () => {
          if (stateObj.activePatternIndex < total - 1) {
            stateObj.activePatternIndex++;
            window.renderCommitDetailExpandedContents();
          }
        };
      }
    }
  }

  const tokensContainer = document.getElementById('commit-detail-tokens-container');
  if (tokensContainer) {
    tokensContainer.innerHTML = '';
    let tokens = [];
    if (phase.isNegative) {
      tokens = phase.tokens || [];
    } else {
      const patterns = phase.patterns || [];
      const pat = patterns[stateObj.activePatternIndex];
      tokens = pat ? (pat.tokens || []) : [];
    }

    if (tokens.length === 0) {
      tokensContainer.innerHTML = '<p class="text-slate-500 text-xs text-center py-4">No tokens in this phase.</p>';
      return;
    }

    tokens.forEach(tok => {
      const isCore = !!tok.isCore;
      const row = document.createElement('div');
      row.className = 'overlay-token-row flex items-center justify-between p-2.5 rounded-lg text-xs border border-slate-700/60 bg-slate-800/10 mb-1';

      const starHtml = !phase.isNegative ? `
        <span class="text-xs mr-1">
          <i class="fa-solid fa-star ${isCore ? 'text-amber-400' : 'text-slate-600'}"></i>
        </span>
      ` : '';

      row.innerHTML = `
        <div class="flex items-center gap-2">
          ${starHtml}
          <span class="font-medium ${tok.isActive ? 'text-slate-200' : 'text-slate-500 line-through'} break-all">
            ${tok.text}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-slate-500 text-[10px]">Weight:</span>
          <input type="text" class="token-weight-input w-12 text-center rounded bg-slate-950/60 border border-slate-700/60 text-slate-200 py-0.5" value="${parseFloat(tok.weight).toFixed(2)}" readonly>
        </div>
      `;
      tokensContainer.appendChild(row);
    });
  }
};

window.archiveCommitFromOverlay = function (conceptId, commitId) {
  const concept = state.concepts.find(c => c.id === conceptId);
  if (!concept) return;
  const commit = (concept.commits || []).find(c => c.id === commitId);
  if (!commit) return;

  if (!Array.isArray(concept.archivedCommits)) concept.archivedCommits = [];

  const alreadyArchived = concept.archivedCommits.some(a => a.sourceCommitId === commitId);
  if (alreadyArchived) {
    showToast(`「${commit.message}」は既にARCHIVEに存在します。`, 'warning');
    return;
  }

  if (concept.archivedCommits.length >= 5) {
    concept.archivedCommits.shift();
  }

  concept.archivedCommits.push({
    id: 'arch_' + Date.now(),
    conceptId: conceptId,
    conceptName: concept.name,
    sourceCommitId: commitId,
    sourceMessage: commit.message,
    timestamp: commit.timestamp,
    phases: JSON.parse(JSON.stringify(commit.phases))
  });

  saveConceptsToStorage();
  window.renderConceptArchive();
  showToast(`「${commit.message}」をARCHIVEに保存しました`, 'success');
};

// ============================================================
//  PROMPT INTELLIGENCE ANALYZER — Hook Integration
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // 2. Click listener hook for the "Run Intelligence Analysis" button
  const btn = document.getElementById("btn-run-intelligence-analysis");
  if (btn && typeof window.analyzeWorkspacePrompt === "function") {
    // If the browser already registered this exact reference in geminiPromptAnalyzer.js,
    // this call will be ignored safely.
    btn.addEventListener("click", window.analyzeWorkspacePrompt);
    console.log("[GeminiAnalyzer] btn-run-intelligence-analysis listener confirmed in app.js.");
  }
});


// ============================================================
//  PIA CONCEPT CATEGORIES DETAIL MODAL
// ============================================================
window.openCategoryDetailModal = function (category) {
  const categoryMap = (lastSemanticResult && lastSemanticResult.categoryMap) || 
                      (window._piaLastResult && window._piaLastResult.categoryMap) || 
                      (runSemanticAnalysis() && runSemanticAnalysis().categoryMap) || 
                      {};
  const tokens = categoryMap[category] || [];
  
  const titleEl = document.getElementById("category-detail-title");
  if (titleEl) {
    titleEl.textContent = `${category} - Token List (${tokens.length})`;
  }
  
  const bodyEl = document.getElementById("category-detail-body");
  if (bodyEl) {
    if (tokens.length === 0) {
      bodyEl.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">このカテゴリに分類されているトークンはありません。</p>`;
    } else {
      const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
      };
      
      const tokenHtml = tokens.map(tok => {
        const isCoreBadge = tok.isCore ? `<span class="token-core-badge ml-1.5"><i class="fa-solid fa-star text-[8px] text-yellow-400"></i> CORE</span>` : '';
        return `
          <div class="flex items-center justify-between bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 shadow-inner mb-2 last:mb-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm font-semibold text-slate-100 truncate">${escapeHtml(tok.text)}</span>
              ${isCoreBadge}
            </div>
            <span class="shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
              ${tok.weight.toFixed(2)}x
            </span>
          </div>
        `;
      }).join('');
      bodyEl.innerHTML = `<div class="max-h-60 overflow-y-auto pr-1">${tokenHtml}</div>`;
    }
  }
  
  const modal = document.getElementById("category-detail-modal");
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
};

window.closeCategoryDetailModal = function () {
  const modal = document.getElementById("category-detail-modal");
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
};

window.handleCategoryDetailModalOverlayClick = function (e) {
  if (e.target.id === "category-detail-modal") {
    window.closeCategoryDetailModal();
  }
};


