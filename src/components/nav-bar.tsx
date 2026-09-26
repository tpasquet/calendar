"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MobileSidebar } from "@/components/mobile-sidebar";

export function NavBar() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label={t("openMenu")}
          onClick={() => setMenuOpen(true)}
          className="rounded-md border border-black/20 px-2 py-1 text-lg md:hidden dark:border-white/20"
        >
          ☰
        </button>
        <div className="font-semibold">Calendrier</div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="hidden items-center gap-3 md:flex">
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="hover:underline">
          {t("logout")}
        </button>
        </div>
      </div>
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
