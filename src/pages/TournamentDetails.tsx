import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Calendar, Clock, Coins, Trophy, KeyRound, ShieldCheck, Copy,
  LogIn, Gamepad2, CheckCircle2, Bell, Hourglass, Lock, Headphones, ExternalLink, AlertTriangle,
} from "lucide-react";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";

interface Tournament {
  id: string; title: string; category: Category; entry_fee: number; total_slots: number;
  prize_pool: number; scheduled_at: string; room_id: string | null; room_password: string | null;
  status: string; notes: string | null; level_requirement: number;
}

const db = supabase as any;
const UNLOCK_MIN = 10;

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [t, setT] = useState<Tournament | null>(null);
  const [joined, setJoined] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    if (!id) return;
    const { data: tour } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
    if (tour) setT(tour as Tournament);
    const { data: banner } = await db.from("tournament_banners").select("banner_image_url").eq("tournament_id", id).maybeSingle();
    setBannerUrl(banner?.banner_image_url ?? null);
    if (user) {
      const { data: reg } = await supabase
        .from("registrations").select("id")
        .eq("tournament_id", id).eq("user_id", user.id).maybeSingle();
      setJoined(!!reg);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user]);
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const meta = t ? CATEGORY_META[t.category] : null;
  const accent = meta?.color ?? "hsl(0 100% 62%)";
  const accentSoft = meta?.colorSoft ?? "hsl(0 100% 62% / 0.2)";

  const start = t ? new Date(t.scheduled_at).getTime() : 0;
  const diffMs = start - now;
  const isLive = t && diffMs <= 0 && diffMs > -2 * 60 * 60 * 1000;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const unlocked = diffMs <= UNLOCK_MIN * 60 * 1000;
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");

  // progress for ring (last hour fill)
  const progress = useMemo(() => {
    if (!t) return 0;
    const hourMs = 60 * 60 * 1000;
    if (diffMs >= hourMs) return 0;
    if (diffMs <= 0) return 1;
    return 1 - diffMs / hourMs;
  }, [diffMs, t]);

  if (!t || !meta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xs uppercase tracking-[0.4em] text-primary animate-pulse">Loading…</div>
      </div>
    );
  }

  const date = new Date(t.scheduled_at);
  const dateStr = date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

  const TITLE_MAP: Record<Category, [string, string]> = {
    battle_royale: ["BATTLE", "ROYALE"],
    free_match: ["FREE", "MATCH"],
    classic_squad: ["CLASH", "SQUAD"],
    lone_wolf: ["LONE", "WOLF"],
    custom_rooms: ["CUSTOM", "ROOMS"],
    weekly_rankings: ["WEEKLY", "RANKINGS"],
  };
  const SUBTITLE_MAP: Record<Category, string> = {
    battle_royale: "SOLO • 50 PLAYERS",
    free_match: "SOLO • UNLIMITED",
    classic_squad: "SQUAD • 4V4",
    lone_wolf: "SOLO • 1V1",
    custom_rooms: "PRIVATE • SQUAD UP",
    weekly_rankings: "WEEKLY • TOP REWARDS",
  };
  const [w1, w2] = TITLE_MAP[t.category];

  const copy = (val: string | null, label: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied`);
  };

  const openGame = () => {
    playSound("pulse");
    const ua = navigator.userAgent || "";
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/i.test(ua);
    const androidPackage = "com.dts.freefiremax";
    const iosAppId = "1300146617"; // Free Fire MAX (App Store)
    const playStore = `https://play.google.com/store/apps/details?id=${androidPackage}`;
    const appStore = `https://apps.apple.com/app/id${iosAppId}`;

    if (isAndroid) {
      // Try intent deep link → fallback to Play Store
      const intent = `intent://launch/#Intent;scheme=app;package=${androidPackage};S.browser_fallback_url=${encodeURIComponent(playStore)};end`;
      const fallbackTimer = setTimeout(() => { window.location.href = playStore; }, 1500);
      try {
        window.location.href = intent;
      } catch {
        clearTimeout(fallbackTimer);
        window.location.href = playStore;
      }
    } else if (isIOS) {
      // No public custom-scheme; route to App Store
      window.location.href = appStore;
    } else {
      toast.error("Open the game on your mobile device");
    }
  };

  return (
    <div className="relative min-h-screen pb-10 text-foreground" style={{ background: "#0A0A0A" }}>
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50"
        style={{ background: `radial-gradient(900px 500px at 50% -10%, ${accentSoft}, transparent 60%)` }} />

      {/* TOP BAR */}
      <header className="mx-auto flex max-w-md items-center justify-between px-4 pt-4">
        <button
          onClick={() => {
            playSound("tick");
            navigate(`/category/${t.category}`, { replace: true });
          }}
          className="flex items-center gap-2 rounded-xl border bg-background/40 px-3 py-2 backdrop-blur transition active:scale-95"
          style={{ borderColor: accent, boxShadow: `0 0 14px ${accentSoft}`, color: accent }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em]">Back</span>
        </button>
        <div
          className="flex items-center gap-2 rounded-xl border bg-background/40 px-3 py-2 backdrop-blur"
          style={{ borderColor: isLive ? "hsl(142 71% 45%)" : `${accent}55`, boxShadow: isLive ? `0 0 14px hsl(142 71% 45% / 0.4)` : undefined }}
        >
          <span className={`h-2 w-2 rounded-full ${isLive ? "animate-pulse" : ""}`} style={{ background: isLive ? "hsl(142 71% 45%)" : "hsl(0 0% 100% / 0.3)" }} />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: isLive ? "hsl(142 71% 45%)" : "hsl(0 0% 100% / 0.5)" }}>
            {isLive ? "Live" : "Upcoming"}
          </span>
        </div>
      </header>

      {/* HEADER TITLE */}
      <div className="mx-auto mt-5 max-w-md px-4 text-center">
        <h1 className="font-display text-3xl font-black uppercase italic tracking-tight">
          <span className="text-foreground">MATCH </span>
          <span style={{ color: accent, textShadow: `0 0 14px ${accent}` }}>DETAILS</span>
        </h1>
        <p className="mt-1 inline-flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.35em] text-foreground/55">
          <span className="h-px w-6" style={{ background: `${accent}88` }} />
          Get Ready For Battle
          <span className="h-px w-6" style={{ background: `${accent}88` }} />
        </p>
      </div>

      <main className="mx-auto mt-5 max-w-md space-y-5 px-4">
        {/* MATCH INFO CARD */}
        <section
          className="relative overflow-hidden rounded-2xl border bg-card/40 p-3 backdrop-blur"
          style={{ borderColor: accent, boxShadow: `0 0 22px ${accentSoft}, inset 0 0 30px ${accent}10` }}
        >
          <div className="flex gap-3">
            <div
              className="relative h-[136px] w-[120px] shrink-0 overflow-hidden rounded-xl border"
              style={{ borderColor: accent, boxShadow: `0 0 16px ${accentSoft}` }}
            >
              {bannerUrl ? (
                <img src={bannerUrl} alt={t.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-[0.25em] text-foreground/40"
                  style={{ background: `linear-gradient(135deg, ${accent}33, transparent)` }}>
                  No Image
                </div>
              )}
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, ${accent}22)` }} />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="font-display text-xl font-black uppercase italic leading-none tracking-tight">
                <span className="text-foreground">{w1} </span>
                <span style={{ color: accent, textShadow: `0 0 10px ${accent}` }}>{w2}</span>
              </h2>
              <span
                className="mt-2 inline-flex w-fit items-center rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ background: `${accent}1f`, color: accent, border: `1px solid ${accent}66`, boxShadow: `0 0 10px ${accentSoft}` }}
              >
                {SUBTITLE_MAP[t.category]}
              </span>

              <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-foreground/85">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" style={{ color: accent }} /> {dateStr}
                </span>
                <span className="h-3 w-px bg-white/15" />
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" style={{ color: accent }} /> {timeStr}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-yellow-400"><Coins className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-foreground/55">Entry Fee</p>
                    <p className="font-display text-sm font-black">{t.entry_fee === 0 ? "FREE" : `₹${t.entry_fee}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                  <div className="text-yellow-400"><Trophy className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-foreground/55">Prize Pool</p>
                    <p className="font-display text-sm font-black" style={{ color: accent }}>₹{t.prize_pool}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COUNTDOWN */}
        <section
          className="relative overflow-hidden rounded-2xl border bg-card/40 px-4 py-4 backdrop-blur"
          style={{ borderColor: accent, boxShadow: `0 0 22px ${accentSoft}` }}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: accent, boxShadow: `inset 0 0 14px ${accentSoft}, 0 0 14px ${accentSoft}`, color: accent }}
            >
              <Hourglass className="h-6 w-6" style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
            </div>

            <div className="flex-1 text-center">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/70">
                {diffMs <= 0 ? "Match Started" : "Match Starts In"}
              </p>
              <div className="mt-1 flex items-baseline justify-center gap-2 font-display font-black">
                <span className="text-3xl text-foreground" style={{ textShadow: `0 0 12px ${accent}88` }}>{bigPrimary}</span>
                {!showSplit && <span className="text-2xl" style={{ color: accent }}>:</span>}
                <span
                  className={showSplit ? "text-2xl" : "text-3xl text-foreground"}
                  style={showSplit ? { color: accent } : { textShadow: `0 0 12px ${accent}88` }}
                >
                  {bigSecondary}
                </span>
              </div>
              <div className="mt-0.5 flex justify-center gap-6 font-display text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>
                <span>{labels[0]}</span>
                {labels[1] && <span>{labels[1]}</span>}
              </div>
            </div>

            <ProgressRing progress={progress} accent={accent} />
          </div>
        </section>

        {/* ROOM DETAILS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
              <h3 className="font-display text-[12px] font-black uppercase tracking-[0.28em] text-foreground">Room Details</h3>
              <span className="hidden sm:block ml-2 h-px w-16 bg-white/10" />
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: unlocked ? accent : "hsl(142 71% 55%)",
                borderColor: unlocked ? `${accent}66` : "hsl(142 71% 45% / 0.5)",
                background: unlocked ? `${accent}14` : "hsl(142 71% 45% / 0.1)",
                boxShadow: `0 0 10px ${unlocked ? accentSoft : "hsl(142 71% 45% / 0.3)"}`,
              }}
            >
              <Lock className="h-3 w-3" />
              {unlocked ? "Unlocked" : "Unlocks 10 Min Before"}
            </span>
          </div>

          <RoomRow
            icon={<KeyRound className="h-5 w-5" />}
            label="Room ID"
            value={joined && unlocked ? t.room_id : null}
            placeholder="Waiting for admin..."
            accent={accent}
            accentSoft={accentSoft}
            onCopy={() => copy(t.room_id, "Room ID")}
            locked={!joined || !unlocked}
          />
          <RoomRow
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Password"
            value={joined && unlocked ? t.room_password : null}
            placeholder="Waiting for admin..."
            accent={accent}
            accentSoft={accentSoft}
            onCopy={() => copy(t.room_password, "Password")}
            locked={!joined || !unlocked}
          />

          {!joined && (
            <p className="text-center font-display text-[10px] uppercase tracking-[0.25em] text-foreground/45">
              Join the match to receive room access
            </p>
          )}
        </section>

        {/* WHAT TO DO */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
            <h3 className="font-display text-[12px] font-black uppercase tracking-[0.28em] text-foreground">What To Do</h3>
            <span className="ml-2 h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <InstructionCard icon={<LogIn className="h-5 w-5" />} title="Enter the room" subtitle="5 mins before" accent={accent} />
            <InstructionCard icon={<Gamepad2 className="h-5 w-5" />} title="Use your" subtitle="registered IGN" accent={accent} />
            <InstructionCard icon={<CheckCircle2 className="h-5 w-5" />} title="Be ready" subtitle="before start" accent="hsl(142 71% 45%)" />
            <InstructionCard icon={<Bell className="h-5 w-5" />} title="Stay online" subtitle="for updates" accent={accent} />
          </div>
        </section>

        {/* BOTTOM ACTIONS */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => toast("Contact admin via Profile › Support")}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border bg-background/30 font-display text-[12px] font-black uppercase tracking-[0.22em] text-foreground transition active:scale-[0.98]"
            style={{ borderColor: accent, boxShadow: `0 0 14px ${accentSoft}` }}
          >
            <Headphones className="h-4 w-4" style={{ color: accent }} />
            Contact Admin
          </button>
          <button
            disabled={!joined}
            onClick={openGame}
            className="relative flex h-14 items-center justify-center gap-2 rounded-2xl font-display text-[12px] font-black uppercase tracking-[0.22em] transition active:scale-[0.98] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: "#0A0A0A",
              boxShadow: `0 8px 24px ${accent}77, 0 0 18px ${accent}`,
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Open Game
          </button>
        </section>

        {!joined && (
          <button
            onClick={() => navigate(`/tournament-slots/${t.id}`)}
            className="h-12 w-full rounded-xl border font-display text-[11px] font-black uppercase tracking-[0.28em] transition active:scale-[0.98]"
            style={{ borderColor: accent, color: accent, background: `${accent}14`, boxShadow: `0 0 16px ${accentSoft}` }}
          >
            Join This Match
          </button>
        )}

        {/* SECURITY WARNING */}
        <div
          className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-center font-display text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{
            borderColor: "hsl(0 100% 62%)",
            background: "hsl(0 100% 62% / 0.08)",
            color: "hsl(0 100% 75%)",
            boxShadow: "0 0 16px hsl(0 100% 62% / 0.3)",
          }}
        >
          <AlertTriangle className="h-4 w-4" />
          Do not share Room ID & Password with anyone
        </div>
      </main>
    </div>
  );
};

const ProgressRing = ({ progress, accent }: { progress: number; accent: string }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = c * progress;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} stroke="hsl(0 0% 100% / 0.08)" strokeWidth="6" fill="none" />
      <circle
        cx="32" cy="32" r={r}
        stroke={accent}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 32 32)"
        style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
      />
    </svg>
  );
};

const RoomRow = ({
  icon, label, value, placeholder, accent, accentSoft, onCopy, locked,
}: {
  icon: React.ReactNode; label: string; value: string | null; placeholder: string;
  accent: string; accentSoft: string; onCopy: () => void; locked: boolean;
}) => (
  <div
    className={`flex items-center gap-3 rounded-2xl border bg-card/40 p-3 backdrop-blur ${locked ? "opacity-70" : ""}`}
    style={{ borderColor: locked ? "hsl(0 0% 100% / 0.1)" : accent, boxShadow: locked ? undefined : `0 0 16px ${accentSoft}` }}
  >
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
      style={{ borderColor: accent, color: accent, boxShadow: `inset 0 0 10px ${accentSoft}` }}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/55">{label}</p>
      <p className={`mt-0.5 font-display font-black ${value ? "text-xl tracking-wider" : "text-[12px] italic text-foreground/40"}`}
        style={value ? { color: "#fff", textShadow: `0 0 10px ${accent}66` } : undefined}>
        {value ?? placeholder}
      </p>
    </div>
    <button
      disabled={!value}
      onClick={onCopy}
      className="flex items-center gap-1.5 rounded-xl border px-3 py-2 font-display text-[10px] font-black uppercase tracking-[0.2em] transition active:scale-95 disabled:opacity-40"
      style={{ borderColor: accent, color: accent, background: `${accent}10`, boxShadow: value ? `0 0 12px ${accentSoft}` : undefined }}
    >
      <Copy className="h-3.5 w-3.5" /> Copy
    </button>
  </div>
);

const InstructionCard = ({ icon, title, subtitle, accent }: { icon: React.ReactNode; title: string; subtitle: string; accent: string }) => (
  <div
    className="flex flex-col items-center gap-1.5 rounded-xl border bg-card/40 p-2.5 text-center backdrop-blur"
    style={{ borderColor: `${accent}55`, boxShadow: `inset 0 0 10px ${accent}10` }}
  >
    <div style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent})` }}>{icon}</div>
    <div>
      <p className="font-display text-[10px] font-black leading-tight text-foreground">{title}</p>
      <p className="font-display text-[9px] leading-tight text-foreground/55">{subtitle}</p>
    </div>
  </div>
);

export default TournamentDetails;
