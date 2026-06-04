import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Shield, Coins, Plus, ShieldAlert, Bot, Clock, Plus as PlusIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

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
  if (LINK_RE.test(text)) return "Links share cheyyadam nishedham. Warning issued.";
  if (PASSWORD_RE.test(text)) return "Passwords share cheyyadam nishedham. Warning issued.";
  if (ROOM_ID_RE.test(text)) return "Room ID's share cheyyadam nishedham. Warning issued.";
  if (TOXIC_RE.test(text)) return "Toxic/abusive language detect ayyindi. Be respectful, Hunter.";
  return null;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const rankColor = (rank: string) => {
  switch (rank) {
    case "S": return "text-[hsl(45_100%_62%)]";
    case "A": return "text-[hsl(28_100%_62%)]";
    case "B": return "text-primary";
    case "C": return "text-[hsl(140_70%_58%)]";
    case "D": return "text-[hsl(280_85%_72%)]";
    default: return "text-foreground";
  }
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
      .then(({ data }) => {
        if (data) setMessages((data as ChatMessage[]).reverse());
      });
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
    <div className="relative flex h-[100dvh] flex-col bg-background scanline overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% 0%, hsl(199 100% 50% / 0.18), transparent 60%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "radial-gradient(80% 60% at 50% 100%, hsl(199 100% 50% / 0.12), transparent 70%)" }} />
      </div>

      {/* HEADER */}
      <header className="relative z-20 border-b border-primary/40 bg-background/80 backdrop-blur-xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_0_12px_hsl(var(--primary)/0.8)]" />

        {/* Top action row */}
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 pt-3">
          <button
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 place-items-center rounded-md border border-primary/50 bg-card/60 text-primary glow-soft hover:bg-primary/15"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Logo size={22} />
          <div className="flex-1" />

          {/* Rank floating card */}
          {profile && (
            <div className="relative flex items-center gap-2 rounded-md border border-primary/60 bg-gradient-to-b from-primary/20 to-background/40 px-2.5 py-1.5 shadow-[0_0_14px_hsl(var(--primary)/0.35),inset_0_0_10px_hsl(var(--primary)/0.15)]">
              <div className="grid h-7 w-7 place-items-center rounded border border-primary/70 bg-background/60 text-primary glow-soft">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <div className="leading-none">
                <div className="font-display text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary text-glow-soft">
                  {myRank} Rank
                </div>
                <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Lvl {profile.player_level}</div>
              </div>
            </div>
          )}

          {/* Wallet floating card */}
          <div className="flex items-center gap-1.5 rounded-md border border-primary/60 bg-gradient-to-b from-primary/15 to-background/40 px-2.5 py-1.5 shadow-[0_0_14px_hsl(var(--primary)/0.3)]">
            <Coins className="h-3.5 w-3.5 text-primary text-glow-soft" />
            <span className="font-display text-xs font-bold text-foreground">{profile?.coins.toLocaleString() ?? 0}</span>
            <button className="grid h-4 w-4 place-items-center rounded-full border border-primary/70 bg-primary/20 text-primary">
              <PlusIcon className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Title block */}
        <div className="mx-auto max-w-md px-4 pb-4 pt-3">
          <h1 className="font-display text-3xl font-black uppercase leading-none tracking-[0.18em] text-foreground text-glow">
            Hunter <span className="text-primary">Chat</span>
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(140_70%_55%)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(140_70%_55%)] shadow-[0_0_8px_hsl(140_70%_55%)]" />
            </span>
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(140_70%_60%)]">
              {onlineCount} Hunters Online
            </span>
            <div className="ml-2 h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
          </div>
        </div>
      </header>

      {/* MESSAGES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md space-y-3 px-3 py-4">
          {/* System notice */}
          <SystemNoticeCard />

          {messages.map((m) => (
            <MessageCard key={m.id} message={m} />
          ))}

          {messages.length === 0 && (
            <p className="py-12 text-center font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
              No messages yet. Be the first Hunter to speak.
            </p>
          )}
        </div>
      </div>

      {/* INPUT */}
      <div className="relative z-20 border-t border-primary/40 bg-background/85 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_0_12px_hsl(var(--primary)/0.7)]" />
        <div className="mx-auto max-w-md px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              aria-label="Add"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/70 bg-gradient-to-b from-primary/25 to-primary/10 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.55),inset_0_0_8px_hsl(var(--primary)/0.3)]"
            >
              <Plus className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Type your message..."
                maxLength={240}
                className="h-11 w-full rounded-full border border-primary/50 bg-card/70 px-5 pr-14 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-[inset_0_0_10px_hsl(var(--primary)/0.12)] focus:border-primary focus:shadow-[0_0_14px_hsl(var(--primary)/0.45),inset_0_0_10px_hsl(var(--primary)/0.2)] focus:outline-none transition"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending || cooldownLeft > 0}
                aria-label="Send"
                className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-primary to-primary/70 text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.7)] disabled:opacity-40 disabled:shadow-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          {cooldownLeft > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-primary/80">
              <Clock className="h-3 w-3" />
              <span>You can send another message in {(cooldownLeft / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SystemNoticeCard = () => (
  <div className="relative overflow-hidden rounded-xl border border-primary/60 bg-gradient-to-br from-primary/15 via-background/60 to-background/40 p-3.5 shadow-[0_0_22px_hsl(var(--primary)/0.35),inset_0_0_18px_hsl(var(--primary)/0.12)]">
    <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 0% 50%, hsl(var(--primary)/0.18), transparent 60%)" }} />
    <div className="relative flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/70 bg-background/70 text-primary glow-soft">
        <ShieldAlert className="h-4 w-4" />
      </div>
      <p className="flex-1 text-[13px] leading-snug text-foreground/85">
        Be respectful, Hunters. Misbehavior leads to warnings or bans.
      </p>
      <span className="flex items-center gap-1 rounded-md border border-primary/60 bg-primary/15 px-2 py-1 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-primary text-glow-soft">
        <Shield className="h-3 w-3" /> Kira
      </span>
    </div>
  </div>
);

const MessageCard = ({ message }: { message: ChatMessage }) => {
  const rank = getRank(message.player_level);
  const isBot = message.is_bot;

  if (isBot) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-primary/70 bg-gradient-to-br from-primary/20 via-primary/5 to-background/40 p-4 shadow-[0_0_28px_hsl(var(--primary)/0.45),inset_0_0_22px_hsl(var(--primary)/0.18)] animate-float-up">
        <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-primary/30 blur-2xl" />
        <div className="pointer-events-none absolute -right-8 -bottom-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex gap-3.5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-primary/40 blur-md" />
            <div className="relative grid h-12 w-12 place-items-center rounded-xl border-2 border-primary bg-background text-primary shadow-[0_0_16px_hsl(var(--primary)/0.8)]">
              <Bot className="h-6 w-6" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.08em] text-primary text-glow">
                KIRA SYSTEM
              </span>
              <span className="rounded-md border border-primary bg-primary/25 px-1.5 py-0.5 font-display text-[9px] font-black uppercase tracking-[0.2em] text-primary text-glow-soft shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
                BOT
              </span>
              <span className="ml-auto font-display text-[10px] uppercase tracking-widest text-primary/70">{formatTime(message.created_at)}</span>
            </div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-foreground/95">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-primary/30 bg-gradient-to-br from-card/80 to-background/40 p-3.5 shadow-[0_0_14px_hsl(var(--primary)/0.12),inset_0_0_10px_hsl(var(--primary)/0.05)] transition hover:border-primary/60 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] animate-float-up">
      <div className="flex gap-3.5">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md opacity-70" />
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-primary/70 bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
            {message.avatar_url ? (
              <img src={message.avatar_url} alt={message.player_name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center font-display text-base font-extrabold text-primary text-glow-soft">
                {message.player_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate font-display text-[15px] font-extrabold tracking-wide ${rankColor(rank)}`}>
              {message.player_name}
            </span>
            <span className="shrink-0 rounded-md border border-primary/50 bg-primary/10 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
              {rank} Rank Hunter
            </span>
            <span className="ml-auto shrink-0 font-display text-[10px] uppercase tracking-widest text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
          <p className="mt-1.5 break-words text-[14px] leading-relaxed text-foreground/90">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default HunterChat;
