"use client";

import { useEffect, useRef, useState } from "react";
import NoteIcon from "@/components/NoteIcon";
import { peekSize, type Singer } from "@/lib/notes";
import { CHARGE_AT, DONE_AT, FIRE_AT, SWAP_AT, WORD_AT } from "@/lib/beam";
import { playBeam, stopMelodies } from "@/lib/sound";

const MIKU_SIZE = 340;
const MIKU_MAX_SCREEN = 0.5;
const START_WAIT_MS = 1500;

type Phase = "chant" | "charge" | "fire" | "fade";

type Props = {
  singer: Singer;
  ready: string;
  onSwap: () => void;
  onDone: () => void;
};

export default function MikuBeam({ singer, ready, onSwap, onDone }: Props) {
  const [step, setStep] = useState(-1);
  const [phase, setPhase] = useState<Phase>("chant");
  const [size] = useState(() => Math.min(peekSize(singer, MIKU_SIZE), Math.round(window.innerHeight * MIKU_MAX_SCREEN)));
  const swap = useRef(onSwap);
  const done = useRef(onDone);
  useEffect(() => {
    swap.current = onSwap;
    done.current = onDone;
  });
  const chant = ["1", "2", "3", ready, "Miku Miku", "BEAM!"];
  useEffect(() => {
    stopMelodies();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let begun = false;
    const begin = () => {
      if (begun) return;
      begun = true;
      timers.push(
        ...WORD_AT.map((at, i) => setTimeout(() => setStep(i), at)),
        setTimeout(() => setPhase("charge"), CHARGE_AT),
        setTimeout(() => setPhase("fire"), FIRE_AT),
        setTimeout(() => {
          setPhase("fade");
          swap.current();
        }, SWAP_AT),
        setTimeout(() => done.current(), DONE_AT),
      );
    };
    const stop = playBeam(begin);
    timers.push(setTimeout(begin, START_WAIT_MS));
    return () => {
      timers.forEach(clearTimeout);
      stop();
    };
  }, []);
  useEffect(() => {
    const skip = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      swap.current();
      done.current();
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);
  const skip = () => {
    swap.current();
    done.current();
  };
  const fired = phase === "fire" || phase === "fade";
  const word = step >= 0 && phase !== "fade" ? chant[step] : null;
  const big = step >= chant.length - 2;
  return (
    <div onClick={skip} className="fixed inset-0 z-50 cursor-pointer overflow-hidden">
      <p className="sr-only" aria-live="assertive">
        {step >= chant.length - 1 ? "Miku Miku Beam!" : ""}
      </p>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-bg/50 transition-opacity duration-300 ${phase === "fade" ? "opacity-0" : "opacity-100"}`}
      />
      {word && (
        <p
          key={step}
          aria-hidden="true"
          className={`beam-word absolute inset-x-4 top-[22%] text-center font-display leading-none drop-shadow-[0_0_24px_var(--glow)] ${
            big ? "text-6xl text-teal sm:text-9xl" : "text-7xl text-ink sm:text-9xl"
          }`}
        >
          {word}
        </p>
      )}
      <div
        aria-hidden="true"
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${phase === "fade" ? "opacity-0" : ""}`}
      >
        <div className="beam-rise">
          <div className={phase === "chant" ? "winner-dance" : "beam-shake"}>
            <NoteIcon note={singer} size={size} />
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 h-10 w-10 -translate-x-1/2 translate-y-1/2 motion-reduce:hidden"
        style={{ bottom: size * 0.55 }}
      >
        <div
          className="h-full w-full rounded-full bg-[radial-gradient(circle,var(--beam)_0%,var(--beam)_45%,var(--teal-bright)_60%,transparent_72%)] ease-in"
          style={{
            transform: `scale(${fired ? 170 : phase === "charge" ? 3.5 : 0})`,
            opacity: phase === "fade" ? 0 : 1,
            transition:
              phase === "charge"
                ? `transform ${FIRE_AT - CHARGE_AT}ms cubic-bezier(0.5,0,0.75,0)`
                : phase === "fire"
                  ? "transform 250ms cubic-bezier(0.5,0,0.75,0)"
                  : "opacity 800ms ease-out",
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-beam motion-reduce:bg-bg"
        style={{
          opacity: phase === "fire" ? 1 : 0,
          transition: phase === "fire" ? "opacity 250ms ease-in" : "opacity 800ms ease-out",
        }}
      />
    </div>
  );
}
