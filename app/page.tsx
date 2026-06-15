"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col p-4">
      <header className="pb-4">
        <h1 className="text-xl font-semibold">DocChat</h1>
        <p className="text-sm text-gray-500">
          Week 1: streaming chat · Week 2: PDF upload + RAG
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <p className="pt-16 text-center text-gray-400">
            Ask me anything to test the stream.
          </p>
        )}
        {messages.map((m) => {
          // Collect web-search source links (Anthropic sends these as source-url parts).
          const sources = m.parts.filter(
            (p): p is Extract<typeof p, { type: "source-url" }> =>
              p.type === "source-url",
          );
          // Did the model invoke the web_search tool in this message?
          const searched = m.parts.some((p) => p.type.startsWith("tool-"));

          return (
            <div
              key={m.id}
              className={`whitespace-pre-wrap rounded-lg px-4 py-2 ${
                m.role === "user"
                  ? "ml-12 bg-blue-600 text-white"
                  : "mr-12 bg-gray-100 text-gray-900"
              }`}
            >
              {searched && m.role !== "user" && (
                <div className="mb-1 text-xs font-medium text-gray-400">
                  🔍 searched the web
                </div>
              )}

              {m.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null,
              )}

              {sources.length > 0 && (
                <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500">
                  <span className="font-medium">Sources:</span>
                  <ol className="ml-4 list-decimal">
                    {sources.map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          {s.title || s.url}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
        <input
          className="flex-1 rounded-lg border px-4 py-2 outline-none focus:border-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Thinking…" : "Say something…"}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
