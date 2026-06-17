// Extract text from a PDF, page by page (so we can cite page numbers).
import { extractText, getDocumentProxy } from "unpdf";

export type Page = { page: number; text: string };

export async function extractPages(data: Uint8Array): Promise<Page[]> {
  const pdf = await getDocumentProxy(data);
  // mergePages: false → `text` is one entry per page.
  const { text } = await extractText(pdf, { mergePages: false });
  return text
    .map((t, i) => ({ page: i + 1, text: (t ?? "").trim() }))
    .filter((p) => p.text.length > 0);
}
