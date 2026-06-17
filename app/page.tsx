"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  FileText,
  Globe,
  Loader2,
  Paperclip,
  Sparkles,
  X,
} from "lucide-react";

type DocInfo = { filename: string; pages: number; chunks: number };

const EXAMPLES_DOC = [
  "Summarize this document in 5 bullet points",
  "What are the key dates mentioned?",
  "What does it say about payments?",
];
const EXAMPLES_CHAT = [
  "What's the latest news in AI today?",
  "Explain RAG like I'm five",
  "Who won the most recent F1 race?",
];

export default function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<DocInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please choose a PDF file.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDoc({
        filename: data.filename,
        pages: data.pages,
        chunks: data.chunks,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit(text: string) {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  }

  const examples = doc ? EXAMPLES_DOC : EXAMPLES_CHAT;

  return (
    <div
      className="mx-auto flex h-dvh w-full max-w-3xl flex-col px-4 py-5"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) uploadFile(f);
      }}
    >
      {/* ---------- Header ---------- */}
      <header className="flex items-center gap-3 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
          <Sparkles className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">
            DocChat
          </h1>
          <p className="text-xs text-slate-500">
            Chat with your PDFs · cited answers · live web search
          </p>
        </div>
        {/* Loaded-doc pill */}
        {doc && (
          <span className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <FileText className="h-3.5 w-3.5" />
            <span className="max-w-[140px] truncate">{doc.filename}</span>
            <button
              onClick={() => setDoc(null)}
              className="ml-0.5 text-indigo-400 hover:text-indigo-700"
              title="Clear (note: server keeps it until restart)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </header>

      {/* ---------- Chat card ---------- */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
        {/* Drag overlay */}
        {dragging && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/90 text-indigo-700">
            <div className="flex flex-col items-center gap-2">
              <Paperclip className="h-7 w-7" />
              <span className="font-medium">Drop your PDF to index it</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="scroll-area flex-1 space-y-5 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <EmptyState
              doc={doc}
              examples={examples}
              onPick={(t) => submit(t)}
            />
          ) : (
            messages.map((m) => {
              const text = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { text: string }).text)
                .join("");
              const sources = m.parts.filter(
                (p): p is Extract<typeof p, { type: "source-url" }> =>
                  p.type === "source-url",
              );
              const searched = m.parts.some((p) => p.type.startsWith("tool-"));
              const isUser = m.role === "user";

              return (
                <div
                  key={m.id}
                  className={`flex animate-rise gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                      isUser
                        ? "bg-slate-200 text-slate-600"
                        : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                    }`}
                  >
                    {isUser ? "You" : <Sparkles className="h-4 w-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
                    {searched && !isUser && (
                      <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Globe className="h-3 w-3" /> searched the web
                      </div>
                    )}
                    <div
                      className={`inline-block rounded-2xl px-4 py-2.5 text-left ${
                        isUser
                          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                          : "border border-slate-200/80 bg-white text-slate-800 shadow-sm"
                      }`}
                    >
                      {isUser ? (
                        <span className="whitespace-pre-wrap text-[0.925rem]">
                          {text}
                        </span>
                      ) : text ? (
                        <div className="prose-chat">
                          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
                        </div>
                      ) : (
                        <TypingDots />
                      )}
                    </div>

                    {/* Web sources */}
                    {sources.length > 0 && (
                      <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-left">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Sources
                        </div>
                        <ol className="space-y-0.5">
                          {sources.map((s, i) => (
                            <li key={i} className="truncate text-xs">
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                {i + 1}. {s.title || s.url}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Standalone thinking indicator before the first token arrives */}
          {status === "submitted" && (
            <div className="flex animate-rise gap-3">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="inline-block rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        {/* ---------- Composer ---------- */}
        <div className="border-t border-slate-200/70 bg-white/60 p-3">
          {uploadError && (
            <p className="mb-2 px-1 text-xs text-rose-600">⚠️ {uploadError}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-2"
          >
            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Upload a PDF"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Paperclip className="h-5 w-5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
              }}
              className="hidden"
            />

            {/* Text input */}
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
              <input
                className="h-11 flex-1 bg-transparent text-[0.95rem] text-slate-900 outline-none placeholder:text-slate-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  uploading
                    ? "Indexing your PDF…"
                    : doc
                      ? `Ask about ${doc.filename}…`
                      : "Ask anything, or upload a PDF…"
                }
                disabled={busy}
              />
            </div>

            {/* Send */}
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-40"
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Answers from PDFs cite page numbers · web answers cite sources
          </p>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-1">
      <span className="dot h-2 w-2 rounded-full bg-indigo-400" />
      <span className="dot h-2 w-2 rounded-full bg-indigo-400" />
      <span className="dot h-2 w-2 rounded-full bg-indigo-400" />
    </span>
  );
}

function EmptyState({
  doc,
  examples,
  onPick,
}: {
  doc: DocInfo | null;
  examples: string[];
  onPick: (t: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">
        {doc ? `Ask about ${doc.filename}` : "How can I help?"}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {doc
          ? `${doc.pages} pages indexed. I'll answer from the document and cite the page.`
          : "Drop a PDF anywhere to chat with it — or ask me anything and I'll search the web."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
