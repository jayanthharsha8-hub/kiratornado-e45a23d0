import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setCompleted(null); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setCompleted(data?.profile_completed ?? false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || (user && completed === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (completed === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};
