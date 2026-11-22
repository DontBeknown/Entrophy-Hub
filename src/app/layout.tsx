import type { Metadata } from "next";
import { Header } from "@/components/site";
import "@fontsource-variable/inter";
import "@fontsource/russo-one/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Entropy Hub", template: "%s | Entropy Hub" },
  description: "An unofficial BlazBlue Entropy Effect community for builds, tactics, combos, and speedruns.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <a className="button skip" href="#main">Skip to content</a>
    <Header />
    <main id="main" tabIndex={-1}>{children}</main>
  </body></html>;
}
