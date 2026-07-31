import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Check, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

type Pack = {
  id: string; name: string; coins: number; bonus_coins: number; price: number;
  banner_url: string | null; badge: string | null; description: string | null;
  pack_type: string; sort_order: number; active: boolean;
};
type Offer = {
  id: string; title: string; subtitle: string | null; coins: number; bonus_coins: number; price: number;
  banner_url: string | null; offer_type: string; expires_at: string | null; sort_order: number; active: boolean;
};
type Settings = {
  id: string; upi_id: string; qr_image_url: string | null; manual_entry_enabled: boolean;
  min_deposit_coins: number; coin_rate: number;
};
type Order = {
  id: string; user_id: string; item_name: string; coins: number; bonus_coins: number;
  price: number; upi_ref: string | null; status: string; created_at: string;
};

const uploadBanner = async (file: File, folder: string) => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("app-banners").upload(path, file, { cacheControl: "3600" });
  if (error) throw error;
  return supabase.storage.from("app-banners").getPublicUrl(path).data.publicUrl;
};

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export default function CoinStoreAdmin() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: p }, { data: o }, { data: r }, { data: st }] = await Promise.all([
      db.from("coin_packs").select("*").order("sort_order", { ascending: true }),
      db.from("coin_offers").select("*").order("sort_order", { ascending: true }),
      db.from("coin_orders").select("*").order("created_at", { ascending: false }).limit(50),
      db.from("store_settings").select("*").limit(1).maybeSingle(),
    ]);
    setPacks(p ?? []); setOffers(o ?? []); setOrders(r ?? []); setSettings(st ?? null);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ---------- settings ---------- */
  const patchSettings = (patch: Partial<Settings>) =>
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

  const saveSettings = async () => {
    if (!settings) return;
    const { id, ...rest } = settings;
    const { error } = await db.from("store_settings").update(rest).eq("id", id);
    error ? toast.error(error.message) : toast.success("Store settings saved");
  };

  /* ---------- packs ---------- */
  const patchPack = (id: string, patch: Partial<Pack>) =>
    setPacks((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const savePack = async (pack: Pack) => {
    const { id, ...rest } = pack;
    const { error } = await db.from("coin_packs").update(rest).eq("id", id);
    error ? toast.error(error.message) : toast.success("Pack saved");
  };

  const addPack = async () => {
    const { error } = await db.from("coin_packs").insert({
      name: "New Pack", coins: 100, bonus_coins: 0, price: 100, sort_order: packs.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Pack created"); load();
  };

  const deletePack = async (id: string) => {
    const { error } = await db.from("coin_packs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pack deleted"); load();
  };

  const persistOrder = async (list: Pack[]) => {
    setPacks(list);
    await Promise.all(list.map((p, i) => db.from("coin_packs").update({ sort_order: i + 1 }).eq("id", p.id)));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = packs.findIndex((p) => p.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= packs.length) return;
    const list = [...packs];
    [list[idx], list[next]] = [list[next], list[idx]];
    persistOrder(list);
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = packs.findIndex((p) => p.id === dragId);
    const to = packs.findIndex((p) => p.id === targetId);
    const list = [...packs];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDragId(null);
    persistOrder(list);
  };

  /* ---------- offers ---------- */
  const patchOffer = (id: string, patch: Partial<Offer>) =>
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const saveOffer = async (offer: Offer) => {
    const { id, ...rest } = offer;
    const { error } = await db.from("coin_offers").update(rest).eq("id", id);
    error ? toast.error(error.message) : toast.success("Offer saved");
  };

  const addOffer = async () => {
    const { error } = await db.from("coin_offers").insert({
      title: "Weekend Offer", subtitle: "Limited time", coins: 100, bonus_coins: 25, price: 100,
      expires_at: new Date(Date.now() + 86400000).toISOString(), sort_order: offers.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Offer created"); load();
  };

  const deleteOffer = async (id: string) => {
    const { error } = await db.from("coin_offers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Offer deleted"); load();
  };

  /* ---------- orders ---------- */
  const handleOrder = async (id: string, status: "approved" | "rejected") => {
    const { error } = await db.rpc("admin_handle_coin_order", { _order_id: id, _status: status });
    if (error) return toast.error(error.message);
    toast.success(`Order ${status}`); load();
  };

  const pickImage = (onDone: (url: string) => void, folder: string) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try { onDone(await uploadBanner(file, folder)); toast.success("Image uploaded — remember to save"); }
      catch (e: any) { toast.error(e.message); }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <SystemPanel title="Store Settings" right={<Button size="sm" onClick={saveSettings}><Save className="mr-1 h-3 w-3" /> Save</Button>}>
        {!settings ? (
          <p className="text-xs text-muted-foreground">Loading settings…</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="text-[10px] uppercase tracking-widest">UPI ID</Label>
              <Input value={settings.upi_id} onChange={(e) => patchSettings({ upi_id: e.target.value })} />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest">Min Deposit (coins)</Label>
              <Input type="number" value={settings.min_deposit_coins} onChange={(e) => patchSettings({ min_deposit_coins: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest">Rate (₹ per coin)</Label>
              <Input type="number" step="0.1" value={settings.coin_rate} onChange={(e) => patchSettings({ coin_rate: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[10px] uppercase tracking-widest">Payment QR Image (optional)</Label>
              <div className="flex items-center gap-2">
                {settings.qr_image_url && <img src={settings.qr_image_url} alt="Payment QR" className="h-12 w-12 rounded object-cover" />}
                <Button size="sm" variant="outline" onClick={() => pickImage((url) => patchSettings({ qr_image_url: url }), "store-qr")}>
                  <ImagePlus className="mr-1 h-3 w-3" /> Upload
                </Button>
                {settings.qr_image_url && (
                  <Button size="sm" variant="ghost" onClick={() => patchSettings({ qr_image_url: null })}><X className="h-3 w-3" /></Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                checked={settings.manual_entry_enabled}
                onCheckedChange={(v) => { patchSettings({ manual_entry_enabled: v }); db.from("store_settings").update({ manual_entry_enabled: v }).eq("id", settings.id); }}
              />
              <span className="text-xs text-muted-foreground">Manual coin entry {settings.manual_entry_enabled ? "enabled" : "disabled"}</span>
            </div>
          </div>
        )}
      </SystemPanel>

      <SystemPanel title="Coin Packs" right={<Button size="sm" onClick={addPack}><Plus className="mr-1 h-3 w-3" /> New Pack</Button>}>
        <p className="mb-3 text-xs text-muted-foreground">Drag cards to reorder — the store updates instantly for players.</p>
        <div className="space-y-3">
          {packs.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(p.id)}
              className="rounded-lg border border-primary/25 bg-background/40 p-3"
            >
              <div className="grid gap-2 md:grid-cols-6">
                <div className="md:col-span-2">
                  <Label className="text-[10px] uppercase tracking-widest">Pack Name</Label>
                  <Input value={p.name} onChange={(e) => patchPack(p.id, { name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest">Coins</Label>
                  <Input type="number" value={p.coins} onChange={(e) => patchPack(p.id, { coins: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest">Bonus</Label>
                  <Input type="number" value={p.bonus_coins} onChange={(e) => patchPack(p.id, { bonus_coins: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest">Price ₹</Label>
                  <Input type="number" value={p.price} onChange={(e) => patchPack(p.id, { price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest">Badge</Label>
                  <Select value={p.badge ?? "none"} onValueChange={(v) => patchPack(p.id, { badge: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No badge</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="best_value">Best Value</SelectItem>
                      <SelectItem value="monarch">Monarch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-[10px] uppercase tracking-widest">Description</Label>
                  <Input value={p.description ?? ""} onChange={(e) => patchPack(p.id, { description: e.target.value })} placeholder="Optional tagline" />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-[10px] uppercase tracking-widest">Banner</Label>
                  <div className="flex items-center gap-2">
                    {p.banner_url && <img src={p.banner_url} alt="" className="h-9 w-16 rounded object-cover" />}
                    <Button size="sm" variant="outline" onClick={() => pickImage((url) => patchPack(p.id, { banner_url: url }), "coin-packs")}>
                      <ImagePlus className="mr-1 h-3 w-3" /> Upload
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={p.active} onCheckedChange={(v) => { patchPack(p.id, { active: v }); db.from("coin_packs").update({ active: v }).eq("id", p.id); }} />
                  <span className="text-xs text-muted-foreground">{p.active ? "Enabled" : "Disabled"}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => move(p.id, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => move(p.id, 1)} disabled={i === packs.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="sm" onClick={() => savePack(p)}><Save className="mr-1 h-3 w-3" /> Save</Button>
                <Button size="sm" variant="destructive" onClick={() => deletePack(p.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SystemPanel>

      <SystemPanel title="Limited Offers" right={<Button size="sm" onClick={addOffer}><Plus className="mr-1 h-3 w-3" /> New Offer</Button>}>
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-lg border border-primary/25 bg-background/40 p-3">
              <div className="grid gap-2 md:grid-cols-6">
                <div className="md:col-span-2">
                  <Label className="text-[10px] uppercase tracking-widest">Title</Label>
                  <Input value={o.title} onChange={(e) => patchOffer(o.id, { title: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[10px] uppercase tracking-widest">Subtitle</Label>
                  <Input value={o.subtitle ?? ""} onChange={(e) => patchOffer(o.id, { subtitle: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest">Coins</Label>
                  <Input type="number" value={o.coins} onChange={(e) => patchOffer(o.id, { coins: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest">Bonus</Label>
                  <Input type="number" value={o.bonus_coins} onChange={(e) => patchOffer(o.id, { bonus_coins: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest">Price ₹</Label>
                  <Input type="number" value={o.price} onChange={(e) => patchOffer(o.id, { price: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[10px] uppercase tracking-widest">Expires At</Label>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(o.expires_at)}
                    onChange={(e) => patchOffer(o.id, { expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-[10px] uppercase tracking-widest">Banner</Label>
                  <div className="flex items-center gap-2">
                    {o.banner_url && <img src={o.banner_url} alt="" className="h-9 w-16 rounded object-cover" />}
                    <Button size="sm" variant="outline" onClick={() => pickImage((url) => patchOffer(o.id, { banner_url: url }), "coin-offers")}>
                      <ImagePlus className="mr-1 h-3 w-3" /> Upload
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={o.active} onCheckedChange={(v) => { patchOffer(o.id, { active: v }); db.from("coin_offers").update({ active: v }).eq("id", o.id); }} />
                  <span className="text-xs text-muted-foreground">{o.active ? "Enabled" : "Disabled"}</span>
                </div>
                <Button size="sm" onClick={() => saveOffer(o)}><Save className="mr-1 h-3 w-3" /> Save</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteOffer(o.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
          {offers.length === 0 && <p className="text-xs text-muted-foreground">No limited offers yet.</p>}
        </div>
      </SystemPanel>

      <SystemPanel title="Purchase Orders">
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-background/40 p-3">
              <div className="text-xs">
                <p className="font-semibold text-foreground">{o.item_name} — ₹{o.price}</p>
                <p className="text-muted-foreground">
                  {o.coins} + {o.bonus_coins} bonus · Ref: {o.upi_ref || "—"} · {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              {o.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleOrder(o.id, "approved")}><Check className="mr-1 h-3 w-3" /> Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleOrder(o.id, "rejected")}><X className="mr-1 h-3 w-3" /> Reject</Button>
                </div>
              ) : (
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{o.status}</span>
              )}
            </div>
          ))}
          {orders.length === 0 && <p className="text-xs text-muted-foreground">No orders yet.</p>}
        </div>
      </SystemPanel>
    </div>
  );
}
