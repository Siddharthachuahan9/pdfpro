"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link className="top__link" href={href} aria-current={pathname === href ? "page" : undefined}>
      {children}
    </Link>
  );
}
