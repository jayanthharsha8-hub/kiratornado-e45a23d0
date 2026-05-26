import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Avatar = { id: string; image_url: string; label: string | null; sort_order: number; active: boolean };
const db = supabase as any;

const BUCKET = "profile-avatars";

export default function AdminAvatars() {
  const [items, setItems] = useState<Avatar[]>([]);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await db.from("profile_avatars").select("*").order("sort_order").order("created_at", { ascending: false });
    setItems((data ?? []) as Avatar[]);
  };

  useEffect(() => { load(); }, []);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setSaving(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "png";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const { error } = await db.from("profile_avatars").insert({ image_url, label: label || null });
        if (error) throw error;
      }
      toast.success("Avatar(s) added");
      setLabel("");
      await load();
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    setSaving(false);
  };

  const toggleActive = async (a: Avatar) => {
    const { error } = await db.from("profile_avatars").update({ active: !a.active }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const remove = async (a: Avatar) => {
    if (!confirm("Delete this avatar?")) return;
    const { error } = await db.from("profile_avatars").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    // best-effort delete from storage
    try {
      const path = a.image_url.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    } catch {}
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Profile Pictures</h1>
        <p className="text-xs text-muted-foreground">Curated avatars players can choose from. No external uploads.</p>
      </div>

      <SystemPanel title="Upload Avatars">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input placeholder="Optional label (e.g. Hunter S)" value={label} onChange={(e) => setLabel(e.target.value)} className="border-primary/30 bg-card" />
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-sm border border-primary/50 bg-primary px-4 text-xs font-display font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
            <ImagePlus className="h-4 w-4" /> Upload
            <input type="file" accept="image/*" multiple className="hidden" disabled={saving} onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
      </SystemPanel>

      <SystemPanel title={`Gallery (${items.length})`}>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No avatars yet. Upload some above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((a) => (
              <div key={a.id} className={`rounded border p-2 ${a.active ? "border-primary/40 bg-card/50" : "border-muted bg-card/20 opacity-60"}`}>
                <img src={a.image_url} alt={a.label ?? "avatar"} className="aspect-square w-full rounded object-cover" loading="lazy" />
                <div className="mt-2 truncate text-[10px] uppercase tracking-widest text-muted-foreground">{a.label || "—"}</div>
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 text-[10px]" onClick={() => toggleActive(a)}>
                    {a.active ? "Hide" : "Show"}
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => remove(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SystemPanel>
    </div>
  );
}
