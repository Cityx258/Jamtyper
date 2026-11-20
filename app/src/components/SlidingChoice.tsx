"use client";

import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

const SELECTED = '[aria-pressed="true"],[aria-checked="true"],[aria-selected="true"]';

type Box = { x: number; y: number; w: number; h: number };

type Props = HTMLAttributes<HTMLElement> & {
  as?: "div" | "span" | "ul";
  indicator: string;
  children: ReactNode;
};

export default function SlidingChoice({ as: Tag = "div", indicator, className = "", children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const picked = root.querySelector<HTMLElement>(SELECTED);
      if (!picked || picked.offsetParent === null) {
        setBox(null);
        return;
      }
      const outer = root.getBoundingClientRect();
      const inner = picked.getBoundingClientRect();
      setBox((old) => {
        const next = {
          x: inner.left - outer.left - root.clientLeft,
          y: inner.top - outer.top - root.clientTop,
          w: inner.width,
          h: inner.height,
        };
        return old && old.x === next.x && old.y === next.y && old.w === next.w && old.h === next.h ? old : next;
      });
    };
    measure();
    const frame = requestAnimationFrame(() => setReady(true));
    const mutations = new MutationObserver(measure);
    mutations.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-pressed", "aria-checked", "aria-selected", "class"],
    });
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  return (
    <Tag ref={ref as never} className={`relative isolate ${className}`} {...rest}>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 -z-10 ${indicator} ${
          ready ? "transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none" : ""
        }`}
        style={
          box
            ? { transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h, opacity: 1 }
            : { opacity: 0 }
        }
      />
      {children}
    </Tag>
  );
}
