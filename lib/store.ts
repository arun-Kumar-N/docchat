// Dead-simple in-memory vector store.
//
// Learning note: this lives in server memory, so it resets when you restart
// `npm run dev`, and it's single-user. That's fine for learning the RAG loop.
// When we build Urimai we'll swap this for Supabase pgvector (persistent,
// multi-user) — but the logic below (cosine similarity search) is exactly what
// a vector database does for you under the hood.

export type Chunk = {
  text: string;
  page: number;
  source: string; // filename
  embedding: number[];
};

// Module-level global → shared across API routes in the dev server.
const chunks: Chunk[] = [];

export function addChunks(newChunks: Chunk[]) {
  chunks.push(...newChunks);
}

export function clearStore() {
  chunks.length = 0;
}

export function storeStats() {
  const sources = [...new Set(chunks.map((c) => c.source))];
  return { chunkCount: chunks.length, sources };
}

// Cosine similarity. Our embeddings are already normalized, so this is just a
// dot product — but we divide by norms anyway to be safe and explicit.
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type SearchHit = Chunk & { score: number };

/** Return the top-k most similar chunks to the query embedding. */
export function search(queryEmbedding: number[], k = 5): SearchHit[] {
  return chunks
    .map((c) => ({ ...c, score: cosine(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
