// Local text embeddings via transformers.js — runs on your machine, no API key.
// Model: all-MiniLM-L6-v2 (384 dimensions). Loaded once, then reused.
import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

export const EMBED_DIM = 384;

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor() {
  // Singleton: the model is loaded on first use and cached for the process.
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }
  return extractorPromise;
}

/** Embed one or many texts into normalized 384-dim vectors. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

/** Convenience: embed a single string. */
export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await embed([text]);
  return vec;
}
