import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check } from "lucide-react";

type Avatar = { id: string; image_url: string; label: string | null };
const db = supabase as any;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  currentUrl: string | null;
  onPicked: (url: string) => void;
}

export const AvatarPickerDialog = ({ open, onOpenChange, userId, currentUrl, onPicked }: Props) => {
  const [items, setItems] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    db.from("profile_avatars")
      .select("id,image_url,label")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }: any) => {
        setItems((data ?? []) as Avatar[]);
        setLoading(false);
      });
  }, [open]);

  const pick = async (a: Avatar) => {
    setSaving(a.id);
    const { error } = await supabase.from("profiles").update({ avatar_url: a.image_url }).eq("id", userId);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Avatar updated");
    onPicked(a.image_url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-primary/40 bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-widest text-primary text-glow-soft">Choose Avatar</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-xs uppercase tracking-widest text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No avatars available yet.</div>
        ) : (
          <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto pr-1">
            {items.map((a) => {
              const active = currentUrl === a.image_url;
              return (
                <button
                  key={a.id}
                  onClick={() => pick(a)}
                  disabled={saving !== null}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${active ? "border-primary glow-soft" : "border-primary/30 hover:border-primary/70"}`}
                >
                  <img src={a.image_url} alt={a.label ?? "avatar"} className="h-full w-full object-cover" loading="lazy" />
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center bg-primary/30">
                      <Check className="h-6 w-6 text-primary-foreground drop-shadow" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
