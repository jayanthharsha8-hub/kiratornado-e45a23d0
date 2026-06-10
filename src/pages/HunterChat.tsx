import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Shield, Clock, Menu, Plus, Crown, ArrowLeft, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
const AUTO_DELETE_MS = 30 * 60 * 1000; // 30 minutes
const GROUP_WINDOW_MS = 5 * 60 * 1000; // group within 5 minutes
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

const TypingDots = () => (
  <span className="inline-flex items-end gap-0.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="block h-1 w-1 rounded-full"
        style={{
          background: PURPLE,
          boxShadow: `0 0 4px ${PURPLE}`,
          animation: `typingBounce 1.2s ${i * 0.15}s infinite ease-in-out`,
        }}
      />
    ))}
  </span>
);

const HunterChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [onlineCount, setOnlineCount] = useState(1);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; ts: number }>>({});
  const [now, setNow] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0);
  const channelRef = useRef<any>(null);
  const typingSentAtRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("username,player_name,player_level,coins,avatar_url")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as MyProfile); });
  }, [user]);

  useEffect(() => {
    const sinceIso = new Date(Date.now() - AUTO_DELETE_MS).toISOString();
    supabase.from("chat_messages")
      .select("*")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(80)
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
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { uid: string; name: string };
        if (!p?.uid || p.uid === user.id) return;
        setTypingUsers((prev) => ({ ...prev, [p.uid]: { name: p.name, ts: Date.now() } }));
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
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Tick for auto-delete pruning + typing expiry
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setTypingUsers((prev) => {
        const next: typeof prev = {};
        const cutoff = Date.now() - 3500;
        for (const [k, v] of Object.entries(prev)) if (v.ts > cutoff) next[k] = v;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Filter out expired messages
  const visibleMessages = useMemo(
    () => messages.filter((m) => now - new Date(m.created_at).getTime() < AUTO_DELETE_MS),
    [messages, now]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMessages.length, typingUsers]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, lastSentRef.current + COOLDOWN_MS - Date.now());
      setCooldownLeft(left);
    }, 100);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  const broadcastTyping = () => {
    if (!channelRef.current || !user || !profile) return;
    const now = Date.now();
    if (now - typingSentAtRef.current < 1500) return;
    typingSentAtRef.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { uid: user.id, name: profile.player_name },
    });
  };

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

  // Build message groups — consecutive same-author messages stay in ONE card
  const groups = useMemo(() => {
    const out: ChatMessage[][] = [];
    visibleMessages.forEach((m) => {
      const last = out[out.length - 1];
      const prev = last?.[last.length - 1];
      const sameAuthor =
        prev &&
        prev.is_bot === m.is_bot &&
        ((m.user_id && prev.user_id === m.user_id) || (m.is_bot && prev.is_bot)) &&
        new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;
      if (sameAuthor) last.push(m);
      else out.push([m]);
    });
    return out;
  }, [visibleMessages]);

  const typingList = Object.values(typingUsers);
  const typingLabel =
    typingList.length === 0
      ? ""
      : typingList.length === 1
      ? `${typingList[0].name} is typing`
      : typingList.length === 2
      ? `${typingList[0].name} and ${typingList[1].name} are typing`
      : `${typingList.length} hunters are typing`;

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden" style={{ background: "#06040b" }}>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes msgEnter {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .msg-enter { animation: msgEnter 0.28s ease-out both; }
      `}</style>

      {/* ====== COMPACT HERO HEADER ====== */}
      <header className="relative z-20 overflow-hidden">
        <div className="relative w-full" style={{ aspectRatio: "21 / 9", maxHeight: "22vh" }}>
          <img src={heroBg} alt="Hunters Online" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-x-0 bottom-0 h-3/4"
            style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(6,4,11,0.7) 60%, #06040b 100%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 50% 100%, rgba(124,58,237,0.18), transparent 60%)" }}
          />

          {/* Top bar — Back button + diamonds */}
          <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-3 pt-2.5">
            <button
              onClick={() => navigate(-1)}
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 transition active:scale-95"
              style={{
                background: "rgba(10,6,20,0.65)",
                border: `1px solid ${PURPLE_LINE}`,
                backdropFilter: "blur(10px)",
                color: "#fff",
              }}
              aria-label="Back"
            >
              <ArrowLeft className="h-3.5 w-3.5" style={{ color: PURPLE }} />
              <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.18em]">Back</span>
            </button>
            <div className="flex-1" />
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

          <div className="absolute inset-x-0 bottom-1 px-4 text-center">
            <h1
              className="font-display text-[20px] font-black uppercase leading-none tracking-[0.08em]"
              style={{
                background: "linear-gradient(180deg,#ffffff 0%,#d8c5ff 60%,#a37bff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 10px rgba(168,85,247,0.55))",
              }}
            >
              Hunters Online
            </h1>
            <p className="mt-0.5 font-display text-[8.5px] font-semibold uppercase tracking-[0.36em]" style={{ color: "#c4b5fd" }}>
              ◆ The Gate Is Open ◆
            </p>
          </div>
        </div>

        {/* Rank + Online + Auto-delete row */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          {profile ? (
            <div
              className="flex items-center gap-2 rounded-full px-2.5 py-1"
              style={{
                background: "rgba(10,6,20,0.75)",
                border: `1px solid ${PURPLE_LINE}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <RankBadge rank={myRank} size="sm" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                Lv {profile.player_level}
              </span>
            </div>
          ) : <div />}

          <div className="flex items-center gap-1.5">
            <div
              className="inline-flex items-center gap-1 rounded-full px-2 py-1"
              style={{ background: "rgba(10,6,20,0.6)", border: `1px solid ${PURPLE_LINE}` }}
              title="Messages auto-delete after 30 minutes"
            >
              <Timer className="h-2.5 w-2.5" style={{ color: PURPLE }} />
              <span className="text-[9px] font-medium uppercase tracking-wider text-white/60">30m</span>
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: "rgba(10,6,20,0.7)", border: `1px solid ${PURPLE_LINE}` }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full" style={{ background: "#22c55e", opacity: 0.7 }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
              </span>
              <span className="text-[10.5px] font-medium text-white/85">
                {onlineCount} {onlineCount === 1 ? "Hunter" : "Hunters"} Online
              </span>
            </div>
          </div>
        </div>

        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)" }} />
      </header>

      {/* ====== STICKY NOTICE ====== */}
      <div className="relative z-10 px-3 pt-2">
        <div
          className="mx-auto flex max-w-md items-center gap-2 rounded-lg px-2.5 py-1.5"
          style={{
            background: "linear-gradient(180deg, rgba(28,16,52,0.78), rgba(14,9,28,0.85))",
            border: `1px solid ${PURPLE_LINE}`,
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          }}
        >
          <Shield className="h-3 w-3 shrink-0" style={{ color: PURPLE }} />
          <p className="flex-1 text-[10.5px] text-white/70">Be respectful, Hunters. Messages auto-delete after 30 min.</p>
          <span className="font-display text-[8.5px] font-black uppercase tracking-[0.18em]" style={{ color: PURPLE }}>
            KIRA
          </span>
        </div>
      </div>

      {/* ====== MESSAGES ====== */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-3 pb-3 pt-1.5">
          <div className="flex flex-col gap-1">
            {groups.map((g) => (
              <MessageGroup key={g[0].id} messages={g} />
            ))}
          </div>

          {visibleMessages.length === 0 && (
            <p className="py-12 text-center font-display text-xs uppercase tracking-[0.2em] text-white/40">
              No messages yet. Be the first Hunter to speak.
            </p>
          )}
        </div>
      </div>

      {/* ====== TYPING INDICATOR ====== */}
      <div className="relative z-20 mx-auto h-5 w-full max-w-md px-4">
        {typingLabel && (
          <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "#d8c5ff" }}>
            <TypingDots />
            <span className="truncate">{typingLabel}...</span>
          </div>
        )}
      </div>

      {/* ====== INPUT ====== */}
      <div className="relative z-20 px-3 pb-2 pt-1" style={{ background: "linear-gradient(to top, #06040b 75%, transparent)" }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.45), transparent)" }} />
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button
            aria-label="Menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
            style={{
              background: "rgba(18,11,32,0.95)",
              border: `1px solid ${PURPLE}`,
              boxShadow: "0 0 10px rgba(168,85,247,0.4)",
              color: PURPLE,
            }}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div
            className="relative flex-1 rounded-full"
            style={{
              background: "rgba(14,9,26,0.45)",
              border: `1px solid rgba(168,85,247,0.45)`,
              backdropFilter: "blur(22px) saturate(140%)",
              WebkitBackdropFilter: "blur(22px) saturate(140%)",
              boxShadow:
                "0 0 28px rgba(168,85,247,0.45), 0 0 60px rgba(124,58,237,0.18), inset 0 0 18px rgba(168,85,247,0.10), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); if (e.target.value) broadcastTyping(); }}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Message the Hunter Network..."
              maxLength={240}
              className="h-9 w-full rounded-full bg-transparent px-4 pr-10 text-[13px] text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || cooldownLeft > 0}
              aria-label="Send"
              className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full transition disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})`,
                boxShadow: "0 0 14px rgba(168,85,247,0.65)",
                color: "#fff",
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {cooldownLeft > 0 && (
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[10.5px]" style={{ color: PURPLE }}>
            <Clock className="h-3 w-3" />
            <span>You can send another message in {(cooldownLeft / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageCard = ({ message, grouped }: { message: ChatMessage; grouped: boolean }) => {
  const rank = getRank(message.player_level);
  const isBot = message.is_bot;

  if (isBot) {
    return (
      <div
        className={`msg-enter relative overflow-hidden rounded-lg px-2.5 py-1.5 ${grouped ? "mt-0.5" : "mt-1.5"}`}
        style={{
          background: "linear-gradient(135deg, rgba(91,33,182,0.6), rgba(24,12,52,0.9))",
          border: `1px solid rgba(168,85,247,0.6)`,
          boxShadow: "0 0 22px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: "linear-gradient(180deg,#c084fc,#4c1d95)", boxShadow: "0 0 14px rgba(168,85,247,0.9)" }}
        />
        {grouped ? (
          <div className="pl-10">
            <p className="text-[11.5px] leading-snug text-white/90">{message.content}</p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
              style={{
                background: "linear-gradient(180deg, #6d28d9, #1e0a45)",
                border: `1px solid ${PURPLE}`,
                boxShadow: "0 0 12px rgba(168,85,247,0.75)",
              }}
            >
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="font-display text-[11.5px] font-black uppercase tracking-[0.08em]"
                  style={{ color: "#f3e8ff", textShadow: "0 0 10px rgba(168,85,247,0.8)" }}
                >
                  KIRA SYSTEM
                </span>
                <span
                  className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-px font-display text-[8px] font-black uppercase tracking-[0.18em] text-white"
                  style={{
                    background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})`,
                    boxShadow: "0 0 10px rgba(168,85,247,0.8), inset 0 1px 0 rgba(255,255,255,0.25)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Shield className="h-2 w-2" />
                  BOT
                </span>
                <span className="ml-auto text-[9px] text-white/50">{formatTime(message.created_at)}</span>
              </div>
              <p className="mt-0.5 text-[11.5px] leading-snug text-white/90">{message.content}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const t = rankTheme[rank];

  // Grouped: just content, indented under avatar column
  if (grouped) {
    return (
      <div className="msg-enter pl-10 pr-2.5">
        <p className="break-words text-[11.5px] leading-snug text-white/85">{message.content}</p>
      </div>
    );
  }

  return (
    <div
      className="msg-enter mt-1.5 rounded-lg px-2.5 py-1.5 transition"
      style={{
        background: "linear-gradient(180deg, rgba(20,12,38,0.55), rgba(10,7,22,0.55))",
        border: `1px solid ${PURPLE_LINE}`,
        boxShadow: `0 0 8px rgba(168,85,247,0.06), inset 0 1px 0 rgba(255,255,255,0.03)`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full"
          style={{
            border: `1.5px solid ${t.border}`,
            boxShadow: `0 0 7px ${t.glow}`,
          }}
        >
          {message.avatar_url ? (
            <img src={message.avatar_url} alt={message.player_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center font-display text-sm font-extrabold text-white" style={{ background: t.grad }}>
              {message.player_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="truncate font-display text-[12px] font-extrabold tracking-wide"
              style={{ color: t.name, textShadow: `0 0 6px ${t.glow}` }}
            >
              {message.player_name}
            </span>
            <RankBadge rank={rank} size="sm" />
            <span className="ml-auto shrink-0 text-[9px] text-white/45">{formatTime(message.created_at)}</span>
          </div>
          <p className="mt-0.5 break-words text-[11.5px] leading-snug text-white/85">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default HunterChat;
