// Split page text into overlapping chunks.
//
// Why chunk at all? Embeddings work best on smallish, focused passages, and we
// can only fit so much into the model's context. Overlap keeps sentences that
// straddle a boundary from being lost. Chunking strategy is where most RAG
// systems live or die — this is a simple, solid default.
import type { Page } from "./pdf";

const CHUNK_SIZE = 1000; // characters
const OVERLAP = 150; // characters carried over between chunks

export type RawChunk = { text: string; page: number };

export function chunkPages(pages: Page[]): RawChunk[] {
  const out: RawChunk[] = [];
  for (const { page, text } of pages) {
    // Normalize whitespace so chunk sizes are meaningful.
    const clean = text.replace(/\s+/g, " ").trim();
    let start = 0;
    while (start < clean.length) {
      const end = Math.min(start + CHUNK_SIZE, clean.length);
      const piece = clean.slice(start, end).trim();
      if (piece.length > 0) out.push({ text: piece, page });
      if (end >= clean.length) break;
      start = end - OVERLAP; // step back to create overlap
    }
  }
  return out;
}
