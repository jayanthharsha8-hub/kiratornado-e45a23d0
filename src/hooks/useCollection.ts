import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  COSMETICS, CosmeticSlot, DEFAULT_EQUIPPED, EquippedCosmetics, isUnlocked, TOTAL_COSMETICS,
} from "@/lib/cosmetics";
import { toast } from "sonner";

const db = supabase as any;

export const useCollection = () => {
  const { user } = useAuth();
  const [unlockKeys, setUnlockKeys] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [equipped, setEquipped] = useState<EquippedCosmetics>(DEFAULT_EQUIPPED);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: unlocks }, { data: profile }] = await Promise.all([
      db.from("user_unlocks").select("unlock_key,expires_at").eq("user_id", user.id),
      db.from("profiles").select("player_level,cosmetics").eq("id", user.id).maybeSingle(),
    ]);
    const now = Date.now();
    setUnlockKeys(
      ((unlocks ?? []) as any[])
        .filter((u) => !u.expires_at || new Date(u.expires_at).getTime() > now)
        .map((u) => u.unlock_key as string),
    );
    setLevel(profile?.player_level ?? 1);
    setEquipped({ ...DEFAULT_EQUIPPED, ...((profile?.cosmetics ?? {}) as EquippedCosmetics) });
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const ownedCount = COSMETICS.filter((c) => isUnlocked(c, unlockKeys, level)).length;

  const equip = async (slot: CosmeticSlot, itemId: string) => {
    if (!user) return;
    const next = { ...equipped, [slot]: itemId };
    setEquipped(next);
    const { error } = await db.from("profiles").update({ cosmetics: next }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Equipped");
  };

  return { unlockKeys, level, equipped, equip, loading, ownedCount, total: TOTAL_COSMETICS, reload: load };
};
