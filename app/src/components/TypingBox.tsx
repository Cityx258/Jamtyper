"use client";

import { useEffect, useRef, useState } from "react";
import type { ErrorMode } from "@/lib/race-settings";
import type { MissedKeys, ProgressPayload } from "@/lib/room-protocol";

type Props = {
  text: string;
  start: number;
  startErrors?: number;
  mode?: ErrorMode;
  label: string;
  onProgress: (progress: ProgressPayload) => void;
};

const MAX_WRONG = 10;

function correctPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return i;
}

function wrongIndexes(typed: string, expected: string, offset = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== expected[i]) out.push(offset + i);
  }
  return out;
}

const block = (e: React.SyntheticEvent) => e.preventDefault();

function useMistakes() {
  const [mistakes, setMistakes] = useState(0);
  const [missed, setMissed] = useState<MissedKeys>({});
  function record(typed: string, expected: string, from: number) {
    const keys: string[] = [];
    for (let i = from; i < typed.length; i++) {
      if (typed[i] !== expected[i]) keys.push(expected[i] ?? "");
    }
    if (!keys.length) return;
    setMistakes((m) => m + keys.length);
    setMissed((prev) => {
      const next = { ...prev };
      for (const k of keys) if (k) next[k] = (next[k] ?? 0) + 1;
      return next;
    });
  }
  return { mistakes, missed, record };
}

function Field({
  value,
  done,
  invalid,
  label,
  onChange,
}: {
  value: string;
  done: boolean;
  invalid: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <input
      ref={inputRef}
      value={value}
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
        invalid ? "border-danger" : "border-line focus:border-teal"
      }`}
    />
  );
}

const textClass = "select-none font-mono text-xl leading-relaxed sm:text-2xl";

function FixBox({ text, start, label, onProgress }: Props) {
  const [committed, setCommitted] = useState(start);
  const [input, setInput] = useState("");
  const { mistakes, missed, record } = useMistakes();

  const rest = text.slice(committed);
  const correct = correctPrefix(input, rest);
  const position = committed + correct;
  const wrong = input.length - correct;
  const done = committed >= text.length;

  useEffect(() => {
    onProgress({ position, mistakes, missed, errors: 0 });
  }, [position, mistakes, missed, onProgress]);

  function onChange(value: string) {
    if (value.length > input.length) {
      if (value.length - correctPrefix(value, rest) > MAX_WRONG) return;
      record(value, rest, input.length);
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
      <p className={textClass} onCopy={block} onCut={block}>
        <span className="text-teal">{text.slice(0, position)}</span>
        <span className="bg-danger/25 text-danger">
          {text.slice(position, cursor)}
        </span>
        <span className="underline decoration-teal decoration-2 underline-offset-4">
          {text.slice(cursor, cursor + 1)}
        </span>
        <span className="text-muted">{text.slice(cursor + 1)}</span>
      </p>
      <Field value={input} done={done} invalid={wrong > 0} label={label} onChange={onChange} />
    </div>
  );
}

function ContinueBox({ text, start, startErrors = 0, label, onProgress }: Props) {
  const [origin] = useState(start);
  const [baseErrors] = useState(startErrors);
  const [committed, setCommitted] = useState(start);
  const [wrongBefore, setWrongBefore] = useState<number[]>([]);
  const [input, setInput] = useState("");
  const { mistakes, missed, record } = useMistakes();

  const rest = text.slice(committed);
  const wrongNow = wrongIndexes(input, rest, committed);
  const position = committed + input.length;
  const errors = baseErrors + wrongBefore.length + wrongNow.length;
  const done = position >= text.length;

  useEffect(() => {
    onProgress({ position, mistakes, missed, errors });
  }, [position, mistakes, missed, errors, onProgress]);

  function onChange(raw: string) {
    const value = raw.slice(0, rest.length);
    if (value.length > input.length) record(value, rest, input.length);
    if (value.endsWith(" ") || value.length === rest.length) {
      setWrongBefore((w) => [...w, ...wrongIndexes(value, rest, committed)]);
      setCommitted(committed + value.length);
      setInput("");
      return;
    }
    setInput(value);
  }

  const wrongSet = new Set([...wrongBefore, ...wrongNow]);
  const typed: React.ReactNode[] = [];
  let runStart = origin;
  for (let i = origin; i <= position; i++) {
    const bad = wrongSet.has(runStart);
    if (i === position || wrongSet.has(i) !== bad) {
      if (i > runStart) {
        typed.push(
          <span
            key={runStart}
            className={bad ? "bg-danger/25 text-danger" : "text-teal"}
          >
            {text.slice(runStart, i)}
          </span>,
        );
      }
      runStart = i;
    }
  }

  return (
    <div>
      <p className={textClass} onCopy={block} onCut={block}>
        <span className="text-teal">{text.slice(0, origin)}</span>
        {typed}
        <span className="underline decoration-teal decoration-2 underline-offset-4">
          {text.slice(position, position + 1)}
        </span>
        <span className="text-muted">{text.slice(position + 1)}</span>
      </p>
      <Field
        value={input}
        done={done}
        invalid={wrongNow.length > 0}
        label={label}
        onChange={onChange}
      />
    </div>
  );
}

export default function TypingBox(props: Props) {
  return props.mode === "continue" ? <ContinueBox {...props} /> : <FixBox {...props} />;
}
