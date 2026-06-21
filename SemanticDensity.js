// SemanticDensity.js
// ─────────────────────────────────────────────────────────────
// Semantic Density Meter - Logic Module
// ─────────────────────────────────────────────────────────────

export const CONCEPT_CATEGORIES = [
  "Subject", "Character", "Action", "Material", "Style", "Medium",
  "Environment", "Luminance", "Atmosphere", "Color", "Composition", "Emotion"
];

const CATEGORY_KEYWORDS = {
  Character: ['girl', 'boy', 'man', 'woman', 'warrior', 'cyborg', 'knight', 'assassin', 'sorcerer', 'goddess', 'model', 'waifu', 'face', 'eyes', 'hair', 'skin', 'body', 'pose', 'hands'],
  Action: ['running', 'fighting', 'standing', 'sitting', 'flying', 'holding', 'jumping', 'gazing', 'smiling', 'crying', 'looking', 'attacking', 'casting', 'wearing'],
  Material: ['armor', 'leather', 'fabric', 'metal', 'gold', 'silver', 'wood', 'stone', 'glass', 'silk', 'velvet', 'cotton', 'bronze', 'chrome', 'iron', 'steel', 'cloth', 'garment'],
  Style: ['cyberpunk', 'steampunk', 'anime', 'rembrandt-type chiaroscuro density-field', '18th-rococo era mood', 'sino-gothic', 'gothic', 'watercolor', 'oil painting', 'pencil sketch', 'photorealistic', 'fantasy', 'surrealism', 'impressionism', 'baroque', 'renaissance', 'minimalism', 'synthwave'],
  Medium: ['digital painting', 'concept art', 'rendering', 'photo', 'illustration', 'sketch', 'drawing', 'ink', 'watercolor painting', 'oil on canvas', 'photograph', '3d render', 'c4d', 'octane render', 'unreal engine', 'masterpiece'],
  Environment: ['temple corridor', 'bamboo columns', 'city', 'street', 'background', 'interior', 'room', 'forest', 'sky', 'mountain', 'nature', 'ocean', 'castle', 'ruins', 'dungeon', 'cyberpunk city', 'space', 'landscape', 'architecture'],
  Luminance: ['neon', 'lighting', 'illumination', 'bloom', 'raytracing', 'volumetric fog', 'global illumination', 'chiaroscuro', 'shadow', 'glowing', 'soft light', 'dramatic light', 'sunlight', 'moonlight', 'crepuscular rays', 'backlit', 'studio lighting'],
  Atmosphere: ['fog', 'mist', 'haze', 'dust', 'smoke', 'clouds', 'wind', 'rain', 'snow', 'storm', 'particles', 'magical particles', 'ethereal', 'mystical', 'mysterious', 'moody', 'ambience'],
  Color: ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'cyan', 'magenta', 'gold', 'silver', 'black', 'white', 'gray', 'pastel', 'vibrant', 'saturated', 'desaturated', 'monochrome', 'grayscale', 'chromatic'],
  Composition: ['sharp focus', 'depth of field', 'blurry background', 'bokeh', 'centered', 'symmetrical', 'asymmetrical', 'wide angle', 'close up', 'extreme close up', 'portrait', 'landscape orientation', 'golden ratio', 'rule of thirds', 'cinematic composition', 'view from below', 'isometric'],
  Emotion: ['striking', 'elegant', 'beautiful', 'scary', 'spooky', 'happy', 'sad', 'angry', 'peaceful', 'serene', 'dynamic', 'intense', 'calm', 'dramatic', 'melancholic', 'triumphant', 'majestic'],
  Subject: []
};

/**
 * Classify a token text into one of the 12 categories using local heuristics.
 */
export function classifyTokenLocal(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "Subject") continue;
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return "Subject";
}

/**
 * Maps positive tokens to the 12 categories.
 */
export function mapTokensToCategories(tokens, geminiClassifierResults = null) {
  const map = {};
  CONCEPT_CATEGORIES.forEach(cat => map[cat] = []);
  
  tokens.forEach(tok => {
    let cat = "Subject";
    if (geminiClassifierResults && geminiClassifierResults[tok.text]) {
      cat = geminiClassifierResults[tok.text];
    } else {
      cat = classifyTokenLocal(tok.text);
    }
    if (map[cat]) {
      map[cat].push(tok);
    } else {
      map["Subject"].push(tok);
    }
  });
  return map;
}

/**
 * Calculates phase order alignment score based on the sequence (LAYER ORDER).
 * "低周波的構造位相のphases→中周波的構造位相のphases→高周波的構造位相のphases"
 */
export function calculateLayerOrderScore(phases) {
  const activePhases = phases.filter(p => p.isActive && !p.isNegative);
  if (activePhases.length <= 1) return 1.0;
  
  const getPhaseFrequency = (phaseName) => {
    const name = phaseName.toLowerCase();
    if (name.includes('subject') || name.includes('character') || name.includes('pose') || name.includes('composition') || name.includes('core')) {
      return 1; // Low frequency (early)
    }
    if (name.includes('material') || name.includes('costume') || name.includes('clothing') || name.includes('style') || name.includes('medium') || name.includes('garment')) {
      return 2; // Medium frequency
    }
    if (name.includes('lighting') || name.includes('environment') || name.includes('atmosphere') || name.includes('detail') || name.includes('background') || name.includes('color') || name.includes('luminance')) {
      return 3; // High frequency (late)
    }
    return 2; // Default to medium
  };
  
  let pairs = 0;
  let correct = 0;
  for (let i = 0; i < activePhases.length; i++) {
    const freqI = getPhaseFrequency(activePhases[i].name);
    for (let j = i + 1; j < activePhases.length; j++) {
      const freqJ = getPhaseFrequency(activePhases[j].name);
      pairs++;
      if (freqI <= freqJ) {
        correct++;
      }
    }
  }
  return pairs > 0 ? (correct / pairs) : 1.0;
}

/**
 * Evaluates token redundancy and calculates the penalty score.
 */
export function calculateRedundancyControl(tokens) {
  if (tokens.length === 0) return 100;
  const words = tokens.map(t => t.text.toLowerCase().trim());
  const uniqueWords = new Set(words);
  const duplicateCount = words.length - uniqueWords.size;
  
  let synonymOverlaps = 0;
  for (let i = 0; i < words.length; i++) {
    const w1 = words[i].split(/\s+/);
    for (let j = i + 1; j < words.length; j++) {
      const w2 = words[j].split(/\s+/);
      const intersection = w1.filter(w => w2.includes(w) && w.length > 3);
      if (intersection.length > 0) {
        synonymOverlaps++;
      }
    }
  }
  const penalty = (duplicateCount * 15) + (synonymOverlaps * 5);
  return Math.max(0, Math.min(100, 100 - penalty));
}

/**
 * Evaluates token information efficiency (active category count / total tokens).
 */
export function calculateInformationEfficiency(tokens, activeCategoryCount) {
  if (tokens.length === 0) return 0;
  const ratio = activeCategoryCount / tokens.length;
  return Math.max(0, Math.min(100, ratio * 150));
}

/**
 * Concept categories: score maximizes at 6-9 categories.
 */
export function calculateConceptCategoriesScore(categoryCount) {
  if (categoryCount >= 6 && categoryCount <= 9) {
    return 100;
  }
  if (categoryCount < 6) {
    return (categoryCount / 6) * 100;
  }
  return Math.max(0, 100 - (categoryCount - 9) * 15);
}

/**
 * Semantic Layer Balance calculation, combining weight ratio distance and layer order.
 */
export function calculateLayerBalanceScore(currConstraint, currRestraint, currCondition, idealConstraint, idealRestraint, idealCondition, orderScore) {
  const sum = currConstraint + currRestraint + currCondition;
  if (sum === 0) return 0;
  
  const pConstraint = currConstraint / sum;
  const pRestraint  = currRestraint / sum;
  const pCondition  = currCondition / sum;
  
  const idealSum = idealConstraint + idealRestraint + idealCondition || 1;
  const ipConstraint = idealConstraint / idealSum;
  const ipRestraint  = idealRestraint / idealSum;
  const ipCondition  = idealCondition / idealSum;
  
  const diff = Math.abs(pConstraint - ipConstraint) +
               Math.abs(pRestraint - ipRestraint) +
               Math.abs(pCondition - ipCondition);
  
  const balanceScore = Math.max(0, 100 - (diff * 100));
  return Math.round((balanceScore * 0.7) + (orderScore * 30));
}

/**
 * Evaluates shannon entropy of token distribution across categories.
 */
export function calculateConceptDiversity(categoryMap, totalTokens) {
  if (totalTokens === 0) return 0;
  let entropy = 0;
  Object.values(categoryMap).forEach(tokens => {
    if (tokens.length > 0) {
      const p = tokens.length / totalTokens;
      entropy -= p * Math.log2(p);
    }
  });
  const maxEntropy = 3.585; // log2(12)
  return Math.max(0, Math.min(100, (entropy / maxEntropy) * 100));
}
