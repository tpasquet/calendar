"use client";

import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function NavBar() {
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes needs a client-only mount check to avoid hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <header className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-4 py-3">
      <div className="font-semibold">
        AT Calendar
        {session?.user?.name && (
          <span className="ml-2 text-sm font-normal text-zinc-500">— {session.user.name}</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <a href="/settings" className="hover:underline">
          {t("settings")}
        </a>
        <a href="/api/calendar.ics" className="hover:underline">
          {t("exportIcs")}
        </a>
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-md border border-black/20 dark:border-white/20 px-2 py-1"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        )}
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="hover:underline">
          {t("logout")}
        </button>
      </div>
    </header>
  );
}
