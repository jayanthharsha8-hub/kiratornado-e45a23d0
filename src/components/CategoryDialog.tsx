import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Coins, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface T {
  id: string; title: string; entry_fee: number; total_slots: number; joined_players_count: number; scheduled_at: string;
}

export const CategoryDialog = ({ category, onOpenChange }: { category: Category | null; onOpenChange: (open: boolean) => void; }) => {
  const [items, setItems] = useState<T[] | null>(null);
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!category) { setItems(null); setIdx(0); return; }
    supabase.from("tournaments").select("id,title,entry_fee,total_slots,joined_players_count,scheduled_at").eq("category", category).order("scheduled_at")
      .then(({ data }) => setItems((data ?? []) as T[]));
  }, [category]);

  useEffect(() => {
    if (!category) return;
    const channel = supabase
      .channel(`category-dialog-tournaments-${category}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tournaments" },
        (payload: any) => {
          if (payload.new?.category !== category) return;
          setItems((current) => current?.map((item) => item.id === payload.new.id ? { ...item, ...payload.new } : item) ?? current);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [category]);

  const meta = category ? CATEGORY_META[category] : null;
  const t = items?.[idx];

  return (
    <Dialog open={!!category} onOpenChange={onOpenChange}>
      <DialogContent className="panel max-w-md border-primary/60 bg-popover p-5">
        {meta && (
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-[0.25em] text-primary text-glow">
              [ {meta.title} ]
            </DialogTitle>
            <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
          </DialogHeader>
        )}

        <div className="mt-2 rounded border border-primary/30 bg-card/40 p-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary/80">Rules</div>
          <ul className="mt-1 space-y-0.5 text-sm text-foreground/90">
            {meta?.rules.map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-primary/80">
            <span>Tournament</span>
            {items && items.length > 0 && <span>{idx + 1} / {items.length}</span>}
          </div>

          {!items && <Skeleton className="h-32 w-full" />}
          {items && items.length === 0 && (
            <div className="rounded border border-primary/30 bg-card/40 p-4 text-center text-sm text-muted-foreground">
              No tournaments scheduled. Check back soon.
            </div>
          )}
          {t && (
            <button
              onClick={() => { onOpenChange(false); navigate(`/tournament/${t.id}`); }}
              className="block w-full text-left animate-scale-in rounded border border-primary/50 bg-gradient-to-br from-card to-background p-4 transition hover:border-primary hover:glow-soft"
            >
              <div className="font-display text-base text-primary text-glow">{t.title}</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-foreground/80">
                <Stat icon={<Coins className="h-3 w-3" />} v={t.entry_fee === 0 ? "FREE" : `${t.entry_fee} ⟁`} />
                <Stat icon={<Users className="h-3 w-3" />} v={t.joined_players_count >= t.total_slots ? "● FULL" : `${t.joined_players_count}/${t.total_slots}`} />
                <Stat icon={<Calendar className="h-3 w-3" />} v={new Date(t.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
              </div>
              <div className="mt-3 text-right text-[10px] uppercase tracking-widest text-primary">Tap to view →</div>
            </button>
          )}

          {items && items.length > 1 && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 rounded border border-primary/40 py-2 text-xs uppercase tracking-widest text-primary disabled:opacity-30 hover:bg-primary/10">← Prev</button>
              <button onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))} disabled={idx === items.length - 1} className="flex-1 rounded border border-primary/40 py-2 text-xs uppercase tracking-widest text-primary disabled:opacity-30 hover:bg-primary/10">Next →</button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Stat = ({ icon, v }: { icon: React.ReactNode; v: string }) => (
  <div className="flex items-center gap-1 rounded border border-primary/20 bg-background/40 px-2 py-1">
    <span className="text-primary">{icon}</span><span>{v}</span>
  </div>
);
