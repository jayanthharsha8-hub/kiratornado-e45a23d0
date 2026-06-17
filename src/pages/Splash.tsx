import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import introAsset from "@/assets/intro.mp4.asset.json";

const Splash = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigatedRef = useRef(false);
  const [ready, setReady] = useState(false);

  const goNext = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    const proceed = () => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        const userExists = localStorage.getItem("userExists") === "true";
        navigate(userExists ? "/login" : "/register", { replace: true });
      }
    };
    if (loading) {
      setTimeout(proceed, 150);
    } else {
      proceed();
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Force muted autoplay (browsers block unmuted autoplay in production).
    v.muted = true;
    (v as HTMLVideoElement & { playsInline: boolean }).playsInline = true;

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          // If autoplay fails entirely, skip to app after a short delay.
          setTimeout(goNext, 500);
        });
      }
    };

    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("loadeddata", tryPlay, { once: true });

    // Hard safety: never get stuck on splash longer than 9s.
    const failsafe = setTimeout(goNext, 9000);

    return () => {
      clearTimeout(failsafe);
      v.removeEventListener("loadeddata", tryPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        src={introAsset.url}
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        onCanPlay={() => setReady(true)}
        onEnded={goNext}
        onError={goNext}
        className="h-full w-full object-contain"
      />
    </div>
  );
};

export default Splash;
