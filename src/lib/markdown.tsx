/**
 * A deliberately small Markdown-to-JSX renderer.
 *
 * We avoid pulling in `react-markdown` / `remark` / `rehype` because they
 * balloon the client bundle and occasionally break on Vercel's stricter
 * boundary checks. Gemini's output is well-behaved (headings, lists, bold,
 * italics, code, links, blockquotes, horizontal rules, fenced code) so a
 * hand-rolled parser is enough and keeps the bundle tiny.
 *
 * The parser is intentionally line-oriented: it walks lines, recognises
 * block structures (heading, fenced code, blockquote, list, hr, paragraph),
 * and within inline text it handles **bold**, *italic*, `code`, and
 * [text](url) links. Nested lists are not supported — Gemini's prompts are
 * shaped to emit flat lists only.
 */
import React from "react";

type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string }
  | { kind: "code"; value: string }
  | { kind: "link"; label: string; href: string };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Order matters: code > bold > italic > link.
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: "text", value: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith("`")) tokens.push({ kind: "code", value: raw.slice(1, -1) });
    else if (raw.startsWith("**")) tokens.push({ kind: "bold", value: raw.slice(2, -2) });
    else if (raw.startsWith("*")) tokens.push({ kind: "italic", value: raw.slice(1, -1) });
    else {
      const lm = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) tokens.push({ kind: "link", label: lm[1], href: lm[2] });
      else tokens.push({ kind: "text", value: raw });
    }
    last = m.index + raw.length;
  }
  if (last < text.length) tokens.push({ kind: "text", value: text.slice(last) });
  return tokens;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  return parseInline(text).map((t, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (t.kind) {
      case "bold":
        return (
          <strong key={key} className="font-bold text-neutral-900 dark:text-white">
            {t.value}
          </strong>
        );
      case "italic":
        return (
          <em key={key} className="italic text-neutral-700 dark:text-neutral-200">
            {t.value}
          </em>
        );
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.85em] text-purple-700 dark:bg-neutral-800 dark:text-purple-300"
          >
            {t.value}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={t.href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-purple-600 underline decoration-purple-300 decoration-1 underline-offset-2 hover:text-purple-500 dark:text-purple-400 dark:decoration-purple-700"
          >
            {t.label}
          </a>
        );
      default:
        return <React.Fragment key={key}>{t.value}</React.Fragment>;
    }
  });
}

interface MarkdownProps {
  source: string;
  className?: string;
}

export function Markdown({ source, className = "" }: MarkdownProps) {
  const lines = (source ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre
          key={`code-${blockKey++}`}
          className="my-4 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-950 p-4 font-mono text-[13px] leading-relaxed text-neutral-100 dark:border-neutral-800"
          data-lang={lang || undefined}
        >
          <code>{buf.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line) && line.trim().length >= 3) {
      blocks.push(<hr key={`hr-${blockKey++}`} className="my-6 border-neutral-200 dark:border-neutral-800" />);
      i++;
      continue;
    }

    // ATX heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const Tag = (`h${Math.min(level, 4)}`) as "h1" | "h2" | "h3" | "h4";
      const sizeMap = {
        h1: "font-display mt-8 mb-3 text-3xl font-black leading-tight tracking-tight text-neutral-900 dark:text-white",
        h2: "font-display mt-7 mb-3 text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white",
        h3: "font-display mt-6 mb-2 text-lg font-bold text-neutral-900 dark:text-white",
        h4: "font-display mt-5 mb-2 text-base font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200",
      } as const;
      blocks.push(
        <Tag key={`h-${blockKey++}`} className={sizeMap[Tag]}>
          {renderInline(text, `h-${blockKey}`)}
        </Tag>
      );
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={`bq-${blockKey++}`}
          className="my-4 border-l-4 border-purple-400 bg-purple-50/60 px-4 py-3 text-neutral-700 italic dark:border-purple-700 dark:bg-purple-950/30 dark:text-neutral-200"
        >
          {renderInline(buf.join(" "), `bq-${blockKey}`)}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`ul-${blockKey++}`} className="my-4 space-y-2 pl-5 text-neutral-700 dark:text-neutral-300">
          {items.map((it, j) => (
            <li key={j} className="relative before:absolute before:-left-4 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-purple-500">
              {renderInline(it, `li-${blockKey}-${j}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`ol-${blockKey++}`} className="my-4 list-decimal space-y-2 pl-6 text-neutral-700 marker:font-bold marker:text-purple-600 dark:text-neutral-300 dark:marker:text-purple-400">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `oli-${blockKey}-${j}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-block lines)
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|```|>\s?|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i]) &&
      !/^\s*([-*_])\s*\1\s*\1/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <p
        key={`p-${blockKey++}`}
        className="my-3 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300"
      >
        {renderInline(buf.join(" "), `p-${blockKey}`)}
      </p>
    );
  }

  return <div className={`prose-pv ${className}`}>{blocks}</div>;
}

/**
 * Parses a Markdown question plan of the shape:
 *   # Interview Plan
 *   1. **Goal** — What …
 *   2. **Starting point** — What …
 *
 * into an array of `{ label, question }`. Falls back to `[]` if parsing
 * fails so callers can show an error.
 */
export function parseQuestionPlan(markdown: string): Array<{ label: string; question: string }> {
  if (!markdown) return [];
  const out: Array<{ label: string; question: string }> = [];
  const lines = markdown.split(/\r?\n/);
  for (const raw of lines) {
    const m = raw.match(/^\s*\d+\.\s+\*\*([^*]+)\*\*\s*[-—:]\s*(.+)$/);
    if (m) {
      out.push({ label: m[1].trim(), question: m[2].trim() });
      continue;
    }
    const m2 = raw.match(/^\s*\d+\.\s+(.+)$/);
    if (m2 && out.length < 12) {
      out.push({ label: `Question ${out.length + 1}`, question: m2[1].trim() });
    }
  }
  return out;
}
