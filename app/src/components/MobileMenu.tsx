"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Item = { href: string; label: string };

export default function MobileMenu({
  items,
  label,
  className,
  children,
}: {
  items: Item[];
  label: string;
  className: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
        className={className}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-2xl border border-line bg-raised p-1.5 shadow-lg"
        >
          <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm transition-colors hover:bg-teal/15 hover:text-ink ${
                  pathname === item.href ? "text-teal" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          </ul>
          {children && (
            <div className="mt-1.5 flex gap-2 border-t border-line px-2.5 pb-1 pt-2.5">{children}</div>
          )}
        </div>
      )}
    </div>
  );
}
