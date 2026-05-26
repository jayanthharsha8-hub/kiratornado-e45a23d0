import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const allowed = user.email === "jayanthharsha8@gmail.com";
    setIsAdmin(allowed);
    setLoading(false);
    if (allowed) supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  }, [user, authLoading]);

  return { isAdmin, loading, user };
};
