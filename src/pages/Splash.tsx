import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import introAsset from "@/assets/intro.mp4.asset.json";

const Splash = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const goNext = () => {
    if (loading) {
      setTimeout(goNext, 100);
      return;
    }
    if (user) {
      navigate("/home", { replace: true });
    } else {
      const userExists = localStorage.getItem("userExists") === "true";
      navigate(userExists ? "/login" : "/register", { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <video
        src={introAsset.url}
        autoPlay
        playsInline
        muted={false}
        controls={false}
        onEnded={goNext}
        onError={goNext}
        className="h-full w-full object-contain"
      />
    </div>
  );
};

export default Splash;
