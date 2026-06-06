import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Shield, Bot, Clock, Menu, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import heroBg from "@/assets/hunter-hero-bg.jpg";

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

// Color per rank (matches reference palette)
const rankNameColor: Record<string, string> = {
  S: "#ff4d5a",
  A: "#f5a623",
  B: "#3ea6ff",
  C: "#4ade80",
  D: "#c084fc",
  E: "#e2e8f0",
};
const rankLabelColor: Record<string, string> = {
  S: "#f5a623",
  A: "#f5a623",
  B: "#3ea6ff",
  C: "#4ade80",
  D: "#c084fc",
  E: "#94a3b8",
};

const PURPLE = "#a855f7";
const PURPLE_DEEP = "#7c3aed";
const PURPLE_SOFT = "rgba(168,85,247,0.35)";

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
    <div className="relative flex h-[100dvh] flex-col overflow-hidden" style={{ background: "#08060d" }}>
      {/* HEADER with hero art */}
      <header className="relative z-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "right center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #08060d 0%, rgba(8,6,13,0.85) 35%, rgba(8,6,13,0.35) 70%, rgba(8,6,13,0.6) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: "linear-gradient(to bottom, transparent, #08060d)" }}
        />

        {/* Top bar */}
        <div className="relative mx-auto flex max-w-md items-center gap-2 px-4 pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2">
            <Logo size={26} />
            <div className="leading-none">
              <div className="font-display text-base font-black uppercase tracking-widest text-white" style={{ textShadow: `0 0 12px ${PURPLE_SOFT}` }}>KIRA</div>
              <div className="font-display text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: PURPLE }}>TORNADO</div>
            </div>
          </button>
          <div className="flex-1" />

          {/* Center S Rank badge */}
          {profile && (
            <div className="flex items-center gap-2 rounded-lg px-2 py-1">
              <div
                className="grid h-9 w-9 place-items-center rounded-md"
                style={{
                  background: "linear-gradient(180deg, #8b5a1a, #4a2a08)",
                  boxShadow: `0 0 12px rgba(245,166,35,0.55), inset 0 0 6px rgba(255,200,80,0.4)`,
                  border: "1px solid #f5a623",
                }}
              >
                <Shield className="h-4 w-4" style={{ color: "#ffd76b" }} fill="#7c4a10" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-[11px] font-black uppercase tracking-[0.12em] text-white">
                  {myRank} RANK HUNTER
                </div>
                <div className="font-display text-[10px] uppercase tracking-[0.15em]" style={{ color: PURPLE }}>
                  Level {profile.player_level}
                </div>
              </div>
            </div>
          )}
          <div className="flex-1" />

          {/* Wallet pill */}
          <div
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5"
            style={{
              background: "rgba(20,12,35,0.85)",
              border: `1px solid ${PURPLE_SOFT}`,
              boxShadow: `0 0 14px rgba(124,58,237,0.35)`,
            }}
          >
            <div className="h-3 w-3 rotate-45" style={{ background: PURPLE, boxShadow: `0 0 6px ${PURPLE}` }} />
            <span className="font-display text-xs font-bold text-white">{profile?.coins.toLocaleString() ?? 0}</span>
            <button className="grid h-4 w-4 place-items-center rounded-full text-white" style={{ background: PURPLE_DEEP }}>
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="relative mx-auto max-w-md px-4 pb-5 pt-6">
          <h1
            className="font-display text-4xl font-black uppercase leading-none tracking-[0.04em]"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 0 18px rgba(168,85,247,0.55))`,
            }}
          >
            GLOBAL CHAT
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full" style={{ background: "#22c55e", opacity: 0.7 }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            </span>
            <span className="text-[13px] font-medium text-white/90">{onlineCount} Hunters Online</span>
          </div>
        </div>
      </header>

      {/* MESSAGES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md space-y-3 px-4 pb-4 pt-1">
          {/* System notice */}
          <div
            className="relative flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: "linear-gradient(180deg, rgba(30,18,55,0.9), rgba(15,10,30,0.9))",
              border: `1px solid ${PURPLE_SOFT}`,
              boxShadow: `0 0 18px rgba(124,58,237,0.25), inset 0 0 12px rgba(124,58,237,0.1)`,
            }}
          >
            <Shield className="h-4 w-4 shrink-0" style={{ color: PURPLE }} />
            <p className="flex-1 text-[12.5px] text-white/85">Be respectful, Hunters. Misbehavior leads to warnings or bans.</p>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" style={{ color: PURPLE }} />
              <span className="font-display text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: PURPLE, textShadow: `0 0 8px ${PURPLE_SOFT}` }}>
                KIRA SYSTEM
              </span>
            </div>
          </div>

          {messages.map((m) => <MessageCard key={m.id} message={m} />)}

          {messages.length === 0 && (
            <p className="py-12 text-center font-display text-xs uppercase tracking-[0.2em] text-white/40">
              No messages yet. Be the first Hunter to speak.
            </p>
          )}
        </div>
      </div>

      {/* INPUT */}
      <div className="relative z-20 px-4 pb-3 pt-2" style={{ background: "linear-gradient(to top, #08060d 70%, transparent)" }}>
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button
            aria-label="Menu"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
            style={{
              background: "rgba(20,12,35,0.9)",
              border: `2px solid ${PURPLE}`,
              boxShadow: `0 0 16px rgba(168,85,247,0.6), inset 0 0 10px rgba(168,85,247,0.2)`,
              color: PURPLE,
            }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div
            className="relative flex-1 rounded-full"
            style={{
              background: "rgba(15,10,28,0.9)",
              border: `1px solid ${PURPLE_SOFT}`,
              boxShadow: `inset 0 0 10px rgba(124,58,237,0.15)`,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Type your message..."
              maxLength={240}
              className="h-12 w-full rounded-full bg-transparent px-5 pr-12 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || cooldownLeft > 0}
              aria-label="Send"
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full transition disabled:opacity-40"
              style={{ color: PURPLE }}
            >
              <Send className="h-5 w-5" style={{ filter: `drop-shadow(0 0 6px ${PURPLE})` }} />
            </button>
          </div>
        </div>
        {cooldownLeft > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px]" style={{ color: PURPLE }}>
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
        className="relative overflow-hidden rounded-xl px-4 py-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(60,30,110,0.55) 0%, rgba(25,12,50,0.85) 60%, rgba(80,30,140,0.4) 100%)",
          border: `1px solid ${PURPLE}`,
          boxShadow: `0 0 22px rgba(168,85,247,0.5), inset 0 0 18px rgba(168,85,247,0.15)`,
        }}
      >
        <div className="relative flex gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
            style={{
              background: "linear-gradient(180deg, #4c1d95, #1e0a45)",
              border: `1.5px solid ${PURPLE}`,
              boxShadow: `0 0 12px rgba(168,85,247,0.7)`,
            }}
          >
            <Shield className="h-6 w-6 text-white" />
            <span className="absolute bottom-0.5 font-display text-[8px] font-black tracking-wider text-white/80">KIRA</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-[14px] font-black uppercase tracking-[0.06em]" style={{ color: PURPLE, textShadow: `0 0 10px ${PURPLE_SOFT}` }}>
                KIRA SYSTEM
              </span>
              <span
                className="rounded px-1.5 py-0.5 font-display text-[9px] font-black uppercase tracking-[0.18em] text-white"
                style={{ background: PURPLE_DEEP, boxShadow: `0 0 8px rgba(124,58,237,0.7)` }}
              >
                BOT
              </span>
              <span className="ml-auto text-[10px] text-white/50">{formatTime(message.created_at)}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-white/90">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  const nameColor = rankNameColor[rank];
  const labelColor = rankLabelColor[rank];

  return (
    <div
      className="rounded-xl px-3.5 py-3"
      style={{
        background: "linear-gradient(180deg, rgba(20,14,38,0.85), rgba(12,8,22,0.85))",
        border: "1px solid rgba(124,58,237,0.18)",
        boxShadow: "0 0 10px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex gap-3">
        <div
          className="h-12 w-12 shrink-0 overflow-hidden rounded-xl"
          style={{ border: `1.5px solid ${PURPLE_SOFT}`, boxShadow: `0 0 8px rgba(124,58,237,0.35)` }}
        >
          {message.avatar_url ? (
            <img src={message.avatar_url} alt={message.player_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center font-display text-base font-extrabold text-white" style={{ background: "linear-gradient(180deg, #3b1a6b, #14072e)" }}>
              {message.player_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-[14px] font-extrabold tracking-wide" style={{ color: nameColor }}>
              {message.player_name}
            </span>
            <span className="shrink-0 font-display text-[11px] font-bold" style={{ color: labelColor }}>
              {rank} Rank Hunter
            </span>
            <span className="ml-auto shrink-0 text-[10px] text-white/45">{formatTime(message.created_at)}</span>
          </div>
          <p className="mt-1 break-words text-[13.5px] leading-relaxed text-white/85">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default HunterChat;
