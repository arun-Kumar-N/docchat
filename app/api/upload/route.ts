import { extractPages } from "@/lib/pdf";
import { chunkPages } from "@/lib/chunk";
import { embed } from "@/lib/embeddings";
import { addChunks, storeStats, type Chunk } from "@/lib/store";

export const maxDuration = 120;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Please upload a PDF" }, { status: 400 });
  }

  // 1. PDF → per-page text
  const data = new Uint8Array(await file.arrayBuffer());
  const pages = await extractPages(data);
  if (pages.length === 0) {
    return Response.json(
      { error: "Couldn't extract any text (is it a scanned image PDF?)" },
      { status: 422 },
    );
  }

  // 2. text → overlapping chunks
  const raw = chunkPages(pages);

  // 3. chunks → embeddings (batched)
  const vectors = await embed(raw.map((c) => c.text));

  // 4. store
  const chunks: Chunk[] = raw.map((c, i) => ({
    text: c.text,
    page: c.page,
    source: file.name,
    embedding: vectors[i],
  }));
  addChunks(chunks);

  return Response.json({
    ok: true,
    filename: file.name,
    pages: pages.length,
    chunks: chunks.length,
    store: storeStats(),
  });
}
