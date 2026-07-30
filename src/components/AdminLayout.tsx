import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Trophy, Users, Wallet, Bell, LogOut, ChevronLeft, ChevronRight, Home, Award, Shield, Images, UserCircle2, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/tournaments", icon: Trophy, label: "Tournaments" },
  { to: "/admin/banners", icon: Images, label: "Banners" },
  { to: "/admin/streak", icon: Flame, label: "Daily Streak" },
  { to: "/admin/coin-store", icon: Coins, label: "Coin Store" },
  { to: "/admin/avatars", icon: UserCircle2, label: "Profile Pics" },
  { to: "/admin/players", icon: Users, label: "Players" },
  { to: "/admin/wallet", icon: Wallet, label: "Wallet" },
  { to: "/admin/leaderboard", icon: Award, label: "Leaderboard" },
  { to: "/admin/reports", icon: Shield, label: "Reports" },
  { to: "/admin/notifications", icon: Bell, label: "Notifications" },
];


export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen scanline">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />

      <aside
        className={cn(
          "sticky top-0 z-40 flex h-screen flex-col border-r border-primary/30 bg-background/95 backdrop-blur transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <div className="flex items-center justify-between border-b border-primary/20 px-3 py-4">
          {!collapsed && <Logo size={28} withText />}
          <button onClick={() => setCollapsed((p) => !p)} className="text-primary hover:text-primary-glow">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "border border-primary/50 bg-primary/10 text-primary text-glow-soft glow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="font-display text-xs uppercase tracking-widest">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-primary/20 p-2">
          <button
            onClick={() => navigate("/home")}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Home className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="font-display text-xs uppercase tracking-widest">Player View</span>}
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="font-display text-xs uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
};
