import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export type SettingsGroup = "notifications" | "privacy" | "appearance" | "app";

export const DEFAULT_SETTINGS = {
  notifications: {
    streak: true, matches: true, rewards: true, chat: true, system: true,
  } as Record<string, boolean>,
  privacy: {
    profile_public: true, stats_public: true, activity_public: true, discoverable: true,
  } as Record<string, boolean>,
  appearance: {
    theme: "zeox_dark", animations: true, glow: "medium",
  } as Record<string, string | boolean>,
  app: {
    language: "en", sound: true, vibration: true, data_saver: false,
  } as Record<string, string | boolean>,
};

export type UserSettings = typeof DEFAULT_SETTINGS;

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
    if (data) {
      setSettings({
        notifications: { ...DEFAULT_SETTINGS.notifications, ...(data.notifications ?? {}) },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...(data.privacy ?? {}) },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...(data.appearance ?? {}) },
        app: { ...DEFAULT_SETTINGS.app, ...(data.app ?? {}) },
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = async (group: SettingsGroup, key: string, value: string | boolean) => {
    if (!user) return;
    const nextGroup = { ...(settings as any)[group], [key]: value };
    setSettings((s) => ({ ...s, [group]: nextGroup }));
    await db.from("user_settings").upsert(
      { user_id: user.id, [group]: nextGroup },
      { onConflict: "user_id" },
    );
  };

  return { settings, update, loading };
};
