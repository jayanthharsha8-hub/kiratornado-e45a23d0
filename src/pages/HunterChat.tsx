import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Shield, Clock, Menu, Plus, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import heroBg from "@/assets/hunters-online-hero.jpg";

interface ChatMessage {
  id: string;
  user_id: string | null;
  username: string;
  player_name: string;
  player_level: number;
  avatar_url: string | null;
  content: string;
  is_bot: boolean;
  created_at: string;
}

interface MyProfile {
  username: string;
  player_name: string;
  player_level: number;
  coins: number;
  avatar_url: string | null;
}

const getRank = (level: number) => {
  if (level >= 81) return "S";
  if (level >= 70) return "A";
  if (level >= 61) return "B";
  if (level >= 41) return "C";
  if (level >= 21) return "D";
  return "E";
};

const COOLDOWN_MS = 3000;
const ROOM_ID_RE = /\b\d{6,}\b/;
const PASSWORD_RE = /\b(pass(word)?|pwd|pw)\s*[:=\-]?\s*\S+/i;
const LINK_RE = /(https?:\/\/|www\.|\.com|\.in|\.net|t\.me\/|wa\.me\/|bit\.ly)/i;
const TOXIC_RE = /\b(fuck|shit|bitch|bastard|mc|bc|bhenchod|madarchod|chutiya|gandu|lavda|nigger|retard)\b/i;

const detectViolation = (text: string): string | null => {
  if (LINK_RE.test(text)) return "Room ID's, Passwords, Links share cheyyadam nishedham. Ala chesthe warning ivvadam jaruguthundi.";
  if (PASSWORD_RE.test(text)) return "Room ID's, Passwords, Links share cheyyadam nishedham. Ala chesthe warning ivvadam jaruguthundi.";
  if (ROOM_ID_RE.test(text)) return "Room ID's, Passwords, Links share cheyyadam nishedham. Ala chesthe warning ivvadam jaruguthundi.";
  if (TOXIC_RE.test(text)) return "Toxic/abusive language detect ayyindi. Be respectful, Hunter.";
  return null;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Rank visual system — premium fantasy badge palette
const rankTheme: Record<string, { name: string; grad: string; border: string; glow: string; text: string }> = {
  S: { name: "#ff5566", grad: "linear-gradient(135deg,#ff3344,#7a0a18)", border: "#ff5566", glow: "rgba(255,60,80,0.55)", text: "#ffd5da" },
  A: { name: "#ffb547", grad: "linear-gradient(135deg,#ffb547,#7a4a08)", border: "#ffc56b", glow: "rgba(255,180,70,0.5)",  text: "#fff0c8" },
  B: { name: "#5fb8ff", grad: "linear-gradient(135deg,#3ea6ff,#0a3a7a)", border: "#5fb8ff", glow: "rgba(80,170,255,0.5)",  text: "#d6ecff" },
  C: { name: "#5dd49a", grad: "linear-gradient(135deg,#4ade80,#0a4a2a)", border: "#5dd49a", glow: "rgba(80,220,150,0.45)", text: "#d6f7e3" },
  D: { name: "#c084fc", grad: "linear-gradient(135deg,#a855f7,#3a0f6e)", border: "#c084fc", glow: "rgba(168,85,247,0.5)",  text: "#ebd9ff" },
  E: { name: "#cbd5e1", grad: "linear-gradient(135deg,#64748b,#1e293b)", border: "#94a3b8", glow: "rgba(148,163,184,0.35)", text: "#e2e8f0" },
};

const PURPLE = "#a855f7";
const PURPLE_DEEP = "#7c3aed";
const PURPLE_LINE = "rgba(168,85,247,0.22)";

// Premium rank badge — used in header pill, chat avatars, message rows
const RankBadge = ({ rank, size = "md" }: { rank: string; size?: "sm" | "md" }) => {
  const t = rankTheme[rank];
  const dim = size === "sm" ? "h-5 px-1.5 text-[9px]" : "h-6 px-2 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-display font-black uppercase tracking-[0.14em] ${dim}`}
      style={{
        background: t.grad,
        border: `1px solid ${t.border}`,
        color: t.text,
        boxShadow: `0 0 6px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
      }}
    >
      <Crown className="h-2.5 w-2.5" />
      {rank} Rank
    </span>
  );
};

const HunterChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [onlineCount, setOnlineCount] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("username,player_name,player_level,coins,avatar_url")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as MyProfile); });
  }, [user]);

  useEffect(() => {
    supabase.from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => { if (data) setMessages((data as ChatMessage[]).reverse()); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("hunter-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        setMessages((prev) => {
          const next = payload.new as ChatMessage;
          if (prev.find((m) => m.id === next.id)) return prev;
          return [...prev, next];
        });
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Math.max(Object.keys(state).length, 1));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, lastSentRef.current + COOLDOWN_MS - Date.now());
      setCooldownLeft(left);
    }, 100);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  const send = async () => {
    const text = input.trim();
    if (!text || !user || !profile || sending) return;
    if (Date.now() - lastSentRef.current < COOLDOWN_MS) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      username: profile.username,
      player_name: profile.player_name,
      player_level: profile.player_level,
      avatar_url: profile.avatar_url,
      content: text,
      is_bot: false,
    });
    setSending(false);
    if (error) { toast.error("Failed to send"); return; }
    setInput("");
    lastSentRef.current = Date.now();
    setCooldownLeft(COOLDOWN_MS);

    const violation = detectViolation(text);
    if (violation) {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        user_id: null,
        username: "kira_system",
        player_name: "KIRA SYSTEM",
        player_level: 0,
        avatar_url: null,
        content: violation,
        is_bot: true,
        created_at: new Date().toISOString(),
      };
      setTimeout(() => setMessages((p) => [...p, botMsg]), 400);
    }
  };

  const myRank = useMemo(() => profile ? getRank(profile.player_level) : "E", [profile]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden" style={{ background: "#06040b" }}>
      {/* ====== HERO HEADER ====== */}
      <header className="relative z-20 overflow-hidden">
        {/* Hero artwork */}
        <div
          className="relative w-full"
          style={{ aspectRatio: "16 / 9", maxHeight: "44vh" }}
        >
          <img
            src={heroBg}
            alt="Hunters Online"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Bottom fade into chat */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/3"
            style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(6,4,11,0.55) 55%, #06040b 100%)" }}
          />
          {/* Subtle vignette */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 50% 100%, rgba(124,58,237,0.18), transparent 60%)" }}
          />

          {/* Top bar overlay */}
          <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pt-3">
            <button onClick={() => navigate(-1)} className="flex shrink-0 items-center gap-2">
              <Logo size={22} />
              <div className="leading-none">
                <div className="font-display text-xs font-black uppercase tracking-[0.18em] text-white">KIRA</div>
                <div className="font-display text-[7.5px] font-bold uppercase tracking-[0.32em]" style={{ color: PURPLE }}>TORNADO</div>
              </div>
            </button>
            <div className="flex-1" />
            {/* Wallet */}
            <div
              className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                background: "rgba(10,6,20,0.7)",
                border: `1px solid ${PURPLE_LINE}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="h-2 w-2 rotate-45" style={{ background: PURPLE }} />
              <span className="font-display text-[11px] font-bold text-white">{profile?.coins.toLocaleString() ?? 0}</span>
              <button className="grid h-4 w-4 place-items-center rounded-full text-white" style={{ background: PURPLE_DEEP }}>
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Hunter rank floating pill */}
          {profile && (
            <div className="absolute left-1/2 top-14 -translate-x-1/2">
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(10,6,20,0.75)",
                  border: `1px solid ${PURPLE_LINE}`,
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0 14px rgba(168,85,247,0.25)",
                }}
              >
                <RankBadge rank={myRank} size="sm" />
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  Lv {profile.player_level}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Title block (under hero) */}
        <div className="relative -mt-2 px-4 pb-4">
          <div className="mx-auto max-w-md text-center">
            <h1
              className="font-display text-[26px] font-black uppercase leading-none tracking-[0.06em]"
              style={{
                background: "linear-gradient(180deg,#ffffff 0%,#d8c5ff 60%,#a37bff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 14px rgba(168,85,247,0.5))",
              }}
            >
              Hunters Online
            </h1>
            {/* Ornament */}
            <div className="mx-auto mt-2 flex items-center justify-center gap-2">
              <span className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.7))" }} />
              <span className="rotate-45 text-[10px]" style={{ color: PURPLE }}>◆</span>
              <Crown className="h-3.5 w-3.5" style={{ color: PURPLE, filter: "drop-shadow(0 0 4px rgba(168,85,247,0.7))" }} />
              <span className="rotate-45 text-[10px]" style={{ color: PURPLE }}>◆</span>
              <span className="h-px w-12" style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.7), transparent)" }} />
            </div>
            <p className="mt-1.5 font-display text-[10.5px] font-semibold uppercase tracking-[0.36em]" style={{ color: "#c4b5fd" }}>
              ◆ The Gate Is Open ◆
            </p>

            {/* Online counter */}
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{ background: "rgba(10,6,20,0.7)", border: `1px solid ${PURPLE_LINE}` }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full" style={{ background: "#22c55e", opacity: 0.7 }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
              </span>
              <span className="text-[11px] font-medium text-white/85">{onlineCount} Hunters Online Now</span>
            </div>
          </div>
        </div>

        {/* Bottom hairline */}
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)" }} />
      </header>

      {/* ====== MESSAGES ====== */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md space-y-2.5 px-4 pb-4 pt-3">
          {/* System notice */}
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 py-2"
            style={{
              background: "linear-gradient(180deg, rgba(28,16,52,0.6), rgba(14,9,28,0.7))",
              border: `1px solid ${PURPLE_LINE}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: PURPLE }} />
            <p className="flex-1 text-[11.5px] text-white/75">Be respectful, Hunters. Misbehavior leads to warnings or bans.</p>
            <span className="font-display text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: PURPLE }}>
              KIRA
            </span>
          </div>

          {messages.map((m) => <MessageCard key={m.id} message={m} />)}

          {messages.length === 0 && (
            <p className="py-12 text-center font-display text-xs uppercase tracking-[0.2em] text-white/40">
              No messages yet. Be the first Hunter to speak.
            </p>
          )}
        </div>
      </div>

      {/* ====== INPUT ====== */}
      <div className="relative z-20 px-4 pb-3 pt-2" style={{ background: "linear-gradient(to top, #06040b 75%, transparent)" }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.45), transparent)" }} />
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button
            aria-label="Menu"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            style={{
              background: "rgba(18,11,32,0.95)",
              border: `1px solid ${PURPLE}`,
              boxShadow: "0 0 10px rgba(168,85,247,0.4)",
              color: PURPLE,
            }}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div
            className="relative flex-1 rounded-full"
            style={{
              background: "rgba(14,9,26,0.85)",
              border: `1px solid ${PURPLE_LINE}`,
              backdropFilter: "blur(10px)",
              boxShadow: "0 0 14px rgba(168,85,247,0.18), inset 0 0 12px rgba(168,85,247,0.05)",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Message the Hunter Network..."
              maxLength={240}
              className="h-11 w-full rounded-full bg-transparent px-5 pr-12 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || cooldownLeft > 0}
              aria-label="Send"
              className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full transition disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})`,
                boxShadow: "0 0 14px rgba(168,85,247,0.65)",
                color: "#fff",
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        {cooldownLeft > 0 && (
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10.5px]" style={{ color: PURPLE }}>
            <Clock className="h-3 w-3" />
            <span>You can send another message in {(cooldownLeft / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageCard = ({ message }: { message: ChatMessage }) => {
  const rank = getRank(message.player_level);
  const isBot = message.is_bot;

  if (isBot) {
    return (
      <div
        className="relative overflow-hidden rounded-xl px-3 py-2.5"
        style={{
          background: "linear-gradient(135deg, rgba(76,29,149,0.55), rgba(24,12,52,0.85))",
          border: `1px solid rgba(168,85,247,0.45)`,
          boxShadow: "0 0 16px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* glowing left edge */}
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "linear-gradient(180deg,#a855f7,#4c1d95)", boxShadow: "0 0 10px rgba(168,85,247,0.7)" }} />
        <div className="flex gap-2.5">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{
              background: "linear-gradient(180deg, #4c1d95, #1e0a45)",
              border: `1px solid ${PURPLE}`,
              boxShadow: "0 0 8px rgba(168,85,247,0.5)",
            }}
          >
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-[12.5px] font-black uppercase tracking-[0.08em]" style={{ color: "#e9d5ff", textShadow: "0 0 8px rgba(168,85,247,0.6)" }}>
                KIRA SYSTEM
              </span>
              <span
                className="rounded px-1.5 py-px font-display text-[8.5px] font-black uppercase tracking-[0.18em] text-white"
                style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})`, boxShadow: "0 0 6px rgba(168,85,247,0.6)" }}
              >
                BOT
              </span>
              <span className="ml-auto text-[9.5px] text-white/50">{formatTime(message.created_at)}</span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-white/90">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  const t = rankTheme[rank];

  return (
    <div
      className="rounded-xl px-3 py-2.5 transition"
      style={{
        background: "linear-gradient(180deg, rgba(20,12,38,0.7), rgba(10,7,22,0.7))",
        border: `1px solid ${PURPLE_LINE}`,
        boxShadow: `0 0 10px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.03)`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex gap-2.5">
        <div
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"
          style={{
            border: `1.5px solid ${t.border}`,
            boxShadow: `0 0 8px ${t.glow}`,
          }}
        >
          {message.avatar_url ? (
            <img src={message.avatar_url} alt={message.player_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center font-display text-base font-extrabold text-white" style={{ background: t.grad }}>
              {message.player_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="truncate font-display text-[13px] font-extrabold tracking-wide"
              style={{ color: t.name, textShadow: `0 0 6px ${t.glow}` }}
            >
              {message.player_name}
            </span>
            <RankBadge rank={rank} size="sm" />
            <span className="ml-auto shrink-0 text-[9.5px] text-white/45">{formatTime(message.created_at)}</span>
          </div>
          <p className="mt-1 break-words text-[12.5px] leading-snug text-white/85">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default HunterChat;
