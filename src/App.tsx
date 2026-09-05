import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { AgeGate } from "@/components/AgeGate";
import { AppLayout } from "@/components/AppLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Feed } from "@/pages/Feed";
import { Stats } from "@/pages/Stats";
import { Results } from "@/pages/Results";
import { Account } from "@/pages/Account";
import { NotFound } from "@/pages/NotFound";
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { AdminNewPick } from "@/pages/admin/NewPick";
import { AdminPicks } from "@/pages/admin/AllPicks";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AgeGate />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/entrar" element={<Login />} />
              <Route element={<AppLayout />}>
                <Route path="/picks" element={<Feed />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/resultados" element={<Results />} />
                <Route path="/cuenta" element={<Account />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="nuevo" element={<AdminNewPick />} />
                <Route path="picks" element={<AdminPicks />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
