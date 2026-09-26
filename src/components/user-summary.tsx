"use client";

import { useSession } from "next-auth/react";

export function UserSummary() {
  const { data: session } = useSession();
  const displayName = session?.user?.name || session?.user?.email || "";
  const firstName = displayName.trim().split(/\s+/)[0] || "?";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
        {initial}
      </span>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-medium">{displayName}</div>
        {session?.user?.email && <div className="truncate text-xs text-zinc-500">{session.user.email}</div>}
      </div>
    </div>
  );
}
