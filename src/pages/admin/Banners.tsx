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
  const [categoryText, setCategoryText] = useState<Record<Category, { title: string; subtitle: string; event_label: string }>>({
    free_match: { title: "", subtitle: "", event_label: "" },
    battle_royale: { title: "", subtitle: "", event_label: "" },
    classic_squad: { title: "", subtitle: "", event_label: "" },
    lone_wolf: { title: "", subtitle: "", event_label: "" },
    custom_rooms: { title: "", subtitle: "", event_label: "" },
    weekly_rankings: { title: "", subtitle: "", event_label: "" },
  });
  const [tournamentBanners, setTournamentBanners] = useState<Record<string, string | null>>({});
  const [pageBanners, setPageBanners] = useState<Record<Category, string | null>>({ free_match: null, battle_royale: null, classic_squad: null, lone_wolf: null, custom_rooms: null, weekly_rankings: null });
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [homeForm, setHomeForm] = useState({ title: "", subtitle: "", button_text: "", button_link: "", sort_order: 0 });
  const [offers, setOffers] = useState<HomeOffer[]>([]);
  const [popups, setPopups] = useState<HomePopup[]>([]);
  const [offerForm, setOfferForm] = useState({ title: "", subtitle: "", badge_label: "", link: "", sort_order: 0 });
  const [popupForm, setPopupForm] = useState({ title: "", subtitle: "", button_text: "", link: "", sort_order: 0 });
  const [selectedTournament, setSelectedTournament] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedTournamentName = useMemo(() => tournaments.find((t) => t.id === selectedTournament)?.title ?? "Select Tournament", [selectedTournament, tournaments]);

  const load = async () => {
    const [home, cards, banners, pageBannerRows, tours, offerRows, popupRows] = await Promise.all([
      db.from("home_banners").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      db.from("category_card_images").select("*"),
      db.from("tournament_banners").select("*"),
      db.from("tournament_page_banners").select("*"),
      supabase.from("tournaments").select("id,title,category,scheduled_at").order("scheduled_at", { ascending: false }),
      db.from("home_offers").select("*").order("sort_order", { ascending: true }),
      db.from("home_popups").select("*").order("sort_order", { ascending: true }),
    ]);
    setHomeBanners((home.data ?? []) as HomeBanner[]);
    const cardMap = CATEGORIES.reduce((acc, c) => { acc[c] = null; return acc; }, {} as Record<Category, string | null>);
    const textMap = CATEGORIES.reduce((acc, c) => { acc[c] = { title: "", subtitle: "", event_label: "" }; return acc; }, {} as Record<Category, { title: string; subtitle: string; event_label: string }>);
    ((cards.data ?? []) as CategoryCardImage[]).forEach((row) => {
      cardMap[row.category] = row.card_image_url;
      textMap[row.category] = { title: row.title ?? "", subtitle: row.subtitle ?? "", event_label: row.event_label ?? "" };
    });
    setCategoryImages(cardMap);
    setCategoryText(textMap);
    const tournamentMap: Record<string, string | null> = {};
    ((banners.data ?? []) as TournamentBanner[]).forEach((row) => { tournamentMap[row.tournament_id] = row.banner_image_url; });
    setTournamentBanners(tournamentMap);
    const pageMap = CATEGORIES.reduce((acc, c) => { acc[c] = null; return acc; }, {} as Record<Category, string | null>);
    ((pageBannerRows.data ?? []) as TournamentPageBanner[]).forEach((row) => { pageMap[row.category] = row.banner_image_url; });
    setPageBanners(pageMap);
    setTournaments(((tours.data ?? []) as TournamentRow[]));
    setOffers((offerRows.data ?? []) as HomeOffer[]);
    setPopups((popupRows.data ?? []) as HomePopup[]);
  };


  useEffect(() => { load(); }, []);

  const createHomeBanners = async (files: FileList | null) => {
    if (!files?.length) { toast.error("Select at least one banner image"); return; }
    setSaving(true);
    try {
      for (const file of Array.from(files)) {
        const image_url = await uploadBannerImage(file, "home");
        const { error } = await db.from("home_banners").insert({ image_url, ...homeForm, button_text: homeForm.button_text || null, button_link: homeForm.button_link || null });
        if (error) throw error;
      }
      toast.success("Home banners added");
      setHomeForm({ title: "", subtitle: "", button_text: "", button_link: "", sort_order: 0 });
      await load();
    } catch (error: any) { toast.error(error.message || "Upload failed"); }
    setSaving(false);
  };

  const updateHomeBanner = async (banner: HomeBanner) => {
    const { error } = await db.from("home_banners").update({ title: banner.title, subtitle: banner.subtitle, button_text: banner.button_text || null, button_link: banner.button_link || null, sort_order: banner.sort_order, active: banner.active }).eq("id", banner.id);
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

  const saveCategoryText = async (category: Category) => {
    const t = categoryText[category];
    const { error } = await db.from("category_card_images").upsert(
      { category, title: t.title || null, subtitle: t.subtitle || null, event_label: t.event_label || null },
      { onConflict: "category" }
    );
    if (error) { toast.error(error.message); return; }
    toast.success("Category text saved"); load();
  };

  const createOffer = async (file: File | undefined) => {
    setSaving(true);
    try {
      const image_url = file ? await uploadBannerImage(file, "offers") : null;
      const { error } = await db.from("home_offers").insert({ ...offerForm, badge_label: offerForm.badge_label || null, link: offerForm.link || null, image_url });
      if (error) throw error;
      toast.success("Offer added");
      setOfferForm({ title: "", subtitle: "", badge_label: "", link: "", sort_order: 0 });
      await load();
    } catch (error: any) { toast.error(error.message || "Upload failed"); }
    setSaving(false);
  };

  const updateOffer = async (offer: HomeOffer) => {
    const { error } = await db.from("home_offers").update({ title: offer.title, subtitle: offer.subtitle, badge_label: offer.badge_label || null, link: offer.link || null, sort_order: offer.sort_order, active: offer.active }).eq("id", offer.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Offer saved"); load();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    const { error } = await db.from("home_offers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Offer deleted"); load();
  };

  const createPopup = async (file: File | undefined) => {
    setSaving(true);
    try {
      const image_url = file ? await uploadBannerImage(file, "popups") : null;
      const { error } = await db.from("home_popups").insert({ ...popupForm, button_text: popupForm.button_text || null, link: popupForm.link || null, image_url });
      if (error) throw error;
      toast.success("Popup added");
      setPopupForm({ title: "", subtitle: "", button_text: "", link: "", sort_order: 0 });
      await load();
    } catch (error: any) { toast.error(error.message || "Upload failed"); }
    setSaving(false);
  };

  const updatePopup = async (popup: HomePopup) => {
    const { error } = await db.from("home_popups").update({ title: popup.title, subtitle: popup.subtitle, button_text: popup.button_text || null, link: popup.link || null, sort_order: popup.sort_order, active: popup.active }).eq("id", popup.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Popup saved"); load();
  };

  const deletePopup = async (id: string) => {
    if (!confirm("Delete this popup?")) return;
    const { error } = await db.from("home_popups").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Popup deleted"); load();
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
        <div className="grid gap-3 md:grid-cols-6">
          <Input placeholder="Title" value={homeForm.title} onChange={(e) => setHomeForm((p) => ({ ...p, title: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Subtitle" value={homeForm.subtitle} onChange={(e) => setHomeForm((p) => ({ ...p, subtitle: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Button text optional" value={homeForm.button_text} onChange={(e) => setHomeForm((p) => ({ ...p, button_text: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Button link e.g. /tournaments" value={homeForm.button_link} onChange={(e) => setHomeForm((p) => ({ ...p, button_link: e.target.value }))} className="border-primary/30 bg-card" />
          <Input type="number" value={homeForm.sort_order} onChange={(e) => setHomeForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} className="border-primary/30 bg-card" />
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-sm border border-primary/50 bg-primary text-xs font-display font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
            <ImagePlus className="h-4 w-4" /> Upload
            <input type="file" accept="image/*" multiple className="hidden" disabled={saving} onChange={(e) => createHomeBanners(e.target.files)} />
          </label>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Preview</TableHead><TableHead>Title</TableHead><TableHead>Subtitle</TableHead><TableHead>Button</TableHead><TableHead>Link</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {homeBanners.map((banner, index) => (
                <TableRow key={banner.id}>
                  <TableCell>{banner.image_url ? <img src={banner.image_url} alt={banner.title || "Home banner"} className="h-12 w-28 object-cover" /> : <span className="text-xs text-muted-foreground">No Banner</span>}</TableCell>
                  <TableCell><Input value={banner.title} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, title: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={banner.subtitle} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, subtitle: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={banner.button_text ?? ""} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, button_text: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={banner.button_link ?? ""} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, button_link: e.target.value } : r))} /></TableCell>
                  <TableCell><Input type="number" value={banner.sort_order} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, sort_order: Number(e.target.value) } : r))} className="w-20" /></TableCell>
                  <TableCell><input type="checkbox" checked={banner.active} onChange={(e) => setHomeBanners((rows) => rows.map((r, i) => i === index ? { ...r, active: e.target.checked } : r))} /></TableCell>
                  <TableCell><div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => updateHomeBanner(banner)}><Save /></Button><Button size="icon" variant="destructive" onClick={() => deleteHomeBanner(banner.id)}><Trash2 /></Button></div></TableCell>
                </TableRow>
              ))}
              {homeBanners.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No Banner</TableCell></TableRow>}
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
                <div><h3 className="font-display text-sm uppercase tracking-widest text-primary">{CATEGORY_META[category].title}</h3><p className="text-[10px] text-muted-foreground">Card image, title, subtitle & event label</p></div>
              </div>
              <Input type="file" accept="image/*" disabled={saving} onChange={(e) => saveCategoryImage(category, e.target.files?.[0])} className="border-primary/30 bg-card" />
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <Input placeholder="Title" value={categoryText[category].title} onChange={(e) => setCategoryText((p) => ({ ...p, [category]: { ...p[category], title: e.target.value } }))} className="border-primary/30 bg-card" />
                <Input placeholder="Subtitle" value={categoryText[category].subtitle} onChange={(e) => setCategoryText((p) => ({ ...p, [category]: { ...p[category], subtitle: e.target.value } }))} className="border-primary/30 bg-card" />
                <Input placeholder="Event label" value={categoryText[category].event_label} onChange={(e) => setCategoryText((p) => ({ ...p, [category]: { ...p[category], event_label: e.target.value } }))} className="border-primary/30 bg-card" />
              </div>
              <Button className="mt-2" size="sm" variant="outline" onClick={() => saveCategoryText(category)}><Save className="mr-1 h-4 w-4" /> Save Text</Button>
            </div>
          ))}
        </div>
      </SystemPanel>

      <SystemPanel title="Manage Offer Cards">
        <div className="grid gap-3 md:grid-cols-6">
          <Input placeholder="Title" value={offerForm.title} onChange={(e) => setOfferForm((p) => ({ ...p, title: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Subtitle" value={offerForm.subtitle} onChange={(e) => setOfferForm((p) => ({ ...p, subtitle: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Badge label" value={offerForm.badge_label} onChange={(e) => setOfferForm((p) => ({ ...p, badge_label: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Link" value={offerForm.link} onChange={(e) => setOfferForm((p) => ({ ...p, link: e.target.value }))} className="border-primary/30 bg-card" />
          <Input type="number" value={offerForm.sort_order} onChange={(e) => setOfferForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} className="border-primary/30 bg-card" />
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-sm border border-primary/50 bg-primary text-xs font-display font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
            <ImagePlus className="h-4 w-4" /> Add Offer
            <input type="file" accept="image/*" className="hidden" disabled={saving} onChange={(e) => createOffer(e.target.files?.[0])} />
          </label>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Preview</TableHead><TableHead>Title</TableHead><TableHead>Subtitle</TableHead><TableHead>Badge</TableHead><TableHead>Link</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {offers.map((offer, index) => (
                <TableRow key={offer.id}>
                  <TableCell>{offer.image_url ? <img src={offer.image_url} alt={offer.title} className="h-12 w-24 object-cover" /> : <span className="text-xs text-muted-foreground">No Image</span>}</TableCell>
                  <TableCell><Input value={offer.title} onChange={(e) => setOffers((rows) => rows.map((r, i) => i === index ? { ...r, title: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={offer.subtitle} onChange={(e) => setOffers((rows) => rows.map((r, i) => i === index ? { ...r, subtitle: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={offer.badge_label ?? ""} onChange={(e) => setOffers((rows) => rows.map((r, i) => i === index ? { ...r, badge_label: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={offer.link ?? ""} onChange={(e) => setOffers((rows) => rows.map((r, i) => i === index ? { ...r, link: e.target.value } : r))} /></TableCell>
                  <TableCell><Input type="number" value={offer.sort_order} onChange={(e) => setOffers((rows) => rows.map((r, i) => i === index ? { ...r, sort_order: Number(e.target.value) } : r))} className="w-20" /></TableCell>
                  <TableCell><input type="checkbox" checked={offer.active} onChange={(e) => setOffers((rows) => rows.map((r, i) => i === index ? { ...r, active: e.target.checked } : r))} /></TableCell>
                  <TableCell><div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => updateOffer(offer)}><Save /></Button><Button size="icon" variant="destructive" onClick={() => deleteOffer(offer.id)}><Trash2 /></Button></div></TableCell>
                </TableRow>
              ))}
              {offers.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No Offers</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>

      <SystemPanel title="Manage Popup Banners">
        <div className="grid gap-3 md:grid-cols-6">
          <Input placeholder="Title" value={popupForm.title} onChange={(e) => setPopupForm((p) => ({ ...p, title: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Subtitle" value={popupForm.subtitle} onChange={(e) => setPopupForm((p) => ({ ...p, subtitle: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Button text" value={popupForm.button_text} onChange={(e) => setPopupForm((p) => ({ ...p, button_text: e.target.value }))} className="border-primary/30 bg-card" />
          <Input placeholder="Link" value={popupForm.link} onChange={(e) => setPopupForm((p) => ({ ...p, link: e.target.value }))} className="border-primary/30 bg-card" />
          <Input type="number" value={popupForm.sort_order} onChange={(e) => setPopupForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} className="border-primary/30 bg-card" />
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-sm border border-primary/50 bg-primary text-xs font-display font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
            <ImagePlus className="h-4 w-4" /> Add Popup
            <input type="file" accept="image/*" className="hidden" disabled={saving} onChange={(e) => createPopup(e.target.files?.[0])} />
          </label>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Preview</TableHead><TableHead>Title</TableHead><TableHead>Subtitle</TableHead><TableHead>Button</TableHead><TableHead>Link</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {popups.map((popup, index) => (
                <TableRow key={popup.id}>
                  <TableCell>{popup.image_url ? <img src={popup.image_url} alt={popup.title} className="h-12 w-24 object-cover" /> : <span className="text-xs text-muted-foreground">No Image</span>}</TableCell>
                  <TableCell><Input value={popup.title} onChange={(e) => setPopups((rows) => rows.map((r, i) => i === index ? { ...r, title: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={popup.subtitle} onChange={(e) => setPopups((rows) => rows.map((r, i) => i === index ? { ...r, subtitle: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={popup.button_text ?? ""} onChange={(e) => setPopups((rows) => rows.map((r, i) => i === index ? { ...r, button_text: e.target.value } : r))} /></TableCell>
                  <TableCell><Input value={popup.link ?? ""} onChange={(e) => setPopups((rows) => rows.map((r, i) => i === index ? { ...r, link: e.target.value } : r))} /></TableCell>
                  <TableCell><Input type="number" value={popup.sort_order} onChange={(e) => setPopups((rows) => rows.map((r, i) => i === index ? { ...r, sort_order: Number(e.target.value) } : r))} className="w-20" /></TableCell>
                  <TableCell><input type="checkbox" checked={popup.active} onChange={(e) => setPopups((rows) => rows.map((r, i) => i === index ? { ...r, active: e.target.checked } : r))} /></TableCell>
                  <TableCell><div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => updatePopup(popup)}><Save /></Button><Button size="icon" variant="destructive" onClick={() => deletePopup(popup.id)}><Trash2 /></Button></div></TableCell>
                </TableRow>
              ))}
              {popups.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No Popups</TableCell></TableRow>}
            </TableBody>
          </Table>
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