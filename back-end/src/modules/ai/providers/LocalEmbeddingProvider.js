import { EmbeddingProvider } from "./EmbeddingProvider.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";

/**
 * Vietnamese Fashion Semantic Synonym Groups.
 * Used by LocalEmbeddingProvider to project semantically equivalent Vietnamese & English
 * fashion concepts into shared latent concept dimensions when operating offline or as fallback.
 */
const VIETNAMESE_SEMANTIC_CONCEPTS = [
  ["ao thun", "ao phong", "t-shirt", "tshirt", "tee", "ao ngan tay", "basic tee"],
  ["ao so mi", "somi", "shirt", "ao cong so", "lich su", "di lam", "dress shirt", "oxford"],
  ["ao khoac", "jacket", "hoodie", "cardigan", "blazer", "ao am", "mua dong", "chong nang", "di mua", "outerwear", "sweater"],
  ["ao polo", "polo", "ao co be", "co co", "the thao lich su"],
  ["quan jean", "quan bo", "jeans", "denim", "quan dai nam", "quan dai"],
  ["quan tay", "quan au", "trousers", "slacks", "quan cong so", "quan vai", "lich lam"],
  ["quan short", "quan dui", "shorts", "quan ngan", "mac nha", "di bien", "mua he"],
  ["quan jogger", "quan the thao", "tracksuit", "tap gym", "chay bo", "nang dong", "sweatpants"],
  ["vay", "dam", "dress", "skirt", "chan vay", "nu tinh", "du tiec", "hen ho"],
  ["phu kien", "tui xach", "balo", "vi da", "that lung", "mu", "non", "tat", "vo", "kinh mat", "accessories", "bag"],
  ["thoang mat", "mua he", "di bien", "tham hut mo hoi", "cotton", "linen", "vai dui", "mat me", "nhe nhang"],
  ["giu am", "mua dong", "lanh", "ni", "len", "wool", "fleece", "day dan"],
  ["the thao", "gym", "chay bo", "van dong", "co gian", "sport", "activewear"],
  ["cong so", "di lam", "lich su", "trang trong", "formal", "office", "thanh lich"],
  ["dao pho", "casual", "hang ngay", "tre trung", "streetwear", "ca tinh", "ulzzang", "form rong", "oversize"],
  ["cao cap", "luxury", "hang hieu", "atelier", "doc ban", "thiet ke", "premium"],
  ["gia re", "tiet kiem", "khuyen mai", "giam gia", "sale", "voucher", "uu dai", "binh dan"],
  ["doi tra", "hoan tien", "bao hanh", "chinh sach", "quy dinh", "return", "refund"],
  ["giao hang", "van chuyen", "ship", "shipping", "thoi gian giao", "phi ship"],
];

function fnv1aHash(str, seed = 2166136261) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export class LocalEmbeddingProvider extends EmbeddingProvider {
  constructor({
    model = "local-vn-semantic-v1",
    dimensions = Number(process.env.EMBEDDING_DIMENSIONS) || 1536,
  } = {}) {
    super({ model, dimensions, timeoutMs: 5000 });
    this.providerName = "local";
  }

  _vectorize(rawText) {
    const dim = this.dimensions;
    const vec = new Float64Array(dim);
    const normalizedNFC = String(rawText || "")
      .normalize("NFC")
      .toLowerCase()
      .trim();
    const noAccent = toNoAccent(normalizedNFC)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalizedNFC) {
      return Array.from(vec);
    }

    const wordsAccented = normalizedNFC
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
    const wordsNoAccent = noAccent.split(/\s+/).filter(Boolean);

    const addFeature = (featureKey, weight = 1.0) => {
      const h1 = fnv1aHash(featureKey, 2166136261);
      const h2 = fnv1aHash(featureKey, 374761393);
      const idx1 = h1 % dim;
      const sign1 = (h1 & 1) === 0 ? 1 : -1;
      vec[idx1] += sign1 * weight;

      const idx2 = h2 % dim;
      const sign2 = (h2 & 2) === 0 ? 1 : -1;
      vec[idx2] += sign2 * (weight * 0.5);
    };

    // 1. Unigrams (accented & unaccented)
    for (const w of wordsAccented) {
      addFeature(`u_acc:${w}`, 1.2);
    }
    for (const w of wordsNoAccent) {
      addFeature(`u_no:${w}`, 1.5);
      // Character n-grams (3-grams) for morphological resilience
      if (w.length >= 3) {
        for (let i = 0; i <= w.length - 3; i++) {
          addFeature(`c3:${w.slice(i, i + 3)}`, 0.35);
        }
      }
    }

    // 2. Bigrams (important for Vietnamese compound words like "áo thun", "quần tây", "đi biển")
    for (let i = 0; i < wordsNoAccent.length - 1; i++) {
      const bg = `${wordsNoAccent[i]} ${wordsNoAccent[i + 1]}`;
      addFeature(`bg_no:${bg}`, 2.2);
    }
    for (let i = 0; i < wordsAccented.length - 1; i++) {
      const bg = `${wordsAccented[i]} ${wordsAccented[i + 1]}`;
      addFeature(`bg_acc:${bg}`, 1.8);
    }

    // 3. Semantic Concept Expansion (maps synonyms to shared concept anchors)
    VIETNAMESE_SEMANTIC_CONCEPTS.forEach((group, groupIdx) => {
      let matchCount = 0;
      for (const phrase of group) {
        if (noAccent.includes(phrase)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        const boost = 3.5 * Math.min(matchCount, 3);
        addFeature(`concept_anchor_${groupIdx}`, boost);
        for (const canonical of group.slice(0, 4)) {
          addFeature(`concept_syn:${canonical}`, boost * 0.6);
        }
      }
    });

    // L2 Normalization so cosine similarity = dot product
    let normSq = 0;
    for (let i = 0; i < dim; i++) {
      normSq += vec[i] * vec[i];
    }
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < dim; i++) {
        vec[i] = Number((vec[i] / norm).toFixed(6));
      }
    }

    return Array.from(vec);
  }

  async embedText(text) {
    const vector = this._vectorize(text);
    const estTokens = Math.max(1, Math.ceil(String(text || "").length / 4));
    return {
      vector,
      model: this.model,
      dimensions: this.dimensions,
      usage: {
        promptTokens: estTokens,
        totalTokens: estTokens,
        costUsd: 0,
      },
    };
  }

  async embedBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return {
        vectors: [],
        model: this.model,
        dimensions: this.dimensions,
        usage: { promptTokens: 0, totalTokens: 0, costUsd: 0 },
      };
    }
    const vectors = texts.map((t) => this._vectorize(t));
    const totalTokens = texts.reduce(
      (sum, t) => sum + Math.max(1, Math.ceil(String(t || "").length / 4)),
      0
    );
    return {
      vectors,
      model: this.model,
      dimensions: this.dimensions,
      usage: {
        promptTokens: totalTokens,
        totalTokens,
        costUsd: 0,
      },
    };
  }
}
