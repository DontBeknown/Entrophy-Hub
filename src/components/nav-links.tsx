"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();
  return <>
    <Link href="/characters" aria-current={pathname === "/characters" ? "page" : undefined}>Characters</Link>
    <Link href="/browse" aria-current={pathname === "/browse" ? "page" : undefined}>Browse</Link>
  </>;
}
