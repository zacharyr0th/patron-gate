import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Header } from "@repo/ui/header";
import { Footer } from "@repo/ui/footer";
import { Providers } from "@repo/ui/providers";
import { AsciiBackground } from "../components/ascii-background";

export const metadata: Metadata = {
  title: "On Shelby | Autonomous Creator Revenue",
  description:
    "Zero platform fees. Instant payouts. Autonomous treasury management powered by AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="antialiased font-sans h-screen overflow-hidden">
        <Providers>
          <AsciiBackground />
          <div className="relative z-10 h-full flex flex-col">
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
