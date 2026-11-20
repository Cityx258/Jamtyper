import Header from "@/components/Header";
import RoomExplorer from "@/components/RoomExplorer";
import { getDict } from "@/i18n";

export async function generateMetadata() {
  return { title: `${(await getDict()).explorer.title} | JamTyper` };
}

export default async function RoomsPage() {
  const dict = await getDict();
  const t = dict.explorer;
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">{t.kicker}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-6xl">{t.title}</h1>
        <p className="mt-4 max-w-xl text-muted">{t.intro}</p>
        <RoomExplorer
          t={t}
          languages={dict.room.settings.languages}
          difficulties={dict.room.settings.difficulties}
        />
      </main>
    </>
  );
}
