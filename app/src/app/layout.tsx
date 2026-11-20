import type { Metadata } from "next";
import {
  Dela_Gothic_One,
  JetBrains_Mono,
  Noto_Music,
  Zen_Maru_Gothic,
} from "next/font/google";
import FloatingNotes from "@/components/FloatingNotes";
import Footer from "@/components/Footer";
import MusicPlayer from "@/components/MusicPlayer";
import { getDict, getLocale, getTheme } from "@/i18n";
import "./globals.css";

const body = Zen_Maru_Gothic({
  variable: "--f-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

const display = Dela_Gothic_One({
  variable: "--f-display",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const mono = JetBrains_Mono({
  variable: "--f-mono",
  subsets: ["latin"],
});

const music = Noto_Music({
  variable: "--f-music",
  weight: "400",
  subsets: ["music"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: "JamTyper", description: t.meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme, t] = await Promise.all([getLocale(), getTheme(), getDict()]);
  return (
    <html
      lang={locale}
      data-theme={theme === "system" ? undefined : theme}
      className={`${body.variable} ${display.variable} ${mono.variable} ${music.variable}`}
    >
      <body className="relative flex min-h-screen flex-col overflow-x-hidden">
        <FloatingNotes />
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
          <Footer />
        </div>
        <MusicPlayer t={t.player} />
      </body>
    </html>
  );
}
