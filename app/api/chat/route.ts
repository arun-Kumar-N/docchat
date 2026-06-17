import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { embedOne } from "@/lib/embeddings";
import { search, storeStats } from "@/lib/store";

export const maxDuration = 60;

// Pull the plain text out of the most recent user message (to embed for search).
function lastUserText(messages: UIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return lastUser.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join(" ");
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // --- RAG: if documents are loaded, retrieve relevant chunks for this question ---
  let context = "";
  const hasDocs = storeStats().chunkCount > 0;
  if (hasDocs) {
    const query = lastUserText(messages);
    if (query.trim()) {
      const hits = search(await embedOne(query), 5);
      context = hits
        .map(
          (h, i) =>
            `[Source ${i + 1} — ${h.source}, p.${h.page}]\n${h.text}`,
        )
        .join("\n\n");
    }
  }

  const system = hasDocs
    ? "You are DocChat. Answer the user's question using ONLY the document excerpts below. " +
      "Cite the page you used in the form (p.N) after each fact. " +
      "If the excerpts don't contain the answer, say so plainly — do NOT make it up. " +
      "You may use the web_search tool only if the user explicitly asks about recent/external info.\n\n" +
      "=== DOCUMENT EXCERPTS ===\n" +
      context
    : "You are DocChat, a helpful assistant. You have a web_search tool — use it for recent " +
      "events, current facts, or news. Cite sources when you use it. Otherwise answer directly. " +
      "Tip: the user can upload a PDF to ask questions about it.";

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages: await convertToModelMessages(messages),
    tools: {
      web_search: anthropic.tools.webSearch_20260209({ maxUses: 5 }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({ sendSources: true });
}
