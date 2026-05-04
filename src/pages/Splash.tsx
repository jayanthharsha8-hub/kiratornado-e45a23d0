import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/kira-tornado-intro.jpg";

const Splash = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fadeOut, setFadeOut] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const flashT = setTimeout(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }, 3200);
    const fadeT = setTimeout(() => setFadeOut(true), 5000);
    const navT = setTimeout(() => {
      if (loading) return;
      if (user) {
        navigate("/home", { replace: true });
      } else {
        const userExists = localStorage.getItem("userExists") === "true";
        navigate(userExists ? "/login" : "/register", { replace: true });
      }
    }, 5500);
    return () => {
      clearTimeout(flashT);
      clearTimeout(fadeT);
      clearTimeout(navT);
    };
  }, [navigate, user, loading]);

  return (
    <>
      <style>{`
        @keyframes kt-smoke-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes kt-smoke-drift {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          100% { transform: translate(-50%, -50%) scale(1.15) rotate(8deg); }
        }
        @keyframes kt-logo-in {
          0% { opacity: 0; transform: scale(0.82); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes kt-logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 18px rgba(168,85,247,0.55)) drop-shadow(0 0 40px rgba(168,85,247,0.35)); }
          50%      { filter: drop-shadow(0 0 28px rgba(192,132,252,0.85)) drop-shadow(0 0 70px rgba(168,85,247,0.6)); }
        }
        @keyframes kt-aura-pulse {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes kt-shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-2px, 0); }
          80% { transform: translate(1px, 2px); }
        }
        @keyframes kt-tagline-in {
          0% { opacity: 0; transform: translateY(8px); letter-spacing: 0.2em; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 0.45em; }
        }
        @keyframes kt-flash {
          0% { opacity: 0; }
          30% { opacity: 0.75; }
          100% { opacity: 0; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 overflow-hidden"
        style={{
          background: "#000",
          opacity: fadeOut ? 0 : 1,
          transition: "opacity 500ms ease-in-out",
        }}
      >
        {/* Subtle purple radial gradient backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(88,28,135,0.35) 0%, rgba(30,10,60,0.15) 35%, #000 75%)",
          }}
        />

        {/* Purple smoke layer 1 */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: "140vmax",
            height: "140vmax",
            background:
              "radial-gradient(circle at 30% 60%, rgba(168,85,247,0.18), transparent 45%), radial-gradient(circle at 70% 40%, rgba(139,92,246,0.14), transparent 50%)",
            opacity: 0,
            animation:
              "kt-smoke-in 1000ms 500ms ease-out forwards, kt-smoke-drift 8s 1500ms ease-in-out infinite alternate",
            filter: "blur(40px)",
          }}
        />
        {/* Smoke layer 2 (deeper) */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: "120vmax",
            height: "120vmax",
            background:
              "radial-gradient(circle at 50% 50%, rgba(126,34,206,0.12), transparent 55%)",
            opacity: 0,
            animation:
              "kt-smoke-in 1000ms 700ms ease-out forwards, kt-smoke-drift 10s 1700ms ease-in-out infinite alternate-reverse",
            filter: "blur(60px)",
          }}
        />

        {/* Soft circular energy aura behind logo */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
          style={{
            width: 460,
            height: 460,
            background:
              "radial-gradient(circle, rgba(192,132,252,0.45) 0%, rgba(168,85,247,0.22) 35%, transparent 70%)",
            filter: "blur(20px)",
            transform: "translate(-50%, -50%)",
            animation: "kt-aura-pulse 2.4s 1500ms ease-in-out infinite",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        />

        {/* Centered logo + tagline with micro shake */}
        <div
          className="relative z-10 flex h-full w-full flex-col items-center justify-center"
          style={{ animation: "kt-shake 2.6s ease-in-out infinite" }}
        >
          <img
            src={logoImg}
            alt="KIRA TORNADO"
            width={300}
            height={300}
            className="select-none"
            style={{
              width: "min(74vw, 320px)",
              height: "auto",
              opacity: 0,
              animation:
                "kt-logo-in 1500ms 1500ms cubic-bezier(0.16,1,0.3,1) forwards, kt-logo-pulse 2.4s 3000ms ease-in-out infinite",
              mixBlendMode: "screen",
            }}
          />

          <p
            className="mt-2 font-display text-[12px] font-semibold uppercase"
            style={{
              color: "#e9d5ff",
              letterSpacing: "0.45em",
              textShadow:
                "0 0 8px rgba(192,132,252,0.85), 0 0 20px rgba(168,85,247,0.55)",
              opacity: 0,
              animation: "kt-tagline-in 900ms 3500ms ease-out forwards",
            }}
          >
            Unleash the Storm
          </p>
        </div>

        {/* Lightning flash overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(216,180,254,0.9), rgba(168,85,247,0.4) 30%, transparent 70%)",
            opacity: 0,
            animation: flash ? "kt-flash 300ms ease-out" : "none",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </>
  );
};

export default Splash;
