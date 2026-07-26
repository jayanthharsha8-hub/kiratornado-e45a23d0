import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

type HomeBanner = { id: string; image_url: string | null; title: string; subtitle: string; button_text: string | null; button_link: string | null; sort_order: number; active: boolean };
type CategoryCardImage = { id: string; category: Category; card_image_url: string | null; title: string | null; subtitle: string | null; event_label: string | null };
type TournamentBanner = { id: string; tournament_id: string; banner_image_url: string | null };
type TournamentPageBanner = { id: string; category: Category; banner_image_url: string | null };
type TournamentRow = { id: string; title: string; category: Category; scheduled_at: string };
type HomeOffer = { id: string; title: string; subtitle: string; badge_label: string | null; image_url: string | null; link: string | null; sort_order: number; active: boolean };
type HomePopup = { id: string; title: string; subtitle: string; image_url: string | null; button_text: string | null; link: string | null; sort_order: number; active: boolean };

const CATEGORIES: Category[] = Object.keys(CATEGORY_META) as Category[];
const db = supabase as any;


const uploadBannerImage = async (file: File, folder: string) => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("app-banners").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from("app-banners").getPublicUrl(path).data.publicUrl;
};

export default function AdminBanners() {
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<Category, string | null>>({ free_match: null, battle_royale: null, classic_squad: null, lone_wolf: null, custom_rooms: null, weekly_rankings: null });
  const [tournamentBanners, setTournamentBanners] = useState<Record<string, string | null>>({});
  const [pageBanners, setPageBanners] = useState<Record<Category, string | null>>({ free_match: null, battle_royale: null, classic_squad: null, lone_wolf: null, custom_rooms: null, weekly_rankings: null });
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [homeForm, setHomeForm] = useState({ title: "", subtitle: "", button_text: "", sort_order: 0 });
  const [selectedTournament, setSelectedTournament] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedTournamentName = useMemo(() => tournaments.find((t) => t.id === selectedTournament)?.title ?? "Select Tournament", [selectedTournament, tournaments]);

  const load = async () => {
    const [home, cards, banners, pageBannerRows, tours] = await Promise.all([
      db.from("home_banners").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      db.from("category_card_images").select("*"),
      db.from("tournament_banners").select("*"),
      db.from("tournament_page_banners").select("*"),
      supabase.from("tournaments").select("id,title,category,scheduled_at").order("scheduled_at", { ascending: false }),
    ]);
    setHomeBanners((home.data ?? []) as HomeBanner[]);
    const cardMap = CATEGORIES.reduce((acc, c) => { acc[c] = null; return acc; }, {} as Record<Category, string | null>);
    ((cards.data ?? []) as CategoryCardImage[]).forEach((row) => { cardMap[row.category] = row.card_image_url; });
    setCategoryImages(cardMap);
    const tournamentMap: Record<string, string | null> = {};
    ((banners.data ?? []) as TournamentBanner[]).forEach((row) => { tournamentMap[row.tournament_id] = row.banner_image_url; });
    setTournamentBanners(tournamentMap);
    const pageMap = CATEGORIES.reduce((acc, c) => { acc[c] = null; return acc; }, {} as Record<Category, string | null>);
    ((pageBannerRows.data ?? []) as TournamentPageBanner[]).forEach((row) => { pageMap[row.category] = row.banner_image_url; });
    setPageBanners(pageMap);
    setTournaments(((tours.data ?? []) as TournamentRow[]));
  };

  useEffect(() => { load(); }, []);

  const createHomeBanners = async (files: FileList | null) => {
    if (!files?.length) { toast.error("Select at least one banner image"); return; }
    setSaving(true);
    try {
      for (const file of Array.from(files)) {
        const image_url = await uploadBannerImage(file, "home");
        const { error } = await db.from("home_banners").insert({ image_url, ...homeForm, button_text: homeForm.button_text || null });
        if (error) throw error;
      }
      toast.success("Home banners added");
      setHomeForm({ title: "", subtitle: "", button_text: "", sort_order: 0 });
      await load();
    } catch (error: any) { toast.error(error.message || "Upload failed"); }
    setSaving(false);
  };

  const updateHomeBanner = async (banner: HomeBanner) => {
    const { error } = await db.from("home_banners").update({ title: banner.title, subtitle: banner.subtitle, button_text: banner.button_text || null, sort_order: banner.sort_order, active: banner.active }).eq("id", banner.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Home banner saved"); load();
  };

  const deleteHomeBanner = async (id: string) => {
    if (!confirm("Delete this home banner?")) return;
    const { error } = await db.from("home_banners").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Home banner deleted"); load();
  };

  const saveCategoryImage = async (category: Category, file: File | undefined) => {
    if (!file) { toast.error("Select a square card image"); return; }
    setSaving(true);
    try {
      const card_image_url = await uploadBannerImage(file, "category-cards");
      const { error } = await db.from("category_card_images").upsert({ category, card_image_url }, { onConflict: "category" });
      if (error) throw error;
      toast.success("Category card image saved");
      await load();
    } catch (error: any) { toast.error(error.message || "Upload failed"); }
    setSaving(false);
  };

  const saveTournamentBanner = async (file: File | undefined) => {
    if (!selectedTournament) { toast.error("Select a tournament"); return; }
    if (!file) { toast.error("Select a tournament banner image"); return; }
    setSaving(true);
    try {
      const banner_image_url = await uploadBannerImage(file, "tournaments");
      const { error } = await db.from("tournament_banners").upsert({ tournament_id: selectedTournament, banner_image_url }, { onConflict: "tournament_id" });
      if (error) throw error;
      toast.success("Tournament banner saved");
      await load();
    } catch (error: any) { toast.error(error.message || "Upload failed"); }
    setSaving(false);
  };

  const saveTournamentPageBanner = async (category: Category, file: File | undefined) => {
    if (!file) { toast.error("Select a category page banner image"); return; }
    setSaving(true);
    try {
      const banner_image_url = await uploadBannerImage(file, "tournament-page-banners");
      const { error } = await db.from("tournament_page_banners").upsert({ category, banner_image_url }, { onConflict: "category" });
      if (error) throw error;
      toast.success("Tournament page banner saved");
      await load();
    } catch (error: any) { toast.error(error.message || "Upload failed"); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Banner Management</h1>
        <p className="text-xs text-muted-foreground">Separate image systems for home slider, category cards, tournament details, and category pages</p>
      </div>

      <SystemPanel title="Manage Home Banners">
        <div className="grid gap-3 md:grid-cols-5">
          <Input placeholder="Title" value={homeForm.title} onChange={(e) => setHomeForm((p) => ({ ...p, title: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Subtitle" value={homeForm.subtitle} onChange={(e) => setHomeForm((p) => ({ ...p, subtitle: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Button text optional" value={homeForm.button_text} onChange={(e) => setHomeForm((p) => ({ ...p, button_text: e.target.value }))} className="border-primary/30 bg-card" />
          <Input type="number" value={homeForm.sort_order} onChange={(e) => setHomeForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} className="border-primary/30 bg-card" />
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-sm border border-primary/50 bg-primary text-xs font-display font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
            <ImagePlus className="h-4 w-4" /> Upload
            <input type="file" accept="image/*" multiple className="hidden" disabled={saving} onChange={(e) => createHomeBanners(e.target.files)} />
          </label>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Preview</TableHead><TableHead>Title</TableHead><TableHead>Subtitle</TableHead><TableHead>Button</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {homeBanners.map((banner, index) => (
                <TableRow key={banner.id}>
                  <TableCell>{banner.image_url ? <img src={banner.image_url} alt={banner.title || "Home banner"} className="h-12 w-28 object-cover" /> : <span className="text-xs text-muted-foreground">No Banner</span>}</TableCell>
                  <TableCell><Input value={banner.title} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, title: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={banner.subtitle} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, subtitle: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={banner.button_text ?? ""} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, button_text: e.target.value } : r))} /></TableCell>
                  <TableCell><Input type="number" value={banner.sort_order} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, sort_order: Number(e.target.value) } : r))} className="w-20" /></TableCell>
                  <TableCell><input type="checkbox" checked={banner.active} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, active: e.target.checked } : r))} /></TableCell>
                  <TableCell><div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => updateHomeBanner(banner)}><Save /></Button><Button size="icon" variant="destructive" onClick={() => deleteHomeBanner(banner.id)}><Trash2 /></Button></div></TableCell>
                </TableRow>
              ))}
              {homeBanners.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No Banner</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>

      <SystemPanel title="Manage Category Cards">
        <div className="grid gap-3 md:grid-cols-2">
          {CATEGORIES.map((category) => (
            <div key={category} className="rounded border border-primary/25 bg-card/40 p-3">
              <div className="mb-3 flex items-center gap-3">
                {categoryImages[category] ? <img src={categoryImages[category]!} alt={CATEGORY_META[category].title} className="h-16 w-16 object-cover" /> : <div className="flex h-16 w-16 items-center justify-center border border-primary/25 text-[10px] text-muted-foreground">No Banner</div>}
                <div><h3 className="font-display text-sm uppercase tracking-widest text-primary">{CATEGORY_META[category].title}</h3><p className="text-[10px] text-muted-foreground">Square card image only</p></div>
              </div>
              <Input type="file" accept="image/*" disabled={saving} onChange={(e) => saveCategoryImage(category, e.target.files?.[0])} className="border-primary/30 bg-card" />
            </div>
          ))}
        </div>
      </SystemPanel>

      <SystemPanel title="Tournament Page Banners">
        <div className="grid gap-3 md:grid-cols-2">
          {CATEGORIES.map((category) => (
            <div key={category} className="rounded border border-primary/25 bg-card/40 p-3">
              <div className="mb-3 flex items-center gap-3">
                {pageBanners[category] ? <img src={pageBanners[category]!} alt={`${CATEGORY_META[category].title} page banner`} className="h-16 w-36 object-cover" /> : <div className="flex h-16 w-36 items-center justify-center border border-primary/25 text-[10px] text-muted-foreground">No Banner</div>}
                <div><h3 className="font-display text-sm uppercase tracking-widest text-primary">{CATEGORY_META[category].title}</h3><p className="text-[10px] text-muted-foreground">Category page top banner 16:6</p></div>
              </div>
              <Input type="file" accept="image/*" disabled={saving} onChange={(e) => saveTournamentPageBanner(category, e.target.files?.[0])} className="border-primary/30 bg-card" />
            </div>
          ))}
        </div>
      </SystemPanel>

      <SystemPanel title="Manage Tournament Banners">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Tournament</Label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="border-primary/30 bg-card"><SelectValue placeholder={selectedTournamentName} /></SelectTrigger>
              <SelectContent>{tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Banner Image 16:6</Label>
            <Input type="file" accept="image/*" disabled={saving} onChange={(e) => saveTournamentBanner(e.target.files?.[0])} className="border-primary/30 bg-card" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded border border-primary/20 bg-card/30 p-2">
              {tournamentBanners[t.id] ? <img src={tournamentBanners[t.id]!} alt={t.title} className="h-14 w-32 object-cover" /> : <div className="flex h-14 w-32 items-center justify-center border border-primary/20 text-[10px] text-muted-foreground">No Banner</div>}
              <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{t.title}</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{CATEGORY_META[t.category]?.title}</p></div>
            </div>
          ))}
          {tournaments.length === 0 && <p className="text-sm text-muted-foreground">No tournaments found</p>}
        </div>
      </SystemPanel>
    </div>
  );
}