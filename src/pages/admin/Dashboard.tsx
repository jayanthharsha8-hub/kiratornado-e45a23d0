import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Users, Trophy, UserCheck, Wallet, Shield, Swords } from "lucide-react";

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="panel rounded p-4 animate-float-up">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-bold text-foreground text-glow-soft">{value}</div>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, tournaments: 0, registrations: 0, pendingWallet: 0, pendingReports: 0, liveTournaments: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tournaments").select("id", { count: "exact", head: true }),
      supabase.from("registrations").select("id", { count: "exact", head: true }),
      supabase.from("wallet_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("tournaments").select("id", { count: "exact", head: true }).eq("status", "live"),
    ]).then(([u, t, r, w, rep, live]) => {
      setStats({
        users: u.count ?? 0,
        tournaments: t.count ?? 0,
        registrations: r.count ?? 0,
        pendingWallet: w.count ?? 0,
        pendingReports: rep.count ?? 0,
        liveTournaments: live.count ?? 0,
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">
          Admin Dashboard
        </h1>
        <p className="text-xs text-muted-foreground">System overview -- ZEOX</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={Users} label="Total Users" value={stats.users} />
        <StatCard icon={Trophy} label="Tournaments" value={stats.tournaments} />
        <StatCard icon={UserCheck} label="Registrations" value={stats.registrations} />
        <StatCard icon={Wallet} label="Pending Wallet" value={stats.pendingWallet} />
        <StatCard icon={Shield} label="Pending Reports" value={stats.pendingReports} />
        <StatCard icon={Swords} label="Live Matches" value={stats.liveTournaments} />
      </div>

      <SystemPanel title="System Status">
        <p className="text-sm text-foreground/85">
          All systems operational. Manage tournaments, players, reports, and wallet requests from the sidebar.
        </p>
      </SystemPanel>
    </div>
  );
}
