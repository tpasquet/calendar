"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { enablePushNotifications, disablePushNotifications } from "@/lib/push-client";

export default function SettingsPage() {
  const t = useTranslations("nav");
  const [status, setStatus] = useState<"idle" | "enabled" | "disabled" | "error">("idle");

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">{t("settings")}</h1>

      <div className="space-y-2">
        <p className="text-sm text-zinc-500">
          Recevoir une notification sur cet appareil pour les événements à venir.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => setStatus((await enablePushNotifications()) ? "enabled" : "error")}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Activer les notifications
          </button>
          <button
            type="button"
            onClick={async () => {
              await disablePushNotifications();
              setStatus("disabled");
            }}
            className="rounded-md border border-black/20 dark:border-white/20 px-3 py-2 text-sm"
          >
            Désactiver
          </button>
        </div>
        {status === "enabled" && <p className="text-sm text-green-600">Notifications activées ✓</p>}
        {status === "disabled" && <p className="text-sm text-zinc-500">Notifications désactivées</p>}
        {status === "error" && (
          <p className="text-sm text-red-500">Impossible d&apos;activer les notifications</p>
        )}
      </div>
    </main>
  );
}
