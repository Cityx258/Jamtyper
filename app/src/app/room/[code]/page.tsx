import { headers } from "next/headers";
import Header from "@/components/Header";
import RoomLobby from "@/components/RoomLobby";
import { getDict } from "@/i18n";
import { auth } from "@/lib/auth";
import { normalizeRoomCode } from "@/lib/room-code";

export async function generateMetadata(props: PageProps<"/room/[code]">) {
  const [{ code }, t] = await Promise.all([props.params, getDict()]);
  const normalized = normalizeRoomCode(code);
  return { title: `${t.room.title}${normalized ? ` ${normalized}` : ""} | JamTyper` };
}

export default async function RoomPage(props: PageProps<"/room/[code]">) {
  const [{ code }, t, session] = await Promise.all([
    props.params,
    getDict(),
    headers().then((h) => auth.api.getSession({ headers: h })),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <RoomLobby
          code={normalizeRoomCode(code)}
          accountName={
            session ? (session.user.displayUsername ?? session.user.name) : null
          }
          t={t.room}
        />
      </main>
    </>
  );
}
