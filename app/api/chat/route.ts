import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system:
      "You are DocChat, a helpful assistant. Answer clearly and concisely. " +
      "Format answers in Markdown when it helps readability.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
