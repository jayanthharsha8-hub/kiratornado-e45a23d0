import zeoxLogo from "@/assets/zeox-logo.png";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Wallet,
  Bell,
  Plus,
  CalendarCheck,
  Disc3,
  UserPlus,
  Tag,
  Gift,
  Headphones,
  Trophy,
  ChevronRight,
  Users,
  Gem,
  Clock,
  MessageSquare,
  ArrowRight,
  Swords,
  X,
  Sparkles,
} from "lucide-react";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Particles } from "@/components/Particles";
import { NeonCard, SmartImage, SectionHeader, GlowTone } from "@/components/home/primitives";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { useHomeContent, HomeTournament, HomePopup } from "@/hooks/useHomeContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playSound } from "@/hooks/useSound";

/* ---------------- Layout constants ---------------- */
const SECTION_GAP = 12;
const CARD_GAP = 10;
const PAD = 12;

/* ---------------- Header ---------------- */
const Header = ({ coins, onWallet }: { coins: number; onWallet: () => void }) => (
  <header className="flex items-center gap-2" style={{ height: 52 }}>
    <SideMenu>
      <button aria-label="Open menu" className="flex items-center gap-2" onClick={() => playSound("tick")}>
        <div
          className="grid place-items-center rounded-full border overflow-hidden"
          style={{
            width: 38,
            height: 38,
            borderColor: "rgba(0,229,255,0.5)",
            background: "radial-gradient(circle, rgba(0,229,255,0.12), rgba(10,15,28,0.6))",
            boxShadow: "0 0 7px rgba(0,229,255,0.28)",
          }}
        >
          <img src={zeoxLogo} alt="ZEOX" className="h-[30px] w-[30px] object-contain" />
        </div>
        <div className="leading-none">
          <div
            className="font-display font-black uppercase text-white"
            style={{ fontSize: 14, letterSpacing: "0.22em", textShadow: "0 0 6px rgba(0,229,255,0.35)" }}
          >
            ZEOX
          </div>
          <div className="font-display font-bold uppercase text-white/60" style={{ fontSize: 8, letterSpacing: "0.26em" }}>
            ESPORTS
          </div>

        </div>
      </button>
    </SideMenu>

    <div className="flex-1" />

    <button
      onClick={onWallet}
      aria-label="Wallet"
      className="flex items-center gap-1.5 px-2.5 transition hover:scale-[1.02]"
      style={{
        height: 38,
        borderRadius: 12,
        border: "1px solid rgba(0,229,255,0.42)",
        background: "linear-gradient(135deg, rgba(0,229,255,0.07), rgba(10,15,28,0.9))",
        boxShadow: "0 0 8px rgba(0,229,255,0.16)",
      }}
    >
      <Wallet className="h-4 w-4 shrink-0 text-cyan-300" />
      <span
        className="font-display font-black text-white"
        style={{ fontSize: 13, textShadow: "0 0 5px rgba(0,229,255,0.35)" }}
      >
        {coins.toLocaleString()}
      </span>
      <span
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-black"
        style={{ background: "rgba(0,229,255,0.9)" }}
      >
        <Plus className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    </button>

    <SideMenu>
      <button
        aria-label="Menu"
        className="grid place-items-center rounded-[11px] border"
        style={{
          width: 38,
          height: 38,
          borderColor: "rgba(0,229,255,0.4)",
          background: "rgba(10,15,28,0.75)",
        }}
      >
        <Menu className="h-4 w-4 text-cyan-300" />
      </button>
    </SideMenu>

    <button
      aria-label="Notifications"
      className="relative grid place-items-center rounded-full border"
      style={{
        width: 38,
        height: 38,
        borderColor: "rgba(0,229,255,0.35)",
        background: "rgba(10,15,28,0.75)",
      }}
    >
      <Bell className="h-4 w-4 text-cyan-200" />
      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: "#ff3860" }} />
    </button>
  </header>
);

/* ---------------- Main Banner (admin driven) ---------------- */
const MainBanner = ({ banners }: { banners: ReturnType<typeof useHomeContent>["banners"] }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slides = banners.length ? banners : [null];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[Math.min(index, slides.length - 1)];

  const go = (link?: string | null) => {
    if (!link) return;
    if (/^https?:\/\//.test(link)) window.open(link, "_blank", "noopener");
    else navigate(link);
  };

  return (
    <div>
      <NeonCard glow="mixed" radius={16} className="overflow-hidden" style={{ height: 145 }}>
        <SmartImage
          src={current?.image_url}
          alt={current?.title || "Home banner"}
          placeholderLabel="Banner"
          from="#0d1a3f"
          to="#2a0d3f"
          className="absolute inset-0"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(5,7,13,0.85), rgba(5,7,13,0.25) 70%)" }}
        />
        <div className="relative flex h-full flex-col justify-end" style={{ padding: PAD }}>
          {current?.title && (
            <h2
              className="font-display font-black uppercase leading-[1.02] text-white"
              style={{ fontSize: 18, letterSpacing: "0.02em", textShadow: "0 0 8px rgba(0,229,255,0.35)" }}
            >
              {current.title}
            </h2>
          )}
          {current?.subtitle && (
            <p
              className="mt-0.5 font-display font-semibold uppercase text-white/65"
              style={{ fontSize: 9.5, letterSpacing: "0.14em" }}
            >
              {current.subtitle}
            </p>
          )}
          {current?.button_text && (
            <button
              onClick={() => go(current.button_link)}
              className="mt-2 flex w-fit items-center gap-1.5 rounded-[9px] border px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-white transition hover:scale-[1.03]"
              style={{
                borderColor: "rgba(0,229,255,0.5)",
                background: "rgba(0,229,255,0.08)",
                boxShadow: "0 0 6px rgba(0,229,255,0.2)",
              }}
            >
              {current.button_text}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </NeonCard>
      {slides.length > 1 && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: index === i ? 18 : 7,
                height: 4,
                borderRadius: 999,
                background: index === i ? "linear-gradient(90deg, #00e5ff, #a855f7)" : "rgba(255,255,255,0.15)",
                transition: "all 250ms",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- Quick Actions ---------------- */
const QUICK_ACTIONS = [
  { icon: CalendarCheck, label: "Check-In", color: "#00e5ff" },
  { icon: Disc3, label: "Spin", color: "#a855f7" },
  { icon: UserPlus, label: "Invite", color: "#00e5ff" },
  { icon: Tag, label: "Offers", color: "#ffb020" },
  { icon: Gift, label: "Redeem", color: "#4ade80" },
  { icon: Headphones, label: "Support", color: "#c084fc" },
];

const QuickActions = () => (
  <NeonCard glow="blue" radius={16} style={{ height: 68 }} className="px-1.5">
    <div className="grid h-full grid-cols-6 items-center">
      {QUICK_ACTIONS.map(({ icon: Icon, label, color }) => (
        <button
          key={label}
          onClick={() => playSound("tick")}
          className="flex h-full flex-col items-center justify-center gap-1 transition hover:-translate-y-0.5"
        >
          <div
            className="grid place-items-center rounded-[9px]"
            style={{
              width: 28,
              height: 28,
              border: `1px solid ${color}88`,
              background: `${color}10`,
              boxShadow: `0 0 6px ${color}33`,
            }}
          >
            <Icon style={{ width: 15, height: 15, color }} strokeWidth={2} />
          </div>
          <span
            className="text-center font-display font-semibold uppercase leading-none text-white/75"
            style={{ fontSize: 8, letterSpacing: "0.04em" }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  </NeonCard>
);

/* ---------------- Tournament Card ---------------- */
const TOURNEY_GLOWS: GlowTone[] = ["red", "purple", "blue"];
const TOURNEY_COLORS = ["#ff5c5c", "#c084fc", "#00e5ff"];

const TournamentCard = ({
  tournament,
  index,
  onOpen,
}: {
  tournament: HomeTournament;
  index: number;
  onOpen: () => void;
}) => {
  const color = TOURNEY_COLORS[index % TOURNEY_COLORS.length];
  const glow = TOURNEY_GLOWS[index % TOURNEY_GLOWS.length];
  const time = new Date(tournament.scheduled_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const mode = tournament.subtitle || CATEGORY_META[tournament.category]?.subtitle || "";

  return (
    <NeonCard glow={glow} radius={16} onClick={onOpen} className="overflow-hidden" style={{ height: 205 }}>
      <div className="relative" style={{ height: 92 }}>
        <SmartImage
          src={tournament.banner_url}
          alt={tournament.title}
          placeholderLabel="Match"
          className="absolute inset-0"
        />
        <span
          className="absolute left-1.5 top-1.5 grid place-items-center rounded font-display font-black uppercase text-white"
          style={{
            width: 32,
            height: 16,
            fontSize: 8,
            letterSpacing: "0.1em",
            background: "linear-gradient(135deg, #ff2d55, #b91c1c)",
            boxShadow: "0 0 6px rgba(255,45,85,0.4)",
          }}
        >
          HOT
        </span>
      </div>

      <div className="flex flex-col gap-1" style={{ padding: PAD, paddingTop: 8, paddingBottom: 0 }}>
        <h4 className="truncate font-display font-black uppercase text-white" style={{ fontSize: 11 }}>
          {tournament.title}
        </h4>
        <p
          className="truncate font-display font-semibold uppercase"
          style={{ fontSize: 8, letterSpacing: "0.1em", color }}
        >
          {mode}
        </p>
        <div className="mt-0.5 flex items-center justify-between text-white/75">
          <span className="flex items-center gap-0.5" style={{ fontSize: 8 }}>
            <Users className="h-2.5 w-2.5" /> {tournament.joined_players_count}/{tournament.total_slots}
          </span>
          <span className="flex items-center gap-0.5" style={{ fontSize: 8 }}>
            <Gem className="h-2.5 w-2.5 text-cyan-300" /> {tournament.entry_fee}
          </span>
        </div>
        <span className="flex items-center gap-0.5 text-white/60" style={{ fontSize: 8 }}>
          <Clock className="h-2.5 w-2.5" /> {time}
        </span>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center border-t"
        style={{
          height: 38,
          borderColor: `${color}44`,
          background: `linear-gradient(180deg, transparent, ${color}0f)`,
        }}
      >
        <span className="font-display text-[7px] font-bold uppercase tracking-[0.24em] text-white/55">
          Win Prize
        </span>
        <span
          className="font-display font-black"
          style={{ fontSize: 14, color, textShadow: `0 0 6px ${color}55` }}
        >
          ₹{tournament.prize_pool.toLocaleString()}
        </span>
      </div>
    </NeonCard>
  );
};

/* ---------------- Categories ---------------- */
const CATEGORY_STYLE: Record<Category, { glow: GlowTone; color: string }> = {
  free_match: { glow: "blue", color: "#00e5ff" },
  battle_royale: { glow: "purple", color: "#a855f7" },
  classic_squad: { glow: "purple", color: "#c084fc" },
  lone_wolf: { glow: "green", color: "#4ade80" },
  custom_rooms: { glow: "yellow", color: "#ffd24d" },
  weekly_rankings: { glow: "pink", color: "#ff5aa0" },
};

/* ---------------- Popup ---------------- */
const PopupBanner = ({ popup, onClose }: { popup: HomePopup; onClose: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-6 backdrop-blur-sm">
      <NeonCard glow="mixed" radius={18} className="w-full max-w-xs overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/80"
        >
          <X className="h-4 w-4" />
        </button>
        <div style={{ height: 150 }} className="relative">
          <SmartImage src={popup.image_url} alt={popup.title} placeholderLabel="Promo" className="absolute inset-0" />
        </div>
        <div style={{ padding: PAD }}>
          <h3 className="font-display text-base font-black uppercase text-white">{popup.title}</h3>
          <p className="mt-1 text-[11px] text-white/65">{popup.subtitle}</p>
          {popup.button_text && (
            <button
              onClick={() => {
                onClose();
                if (popup.link) {
                  if (/^https?:\/\//.test(popup.link)) window.open(popup.link, "_blank", "noopener");
                  else navigate(popup.link);
                }
              }}
              className="mt-3 w-full rounded-[10px] py-2 font-display text-[11px] font-bold uppercase tracking-widest text-black"
              style={{ background: "linear-gradient(90deg, #00e5ff, #a855f7)" }}
            >
              {popup.button_text}
            </button>
          )}
        </div>
      </NeonCard>
    </div>
  );
};

/* ---------------- Page ---------------- */
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [unread, setUnread] = useState(0);
  const { banners, tournaments, categories, offers, popups } = useHomeContent();
  const [dismissedPopup, setDismissedPopup] = useState(false);

  const popup = useMemo(() => popups[0], [popups]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setCoins(data.coins ?? 0));
  }, [user]);

  const openLink = (link?: string | null) => {
    if (!link) return;
    if (/^https?:\/\//.test(link)) window.open(link, "_blank", "noopener");
    else navigate(link);
  };

  return (
    <div className="relative min-h-screen" style={{ background: "#05070D" }}>
      <Particles />
      <div
        className="relative mx-auto max-w-md"
        style={{ paddingTop: 14, paddingLeft: PAD, paddingRight: PAD, paddingBottom: 92 }}
      >
        <Header coins={coins} onWallet={() => navigate("/wallet")} />

        <div style={{ height: SECTION_GAP }} />
        <MainBanner banners={banners} />

        <div style={{ height: SECTION_GAP }} />
        <QuickActions />

        <div style={{ height: SECTION_GAP }} />
        <section>
          <SectionHeader
            icon={Trophy}
            title="Top Tournaments"
            actionLabel="View All"
            onAction={() => navigate("/tournaments")}
          />
          {tournaments.length ? (
            <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: CARD_GAP }}>
              {tournaments.slice(0, 3).map((t, i) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  index={i}
                  onOpen={() => navigate(`/tournament/${t.id}`)}
                />
              ))}
            </div>
          ) : (
            <NeonCard glow="blue" radius={16} className="grid place-items-center" style={{ height: 72 }}>
              <span className="font-display text-[10px] uppercase tracking-[0.2em] text-white/40">
                No tournaments yet
              </span>
            </NeonCard>
          )}
        </section>

        <div style={{ height: SECTION_GAP }} />
        <section>
          <SectionHeader
            icon={Swords}
            title="Categories"
            actionLabel="View All"
            onAction={() => navigate("/tournaments")}
          />
          <div className="grid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: CARD_GAP }}>
            {(Object.keys(CATEGORY_META) as Category[]).map((key) => {
              const cfg = CATEGORY_STYLE[key];
              const row = categories[key];
              const title = row?.title || CATEGORY_META[key].title;
              const subtitle = row?.subtitle || CATEGORY_META[key].subtitle;
              return (
                <NeonCard
                  key={key}
                  glow={cfg.glow}
                  radius={14}
                  onClick={() => {
                    playSound("pulse");
                    navigate(`/category/${key}`);
                  }}
                  className="overflow-hidden"
                  style={{ height: 105 }}
                >
                  <SmartImage
                    src={row?.card_image_url}
                    alt={title}
                    placeholderLabel="Category"
                    from={`${cfg.color}22`}
                    to="#0a0f1c"
                    className="absolute inset-0"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(5,7,13,0.15), rgba(5,7,13,0.9))" }}
                  />
                  {row?.event_label && (
                    <span
                      className="absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 font-display text-[7px] font-bold uppercase tracking-[0.14em] text-black"
                      style={{ background: cfg.color }}
                    >
                      {row.event_label}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0" style={{ padding: PAD, paddingTop: 6 }}>
                    <div
                      className="truncate font-display font-black uppercase leading-tight text-white"
                      style={{ fontSize: 13, textShadow: `0 0 6px ${cfg.color}55` }}
                    >
                      {title}
                    </div>
                    <div
                      className="truncate font-display font-semibold uppercase text-white/60"
                      style={{ fontSize: 8.5, letterSpacing: "0.08em" }}
                    >
                      {subtitle}
                    </div>
                  </div>
                </NeonCard>
              );
            })}
          </div>
        </section>

        {offers.length > 0 && (
          <>
            <div style={{ height: SECTION_GAP }} />
            <section>
              <SectionHeader icon={Sparkles} title="Offers" />
              <div className="flex gap-[10px] overflow-x-auto pb-1">
                {offers.map((o) => (
                  <NeonCard
                    key={o.id}
                    glow="purple"
                    radius={14}
                    onClick={() => openLink(o.link)}
                    className="shrink-0 overflow-hidden"
                    style={{ width: 190, height: 84 }}
                  >
                    <SmartImage src={o.image_url} alt={o.title} placeholderLabel="Offer" className="absolute inset-0" />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(90deg, rgba(5,7,13,0.9), rgba(5,7,13,0.35))" }}
                    />
                    <div className="relative flex h-full flex-col justify-center" style={{ padding: PAD }}>
                      {o.badge_label && (
                        <span className="mb-0.5 w-fit rounded bg-purple-500/25 px-1.5 py-0.5 font-display text-[7px] font-bold uppercase tracking-[0.16em] text-purple-200">
                          {o.badge_label}
                        </span>
                      )}
                      <div className="truncate font-display text-[12px] font-black uppercase text-white">{o.title}</div>
                      <div className="truncate text-[9px] text-white/60">{o.subtitle}</div>
                    </div>
                  </NeonCard>
                ))}
              </div>
            </section>
          </>
        )}

        <div style={{ height: SECTION_GAP }} />
        <button
          onClick={() => {
            playSound("tick");
            setUnread(0);
            navigate("/hunter-chat");
          }}
          className="group flex w-full items-center gap-2.5 transition-all duration-[250ms] hover:-translate-y-0.5"
          style={{
            height: 64,
            padding: PAD,
            borderRadius: 16,
            border: "1px solid rgba(140,120,255,0.45)",
            background:
              "linear-gradient(120deg, rgba(0,90,180,0.45) 0%, rgba(40,20,120,0.65) 55%, rgba(120,40,180,0.5) 100%)",
            boxShadow: "0 0 13px rgba(0,229,255,0.16), 0 0 15px rgba(168,85,247,0.14)",
          }}
        >
          <div
            className="grid shrink-0 place-items-center rounded-[12px]"
            style={{
              width: 38,
              height: 38,
              border: "1px solid rgba(0,229,255,0.45)",
              background: "rgba(10,15,28,0.55)",
            }}
          >
            <MessageSquare className="h-4 w-4 text-cyan-200" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div
              className="font-display font-black uppercase leading-tight"
              style={{
                fontSize: 15,
                background: "linear-gradient(90deg, #ffffff, #00e5ff 45%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.04em",
              }}
            >
              Hunter Chat
            </div>
            <div
              className="font-display font-semibold uppercase text-white/60"
              style={{ fontSize: 8, letterSpacing: "0.2em" }}
            >
              Chat • Connect • Dominate
            </div>
          </div>
          {unread > 0 && (
            <span
              className="grid shrink-0 place-items-center rounded-full px-2 font-display text-[10px] font-black text-white"
              style={{ minWidth: 24, height: 24, background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
          <ChevronRight className="h-6 w-6 shrink-0 text-white/70" />
        </button>
      </div>

      {popup && !dismissedPopup && <PopupBanner popup={popup} onClose={() => setDismissedPopup(true)} />}

      <BottomNav />
    </div>
  );
};

export default Home;
