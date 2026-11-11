"use client";

import { useEffect, useRef, useState } from "react";
import type { MissedKeys, ProgressPayload } from "@/lib/room-protocol";

type Props = {
  text: string;
  start: number;
  label: string;
  onProgress: (progress: ProgressPayload) => void;
};

const MAX_WRONG = 10;

function correctPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return i;
}

const block = (e: React.SyntheticEvent) => e.preventDefault();

export default function TypingBox({ text, start, label, onProgress }: Props) {
  const [committed, setCommitted] = useState(start);
  const [input, setInput] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [missed, setMissed] = useState<MissedKeys>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const rest = text.slice(committed);
  const correct = correctPrefix(input, rest);
  const position = committed + correct;
  const wrong = input.length - correct;
  const done = committed >= text.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    onProgress({ position, mistakes, missed });
  }, [position, mistakes, missed, onProgress]);

  function onChange(value: string) {
    if (value.length > input.length) {
      if (value.length - correctPrefix(value, rest) > MAX_WRONG) return;
      const keys: string[] = [];
      for (let i = input.length; i < value.length; i++) {
        if (value[i] !== rest[i]) keys.push(rest[i] ?? "");
      }
      if (keys.length) {
        setMistakes((m) => m + keys.length);
        setMissed((prev) => {
          const next = { ...prev };
          for (const k of keys) if (k) next[k] = (next[k] ?? 0) + 1;
          return next;
        });
      }
    }
    if (value === rest || (value.endsWith(" ") && rest.startsWith(value))) {
      setCommitted(committed + value.length);
      setInput("");
      return;
    }
    setInput(value);
  }

  const cursor = position + wrong;

  return (
    <div>
      <p
        className="select-none font-mono text-xl leading-relaxed sm:text-2xl"
        onCopy={block}
        onCut={block}
      >
        <span className="text-teal">{text.slice(0, position)}</span>
        <span className="bg-danger/25 text-danger">
          {text.slice(position, cursor)}
        </span>
        <span className="underline decoration-teal decoration-2 underline-offset-4">
          {text.slice(cursor, cursor + 1)}
        </span>
        <span className="text-muted">{text.slice(cursor + 1)}</span>
      </p>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onPaste={block}
        onDrop={block}
        onCopy={block}
        onCut={block}
        disabled={done}
        aria-label={label}
        placeholder={label}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`mt-6 w-full rounded-lg border bg-bg/70 px-4 py-3 font-mono text-lg text-ink focus:outline-none ${
          wrong ? "border-danger" : "border-line focus:border-teal"
        }`}
      />
    </div>
  );
}
