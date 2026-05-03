import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";
import hunterIcon from "@/assets/hunter-icon.png";

const TEXTS = [
  "SYSTEM INITIALIZING...",
  "HUNTER DETECTED",
  "SHADOW ARMY ACTIVATED",
  "ENTER THE SYSTEM",
];

const Splash = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [textIdx, setTextIdx] = useState(0);
  const [bootPlayed, setBootPlayed] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (!bootPlayed) {
        playSound("boot");
        setBootPlayed(true);
      }
    };
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [bootPlayed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIdx(prev => (prev < TEXTS.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) return;
      if (user) {
        navigate("/home", { replace: true });
      } else {
        const userExists = localStorage.getItem("userExists") === "true";
        navigate(userExists ? "/login" : "/register", { replace: true });
      }
    }, 2800);
    return () => clearTimeout(t);
  }, [navigate, user, loading]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "#05070d" }}>
      <Particles />

      {/* Purple aura behind icon */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full blur-3xl animate-pulse-glow"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(168,85,247,0.15) 40%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-float-up">
        <div className="relative">
          <img
            src={hunterIcon}
            alt="Shadow Hunter"
            width={220}
            height={220}
            className="rounded-3xl drop-shadow-[0_0_40px_rgba(168,85,247,0.7)] animate-flicker"
            style={{ animationDuration: "3s" }}
          />
        </div>

        <p
          className="h-5 text-[11px] uppercase tracking-[0.4em] animate-flicker"
          style={{ color: "#c4b5fd", animationDelay: "0.3s" }}
        >
          {TEXTS[textIdx]}
        </p>

        <div className="h-1 w-56 overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full"
            style={{
              animation: "splash-bar 2.8s ease-out forwards",
              background: "linear-gradient(90deg, #a855f7, #00cfff)",
              boxShadow: "0 0 12px rgba(168,85,247,0.8)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Splash;
