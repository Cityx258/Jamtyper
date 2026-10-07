import Clef from "@/components/Clef";
import Header from "@/components/Header";

const MEASURES = [
  {
    title: "Race",
    text: "Jump into a public race and see who finishes first.",
    action: "Start a race",
  },
  {
    title: "Join",
    text: "Got a room code from a friend? Enter it here.",
    action: "Join room",
  },
  {
    title: "Practice",
    text: "Warm up on your own, no one watching.",
    action: "Practice solo",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
        <section className="pt-10 sm:pt-16">
          <div className="relative">
            <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*1.5)]" />
            <div className="relative flex items-start gap-4 sm:gap-8">
              <Clef className="-mt-[calc(var(--staff-gap)*1.7)] shrink-0" />
              <div className="pt-1">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
                  Typing, in tempo
                </p>
                <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.08] sm:text-6xl">
                  Type fast.
                  <br />
                  <span className="text-teal">Keep the rhythm.</span>
                </h1>
              </div>
            </div>
          </div>
          <p className="mt-10 max-w-xl text-lg text-muted">
            Race other players in real time, climb the podium and unlock new
            looks as your speed goes up.
          </p>
        </section>

        <section
          aria-label="Ways to play"
          className="mt-16 grid border-y border-line md:grid-cols-3"
        >
          {MEASURES.map((m, i) => (
            <div
              key={m.title}
              className={`flex flex-col gap-4 px-1 py-8 md:px-8 ${
                i > 0 ? "border-t border-line md:border-l md:border-t-0" : ""
              } ${i === 0 ? "md:pl-0" : ""}`}
            >
              <span className="font-mono text-xs text-teal">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-2xl">{m.title}</h2>
              <p className="flex-1 text-muted">{m.text}</p>
              <button
                type="button"
                className="self-start rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-teal-bright"
              >
                {m.action}
              </button>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
