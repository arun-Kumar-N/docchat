import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system:
      "You are DocChat, a helpful assistant. " +
      "You have a web_search tool. Use it whenever the user asks about recent events, " +
      "current facts, news, prices, or anything that may have changed after your training " +
      "cutoff. When you use search results, cite the sources. If you already know the answer " +
      "confidently and it is not time-sensitive, just answer directly. " +
      "Format answers in Markdown when it helps readability.",
    messages: await convertToModelMessages(messages),
    tools: {
      // Anthropic's native server-side web search — no extra API key, bills via Anthropic.
      web_search: anthropic.tools.webSearch_20260209({ maxUses: 5 }),
    },
    // Allow the model to search, then answer — multiple steps in one turn.
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({ sendSources: true });
}
