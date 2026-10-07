import type { Metadata } from "next";
import {
  Dela_Gothic_One,
  JetBrains_Mono,
  Noto_Music,
  Zen_Maru_Gothic,
} from "next/font/google";
import FloatingNotes from "@/components/FloatingNotes";
import "./globals.css";

const body = Zen_Maru_Gothic({
  variable: "--f-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const display = Dela_Gothic_One({
  variable: "--f-display",
  subsets: ["latin"],
  weight: "400",
});

const mono = JetBrains_Mono({
  variable: "--f-mono",
  subsets: ["latin"],
});

const music = Noto_Music({
  variable: "--f-music",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Name",
  description: "Race your friends and learn to type fast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${mono.variable} ${music.variable}`}
    >
      <body className="relative flex min-h-screen flex-col overflow-x-hidden">
        <FloatingNotes />
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
