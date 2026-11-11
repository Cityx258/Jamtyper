import Header from "@/components/Header";
import PracticeSession from "@/components/PracticeSession";
import { getDict } from "@/i18n";

export async function generateMetadata() {
  return { title: `${(await getDict()).practice.title} | JamTyper` };
}

export default async function PracticePage() {
  const t = await getDict();
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <PracticeSession t={t.practice} heatmapT={t.profile.heatmap} />
      </main>
    </>
  );
}
