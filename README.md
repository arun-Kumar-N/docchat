# DocChat

Chat with your PDFs — cited answers over your own documents, plus live web search.
*(RAG warm-up project on the road to the [Tamil-AI portfolio](../tamil-llm-benchmark/SPEC.md).)*

**Stack:** Next.js 16 · Vercel AI SDK v6 · Claude (Anthropic) · transformers.js (local embeddings) · in-memory vector store

## Run it

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev                  # → http://localhost:3000
```

Then: **Upload a PDF** → ask questions about it (answers cite page numbers). With no PDF loaded, it's a normal chat with **web search** for recent info. First upload downloads a small embedding model (~90 MB), one time.

## How RAG works here (the whole point)

```
PDF → extract text per page (unpdf)
    → chunk into ~1000-char overlapping pieces (lib/chunk.ts)
    → embed each chunk locally (lib/embeddings.ts, all-MiniLM-L6-v2, 384-dim)
    → store vectors in memory (lib/store.ts)

Question → embed it → cosine-similarity search for top-5 chunks
        → inject those chunks into Claude's prompt
        → Claude answers ONLY from them, citing (p.N) — or says "not in the doc"
```

## Status

### ✅ Step 1 — Streaming chat → Claude
### ✅ Step 1.5 — Web search (tool use) for recent data
### ✅ Step 2 — PDF → chunks → local embeddings → vector store
### ✅ Step 3 — Retrieval + cited answers (grounded; refuses when not in the doc)
### ⬜ Step 4 — Polish + ship
- [ ] Deploy to Vercel
- [ ] Persistent store (swap in-memory → Supabase pgvector — see [`supabase/schema.sql`](supabase/schema.sql))
- [ ] README demo GIF + short writeup

## Known limitations (on purpose — it's a learning build)

- **In-memory store** resets on server restart and is single-user. Real apps use a vector DB (pgvector). The cosine-search logic in `lib/store.ts` is exactly what a vector DB does for you.
- **Local embeddings** (all-MiniLM) are small/fast but weaker than hosted models — fine for English; the Tamil projects will need multilingual embeddings.

## What I'm learning here

Chunking strategy, embeddings, retrieval quality, grounding (making the model answer *only* from sources and admit when it can't). The grounding/refusal part is the foundation for **Urimai**, where wrong legal answers are dangerous.
