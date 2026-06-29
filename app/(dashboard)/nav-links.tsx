"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import type { Role } from "@prisma/client";

const NAV = [
  { href: "/dashboard", label: "Panel" },
  { href: "/alumnos", label: "Alumnos" },
  { href: "/cursos", label: "Cursos" },
  { href: "/admin", label: "Administración", adminOnly: true },
];

interface NavLinksProps {
  role?: Role;
}

export function NavLinks({ role }: NavLinksProps) {
  const pathname = usePathname();
  const visibleNav = NAV.filter(item => !item.adminOnly || role === "ADMIN");

  return (
    <nav className="flex items-center gap-1">
      {visibleNav.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-marker" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
