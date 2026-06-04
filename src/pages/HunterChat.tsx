import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Shield, Coins, Plus, ShieldAlert, Bot, Clock, Menu } from "lucide-react";
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

// Detection patterns for KIRA SYSTEM bot moderation
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

// Color hash for username based on rank
const rankColor = (rank: string) => {
  switch (rank) {
    case "S": return "text-[hsl(45_100%_60%)]";
    case "A": return "text-[hsl(35_100%_60%)]";
    case "B": return "text-primary";
    case "C": return "text-[hsl(140_70%_55%)]";
    case "D": return "text-[hsl(280_80%_70%)]";
    default: return "text-muted-foreground";
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

  // Load profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("username,player_name,player_level,coins,avatar_url")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as MyProfile); });
  }, [user]);

  // Load initial messages
  useEffect(() => {
    supabase.from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (data) setMessages((data as ChatMessage[]).reverse());
      });
  }, []);

  // Realtime subscription + presence
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
        const count = Object.keys(state).length;
        setOnlineCount(Math.max(count, 1));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Cooldown ticker
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

    // Bot moderation — runs server-side via service role would be ideal,
    // but for demo we let any client insert a bot-style notice via RPC... 
    // Since policy blocks is_bot=true, we render a *local* warning card instead.
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
    <div className="relative flex h-[100dvh] flex-col bg-background scanline">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />

      {/* HEADER */}
      <header className="relative z-20 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-primary hover:text-glow-soft">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Logo size={22} />
          <div className="flex-1" />
          {profile && (
            <div className="flex items-center gap-1.5 rounded border border-primary/50 bg-primary/10 px-2 py-1">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <div className="leading-tight">
                <div className="font-display text-[10px] font-bold uppercase tracking-widest text-primary text-glow-soft">
                  {myRank} Rank
                </div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Lvl {profile.player_level}</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1 rounded border border-primary/40 bg-background/60 px-2 py-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            <span className="font-display text-xs text-foreground">{profile?.coins.toLocaleString() ?? 0}</span>
            <Plus className="h-3 w-3 text-primary" />
          </div>
        </div>

        {/* TITLE STRIP */}
        <div className="mx-auto max-w-md px-4 pb-3">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-widest text-foreground text-glow">
            Hunter Chat
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(140_70%_55%)] shadow-[0_0_8px_hsl(140_70%_55%)] animate-pulse" />
            <span className="font-display uppercase tracking-widest text-muted-foreground">
              {onlineCount} Hunters Online
            </span>
          </div>
        </div>
      </header>

      {/* MESSAGES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md space-y-2.5 px-3 py-3">
          {/* SYSTEM NOTICE */}
          <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-card/60 px-3 py-2.5 glow-soft">
            <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
            <p className="flex-1 text-xs text-muted-foreground">
              Be respectful, Hunters. Misbehavior leads to warnings or bans.
            </p>
            <span className="flex items-center gap-1 font-display text-[10px] uppercase tracking-widest text-primary">
              <Shield className="h-3 w-3" /> Kira System
            </span>
          </div>

          {messages.map((m) => (
            <MessageCard key={m.id} message={m} />
          ))}

          {messages.length === 0 && (
            <p className="py-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
              No messages yet. Be the first Hunter to speak.
            </p>
          )}
        </div>
      </div>

      {/* INPUT */}
      <div className="relative z-20 border-t border-primary/30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-md px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              aria-label="Menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/60 bg-primary/10 text-primary glow-soft"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Type your message..."
                maxLength={240}
                className="h-10 w-full rounded-full border border-primary/40 bg-card/60 px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending || cooldownLeft > 0}
                aria-label="Send"
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full text-primary hover:bg-primary/15 disabled:text-primary/40"
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

const MessageCard = ({ message }: { message: ChatMessage }) => {
  const rank = getRank(message.player_level);
  const isBot = message.is_bot;

  if (isBot) {
    return (
      <div className="rounded-lg border border-primary/60 bg-primary/10 p-3 glow-soft animate-float-up">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-primary/70 bg-background text-primary glow-soft">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold uppercase tracking-wider text-primary text-glow-soft">
                KIRA SYSTEM
              </span>
              <span className="rounded border border-primary/60 bg-primary/20 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-primary">
                BOT
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-foreground/90">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/25 bg-card/50 p-2.5 hover:border-primary/40 transition-colors animate-float-up">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-primary/40 bg-primary/10">
          {message.avatar_url ? (
            <img src={message.avatar_url} alt={message.player_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center font-display text-sm font-bold text-primary">
              {message.player_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate font-display text-sm font-bold ${rankColor(rank)}`}>
              {message.player_name}
            </span>
            <span className="shrink-0 rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-primary">
              {rank} Rank Hunter
            </span>
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
          </div>
          <p className="mt-0.5 break-words text-sm text-foreground/90">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default HunterChat;
