# DocChat

Chat with your PDFs — cited answers over your own documents.
*(Week-1 RAG warm-up project on the road to [Tamil-AI portfolio](../tamil-llm-benchmark/SPEC.md).)*

**Stack:** Next.js 16 · Vercel AI SDK v6 · Claude (Anthropic) · Supabase pgvector

## Run it

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev                  # → http://localhost:3000
```

## Status / build plan

### ✅ Step 1 — Streaming chat (done, this scaffold)
- [x] Next.js app + `useChat` UI
- [x] `/api/chat` streaming route → Claude Sonnet

### ⬜ Step 2 — PDF → chunks → embeddings
- [ ] Create a free [Supabase](https://supabase.com) project, run [`supabase/schema.sql`](supabase/schema.sql)
- [ ] Upload route: parse PDF (`unpdf` or `pdf-parse`), chunk ~500 tokens with ~50 overlap
- [ ] Embed chunks with [Voyage AI](https://www.voyageai.com) (`voyage-3`, 1024 dims) → insert into `chunks`

### ⬜ Step 3 — Retrieval + cited answers
- [ ] `/api/ask`: embed the question → `match_chunks()` top-5 → pass as context to Claude
- [ ] Prompt Claude to cite chunk numbers; render citations in the UI

### ⬜ Step 4 — Polish + ship
- [ ] Deploy to Vercel (set env vars in dashboard)
- [ ] README demo GIF
- [ ] Short writeup: what I learned about chunking/retrieval

## What I'm learning here

Chunking strategy, embedding choice, retrieval quality, streaming UX — the plumbing every RAG system needs. The interesting failures (bad chunk boundaries, irrelevant retrievals) are the point: they're what the Tamil RAG project will have to solve on harder ground.
