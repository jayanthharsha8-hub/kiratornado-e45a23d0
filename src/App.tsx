import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";
import { WalletNotifier } from "@/components/WalletNotifier";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Register from "./pages/Register";
import RegisterEmail from "./pages/RegisterEmail";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import TournamentDetails from "./pages/TournamentDetails";
import TournamentSlots from "./pages/TournamentSlots";
import CategoryPage from "./pages/CategoryPage";
import Leaderboard from "./pages/Leaderboard";
import ProfilePage from "./pages/Profile";
import Tournaments from "./pages/Tournaments";
import WalletPage from "./pages/WalletPage";
import WalletWithdraw from "./pages/WalletWithdraw";
import WalletRedeem from "./pages/WalletRedeem";
import WalletRedeemConfirm from "./pages/WalletRedeemConfirm";
import WalletUpi from "./pages/WalletUpi";
import TransactionHistory from "./pages/TransactionHistory";
import HunterChat from "./pages/HunterChat";
import DailyStreak from "./pages/DailyStreak";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStreak from "./pages/admin/StreakAdmin";

import AdminTournaments from "./pages/admin/Tournaments";
import AdminBanners from "./pages/admin/Banners";
import AdminPlayers from "./pages/admin/Players";
import AdminWallet from "./pages/admin/WalletAdmin";
import AdminNotifications from "./pages/admin/Notifications";
import LeaderboardAdmin from "./pages/admin/LeaderboardAdmin";
import AdminReports from "./pages/admin/Reports";
import AdminAvatars from "./pages/admin/Avatars";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner theme="dark" richColors position="top-center" />
        <BrowserRouter>
          <WalletNotifier />
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/email" element={<RegisterEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/battle-royale" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
            <Route path="/category/:category" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
            <Route path="/tournament/:id" element={<ProtectedRoute><TournamentDetails /></ProtectedRoute>} />
            <Route path="/tournament-slots/:id" element={<ProtectedRoute><TournamentSlots /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
            <Route path="/custom-rooms" element={<Navigate to="/category/custom_rooms" replace />} />
            <Route path="/weekly-rankings" element={<Navigate to="/category/weekly_rankings" replace />} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/wallet/withdraw" element={<ProtectedRoute><WalletWithdraw /></ProtectedRoute>} />
            <Route path="/wallet/redeem" element={<ProtectedRoute><WalletRedeem /></ProtectedRoute>} />
            <Route path="/wallet/redeem/confirm" element={<ProtectedRoute><WalletRedeemConfirm /></ProtectedRoute>} />
            <Route path="/wallet/upi" element={<ProtectedRoute><WalletUpi /></ProtectedRoute>} />
            <Route path="/wallet/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
            <Route path="/hunter-chat" element={<ProtectedRoute><HunterChat /></ProtectedRoute>} />
            <Route path="/daily-streak" element={<ProtectedRoute><DailyStreak /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
            <Route path="/admin/streak" element={<AdminRoute><AdminLayout><AdminStreak /></AdminLayout></AdminRoute>} />

            <Route path="/admin/tournaments" element={<AdminRoute><AdminLayout><AdminTournaments /></AdminLayout></AdminRoute>} />
            <Route path="/admin/banners" element={<AdminRoute><AdminLayout><AdminBanners /></AdminLayout></AdminRoute>} />
            <Route path="/admin/players" element={<AdminRoute><AdminLayout><AdminPlayers /></AdminLayout></AdminRoute>} />
            <Route path="/admin/avatars" element={<AdminRoute><AdminLayout><AdminAvatars /></AdminLayout></AdminRoute>} />
            <Route path="/admin/wallet" element={<AdminRoute><AdminLayout><AdminWallet /></AdminLayout></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminLayout><AdminNotifications /></AdminLayout></AdminRoute>} />
            <Route path="/admin/leaderboard" element={<AdminRoute><AdminLayout><LeaderboardAdmin /></AdminLayout></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminLayout><AdminReports /></AdminLayout></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
